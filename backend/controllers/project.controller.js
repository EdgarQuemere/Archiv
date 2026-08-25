const prisma = require('../config/db');
const { validationResult } = require('express-validator');
const { DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { s3, bucketName } = require('../config/s3');
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

// 🔧 CORRECTION : Forçage propre de la clé S3 pour pointer vers le proxy backend
const formatFileUrl = (file) => {
  if (!file) return null;
  if (file.key) {
    return `/api/files/${file.key}`;
  }
  if (file.location) {
    // Si on a une URL de type https://.../projects/nom.jpg, on extrait la fin
    const parts = file.location.split('/');
    if (parts.length >= 2) {
      const fileName = parts.pop();
      const folderName = parts.pop();
      if (folderName && fileName) {
        return `/api/files/${folderName}/${fileName}`;
      }
    }
    return file.location;
  }
  return null;
};

const deleteFile = async (fileUrl) => {
  if (!fileUrl) return;
  try {
    let key = null;
    if (fileUrl.startsWith('/api/files/')) {
      key = fileUrl.replace('/api/files/', '');
    } else {
      const urlParts = fileUrl.split(`/${bucketName}/`);
      if (urlParts.length > 1) {
        key = urlParts[1];
      }
    }

    if (key) {
      await s3.send(new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key
      }));
    }
  } catch (error) {
    console.error('Erreur lors de la suppression sur Garage:', error);
  }
};

// 1. Création d'un projet
exports.createProject = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    let { title, description, type, school, year, domain, orientation, aspectRatio } = req.body;
    if (typeof title === 'string') title = title.replace(/\r\n/g, '\n');
    if (typeof description === 'string') description = description.replace(/\r\n/g, '\n');

    if (title && title.length > 100) {
      return res.status(400).json({ error: 'Le titre ne peut pas dépasser 100 caractères.' });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'La description ne peut pas dépasser 1000 caractères.' });
    }

    const isBook = type === 'Book';
    if (!title || !type || !year || (!isBook && !school)) {
      return res.status(400).json({
        error: isBook
          ? 'Veuillez remplir tous les champs obligatoires (Titre, Type, Année).'
          : 'Veuillez remplir tous les champs obligatoires (Titre, Type, École, Année).'
      });
    }

    if (!req.files || !req.files['pdf']) {
      return res.status(400).json({ error: 'Le fichier PDF est obligatoire.' });
    }

    const slug = await generateUniqueSlug(title);
    const pdfUrl = formatFileUrl(req.files['pdf'][0]);
    const pdfSizeRaw = req.files['pdf'][0].size || 0;
    const pdfSize = req.body.pdfSizeStr || (pdfSizeRaw ? (pdfSizeRaw / (1024 * 1024)).toFixed(1) + ' Mo' : 'Inconnu');
    const coverUrl = req.files['cover'] ? formatFileUrl(req.files['cover'][0]) : null;
    const isDownloadAllowed = req.body.allowDownload === 'true' || req.body.allowDownload === true;

    // Construction propre des données de base
    const projectData = {
      title,
      slug,
      description,
      type,
      orientation: orientation || 'portrait',
      aspectRatio: aspectRatio ? parseFloat(aspectRatio) : 1.414,
      school: school || '',
      year: parseInt(year, 10),
      pdfUrl,
      pdfSize,
      coverUrl,
      allowDownload: isDownloadAllowed,
      author: { connect: { id: req.userId } }
    };

    // Ajout conditionnel du domaine s'il est valide
    if (domain && domain.trim() !== '' && domain !== 'Tous les domaines') {
      projectData.domain = { connect: { name: domain } };
    }

    const project = await prisma.project.create({
      data: projectData
    });

    res.status(201).json({ message: 'Projet créé avec succès', project });
  } catch (error) {
    console.error(error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Le fichier est trop volumineux.' });
    }
    if (error.code === 'P2025') {
      return res.status(400).json({ error: 'Le domaine sélectionné n\'existe pas en base de données.' });
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
        viewsCount: true,
        allowDownload: true,
        downloadsCount: true,
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
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    let viewedProjects = [];
    if (req.cookies.viewed_projects) {
      try {
        viewedProjects = JSON.parse(req.cookies.viewed_projects);
      } catch (e) {
        viewedProjects = [];
      }
    }

    const hasViewed = viewedProjects.includes(project.id);
    let finalProject;

    const selectObj = {
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
      downloadsCount: true,
      viewsCount: true,
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
    };

    if (!hasViewed) {
      viewedProjects.push(project.id);
      if (viewedProjects.length > 100) viewedProjects = viewedProjects.slice(-100);
      
      res.cookie('viewed_projects', JSON.stringify(viewedProjects), {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
      });

      finalProject = await prisma.project.update({
        where: { id: project.id },
        data: { viewsCount: (project.viewsCount || 0) + 1 },
        select: selectObj
      });
    } else {
      finalProject = await prisma.project.findUnique({
        where: { id: project.id },
        select: selectObj
      });
    }

    res.json({ project: finalProject });
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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    let { title, description, type, school, year, domain, orientation, aspectRatio } = req.body;
    if (typeof title === 'string') title = title.replace(/\r\n/g, '\n');
    if (typeof description === 'string') description = description.replace(/\r\n/g, '\n');

    if (title && title.length > 100) {
      return res.status(400).json({ error: 'Le titre ne peut pas dépasser 100 caractères.' });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'La description ne peut pas dépasser 1000 caractères.' });
    }

    const project = await prisma.project.findUnique({ where: { id } });

    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Action non autorisée.' });
    }

    let updateData = { description, type, school: school || '' };

    if (title && title !== project.title) {
      updateData.title = title;
      updateData.slug = await generateUniqueSlug(title, id);
    }

    if (orientation) updateData.orientation = orientation;
    if (aspectRatio) updateData.aspectRatio = parseFloat(aspectRatio);

    if (domain && domain.trim() !== '' && domain !== 'Tous les domaines') {
      updateData.domain = { connect: { name: domain } };
    } else {
      updateData.domain = { disconnect: true }; // Permet de retirer le domaine si l'utilisateur le vide
    }

    if (year) updateData.year = parseInt(year, 10);
    if (req.body.allowDownload !== undefined) {
      updateData.allowDownload = req.body.allowDownload === 'true' || req.body.allowDownload === true;
    }

    if (req.files && req.files['pdf']) {
      await deleteFile(project.pdfUrl);
      updateData.pdfUrl = formatFileUrl(req.files['pdf'][0]);
      updateData.pdfSize = req.body.pdfSizeStr || (req.files['pdf'][0].size ? (req.files['pdf'][0].size / (1024 * 1024)).toFixed(1) + ' Mo' : 'Inconnu');
    }

    if (req.files && req.files['cover']) {
      if (project.coverUrl) await deleteFile(project.coverUrl);
      updateData.coverUrl = formatFileUrl(req.files['cover'][0]);
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
    if (error.code === 'P2025') {
      return res.status(400).json({ error: 'Le domaine sélectionné n\'existe pas en base de données.' });
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

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ error: 'Projet introuvable.' });

    const existing = await prisma.savedProject.findUnique({
      where: {
        userId_projectId: { userId: req.userId, projectId: id }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Projet déjà enregistré.' });
    }

    await prisma.savedProject.create({
      data: { userId: req.userId, projectId: id }
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

    const existing = await prisma.savedProject.findUnique({
      where: {
        userId_projectId: { userId: req.userId, projectId: id }
      }
    });

    if (!existing) {
      return res.status(400).json({ error: 'Projet non enregistré.' });
    }

    await prisma.savedProject.delete({
      where: {
        userId_projectId: { userId: req.userId, projectId: id }
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