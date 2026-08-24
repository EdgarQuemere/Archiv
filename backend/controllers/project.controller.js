const prisma = require('../config/db');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

// Fonction utilitaire pour nettoyer et créer un slug
function slugify(text) {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function generateUniqueSlug(title, excludeId = null) {
  const baseSlug = slugify(title) || 'projet';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prisma.project.findUnique({
      where: { slug }
    });

    if (!existing || (excludeId && existing.id === excludeId)) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

const s3 = new S3Client({
  endpoint: process.env.MINIO_ENDPOINT,
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY,
    secretAccessKey: process.env.MINIO_SECRET_KEY,
  },
  forcePathStyle: true,
});

const bucketName = process.env.MINIO_BUCKET_NAME || 'archiv-uploads';

const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    const urlParts = fileUrl.split(`/${bucketName}/`);
    if (urlParts.length > 1) {
      const key = urlParts[1];
      await s3.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      }));
    }
  } catch (error) {
    console.error('Erreur lors de la suppression sur MinIO:', error);
  }
};

// 1. Création d'un projet
exports.createProject = async (req, res) => {
  try {
    const { title, description, type, school, year, domain, orientation, aspectRatio } = req.body;

    if (!title || !type || !school || !year || !domain) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (Titre, Type, École, Année, Domaine).' });
    }

    if (!req.files || !req.files['pdf']) {
      return res.status(400).json({ error: 'Le fichier PDF est obligatoire.' });
    }

    const slug = await generateUniqueSlug(title);
    const pdfUrl = req.files['pdf'][0].location;
    const pdfSizeRaw = req.files['pdf'][0].size || 0;
    const pdfSize = req.body.pdfSizeStr || (pdfSizeRaw ? (pdfSizeRaw / (1024 * 1024)).toFixed(1) + ' Mo' : 'Inconnu');
    const coverUrl = req.files['cover'] ? req.files['cover'][0].location : null;
    const isDownloadAllowed = req.body.allowDownload === 'true' || req.body.allowDownload === true;

    const project = await prisma.project.create({
      data: {
        title,
        slug,
        description,
        type,
        orientation: orientation || 'portrait',
        aspectRatio: aspectRatio ? parseFloat(aspectRatio) : 1.414,
        school,
        year: parseInt(year, 10),
        domain: { connectOrCreate: { where: { name: domain }, create: { name: domain } } },
        pdfUrl,
        pdfSize,
        coverUrl,
        allowDownload: isDownloadAllowed,
        author: { connect: { id: req.userId } }
      }
    });

    res.status(201).json({ message: 'Projet créé avec succès', project });
  } catch (error) {
    console.error(error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux.' });
    }
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
};

// 2. Liste paginée de tous les projets
exports.getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 40;
    const skip = (page - 1) * limit;

    const { type, domain, school } = req.query;
    
    let where = {};
    if (type && type !== 'Tous') where.type = type;
    if (domain && domain !== 'Tous les domaines') where.domain = domain;
    if (school && school !== 'Toutes les écoles') where.school = school;

    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        school: true,
        year: true,
        domain: true,
        coverUrl: true,
        orientation: true,
        aspectRatio: true,
        userId: true,
        createdAt: true,
        pdfSize: true,
        pdfUrl: true,
        allowDownload: true,
        author: {
          select: { firstName: true, lastName: true, pseudo: true, profilePicture: true, isOmniscient: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.project.count({ where });

    res.json({
      projects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProjects: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des projets' });
  }
};

// 3. Récupération d'un projet individuel (par Slug ou par ID)
exports.getProject = async (req, res) => {
  try {
    const { identifier } = req.params;

    if (!identifier) {
      return res.status(400).json({ error: 'Identifiant ou slug requis' });
    }

    const project = await prisma.project.findFirst({
      where: {
        OR: [
          { slug: identifier },
          { id: identifier }
        ]
      },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        school: true,
        year: true,
        domain: true,
        description: true,
        coverUrl: true,
        pdfUrl: true,
        pdfSize: true,
        orientation: true,
        aspectRatio: true,
        allowDownload: true,
        userId: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            pseudo: true,
            profilePicture: true,
            isOmniscient: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
  }
};

// 4. Alias pour la rétrocompatibilité
exports.getProjectById = exports.getProject;

// 5. Mise à jour d'un projet
exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, school, year, domain, orientation, aspectRatio } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    let updateData = { description, type, school };

    if (title && title !== project.title) {
      updateData.title = title;
      updateData.slug = await generateUniqueSlug(title, id);
    }

    if (orientation) updateData.orientation = orientation;
    if (aspectRatio) updateData.aspectRatio = parseFloat(aspectRatio);

    if (domain) {
      updateData.domain = { connectOrCreate: { where: { name: domain }, create: { name: domain } } };
    }
    if (year) updateData.year = parseInt(year, 10);
    if (req.body.allowDownload !== undefined) {
      updateData.allowDownload = req.body.allowDownload === 'true' || req.body.allowDownload === true;
    }

    if (req.files && req.files['pdf']) {
      await deleteFile(project.pdfUrl);
      updateData.pdfUrl = req.files['pdf'][0].location;
      updateData.pdfSize = req.body.pdfSizeStr || (req.files['pdf'][0].size ? (req.files['pdf'][0].size / (1024 * 1024)).toFixed(1) + ' Mo' : 'Inconnu');
    }

    if (req.files && req.files['cover']) {
      if (project.coverUrl) await deleteFile(project.coverUrl);
      updateData.coverUrl = req.files['cover'][0].location;
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData
    });

    res.json({ message: 'Projet mis à jour avec succès', project: updatedProject });
  } catch (error) {
    console.error(error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux.' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
};

// 6. Suppression d'un projet
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    await deleteFile(project.pdfUrl);
    if (project.coverUrl) await deleteFile(project.coverUrl);

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
};

// 7. Enregistrer un projet (Favoris)
exports.saveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Projet introuvable.' });

    const existing = await prisma.savedProject.findUnique({
      where: {
        userId_projectId: { userId, projectId: id }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Projet déjà enregistré.' });
    }

    await prisma.savedProject.create({
      data: { userId, projectId: id }
    });

    res.json({ message: 'Projet enregistré avec succès' });
  } catch (error) {
    console.error("Save Project Error:", error);
    res.status(500).json({ error: 'Erreur lors de l\'enregistrement du projet.' });
  }
};

// 8. Retirer un projet des favoris
exports.unsaveProject = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const existing = await prisma.savedProject.findUnique({
      where: {
        userId_projectId: { userId, projectId: id }
      }
    });

    if (!existing) {
      return res.status(400).json({ error: 'Projet non enregistré.' });
    }

    await prisma.savedProject.delete({
      where: {
        userId_projectId: { userId, projectId: id }
      }
    });

    res.json({ message: 'Projet retiré des enregistrements avec succès' });
  } catch (error) {
    console.error("Unsave Project Error:", error);
    res.status(500).json({ error: 'Erreur lors du retrait du projet.' });
  }
};

// 9. Téléchargement du projet
exports.downloadProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    if (!project.allowDownload) {
      return res.status(403).json({ error: 'L\'auteur n\'a pas autorisé le téléchargement de ce projet.' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: { downloadsCount: { increment: 1 } }
    });

    res.json({ pdfUrl: project.pdfUrl, downloadsCount: updatedProject.downloadsCount });
  } catch (error) {
    console.error("Download Project Error:", error);
    res.status(500).json({ error: 'Erreur lors de la demande de téléchargement.' });
  }
};