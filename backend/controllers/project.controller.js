const prisma = require('../config/db');
const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

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
    // Extract key from URL (e.g. http://ip:9000/bucket/key -> key)
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

exports.createProject = async (req, res) => {
  try {
    const { title, description, type, school, year, domain, orientation, aspectRatio } = req.body;

    if (!title || !type || !school || !year || !domain) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (Titre, Type, Ecole, Année, Domaine).' });
    }

    if (!req.files || !req.files['pdf']) {
      return res.status(400).json({ error: 'Le fichier PDF est obligatoire.' });
    }

    const pdfUrl = req.files['pdf'][0].location;
    const pdfSizeRaw = req.files['pdf'][0].size;
    const pdfSize = (pdfSizeRaw / (1024 * 1024)).toFixed(1) + ' Mo';
    const coverUrl = req.files['cover'] ? req.files['cover'][0].location : null;
    const isDownloadAllowed = req.body.allowDownload === 'true' || req.body.allowDownload === true;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        type,
        orientation: orientation || 'portrait',
        aspectRatio: aspectRatio ? parseFloat(aspectRatio) : 1.414,
        school,
        year: parseInt(year),
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
      return res.status(400).json({ error: 'Le fichier est trop volumineux (5 Mo max).' });
    }
    res.status(500).json({ error: 'Erreur lors de la création du projet' });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { type, domain, school } = req.query;
    
    let where = {};
    if (type) where.type = type;
    if (domain) where.domain = domain;
    if (school) where.school = school;

    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        title: true,
        type: true,
        school: true,
        year: true,
        domain: true,
        coverUrl: true,
        userId: true,
        createdAt: true,
        pdfSize: true,
        pdfUrl: true,
        allowDownload: true,
        author: {
          select: { firstName: true, lastName: true, profilePicture: true, isOmniscient: true }
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

exports.updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, type, school, year, domain, orientation, aspectRatio } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    
    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Action non autorisée. Vous n\'êtes pas le créateur de ce projet.' });
    }

    let updateData = { title, description, type, school };
    if (domain) {
      updateData.domain = { connectOrCreate: { where: { name: domain }, create: { name: domain } } };
    }
    if (year) updateData.year = parseInt(year);
    if (req.body.allowDownload !== undefined) {
      updateData.allowDownload = req.body.allowDownload === 'true' || req.body.allowDownload === true;
    }

    if (req.files && req.files['pdf']) {
      await deleteFile(project.pdfUrl);
      updateData.pdfUrl = req.files['pdf'][0].location;
      updateData.pdfSize = (req.files['pdf'][0].size / (1024 * 1024)).toFixed(1) + ' Mo';
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
      return res.status(400).json({ error: 'Le fichier est trop volumineux (5 Mo max).' });
    }
    res.status(500).json({ error: 'Erreur lors de la mise à jour du projet' });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({ where: { id } });
    
    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Action non autorisée. Vous n\'êtes pas le créateur de ce projet.' });
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


exports.getProjectById = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        author: {
          select: { firstName: true, lastName: true, profilePicture: true, isOmniscient: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    res.json({ project });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération du projet' });
  }
};

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
