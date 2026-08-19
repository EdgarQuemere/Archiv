const prisma = require('../config/db');
const fs = require('fs');
const path = require('path');

const deleteFile = (filePath) => {
  if (!filePath) return;
  const fullPath = path.join(__dirname, '..', filePath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
  }
};

exports.createProject = async (req, res) => {
  try {
    const { title, description, type, school, year, domain } = req.body;

    if (!title || !type || !school || !year || !domain) {
      return res.status(400).json({ error: 'Veuillez remplir tous les champs obligatoires (Titre, Type, Ecole, Année, Domaine).' });
    }

    if (!req.files || !req.files['pdf']) {
      return res.status(400).json({ error: 'Le fichier PDF est obligatoire.' });
    }

    const pdfUrl = `/uploads/${req.files['pdf'][0].filename}`;
    const coverUrl = req.files['cover'] ? `/uploads/${req.files['cover'][0].filename}` : null;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        type,
        school,
        year: parseInt(year),
        domain,
        pdfUrl,
        coverUrl,
        userId: req.userId 
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
    
    // Construction du filtre (si les champs sont fournis)
    let where = {};
    if (type) where.type = type;
    if (domain) where.domain = domain;
    if (school) where.school = school;

    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: {
          select: { name: true, profilePicture: true }
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
    const { title, description, type, school, year, domain } = req.body;

    const project = await prisma.project.findUnique({ where: { id } });
    
    if (!project) {
      return res.status(404).json({ error: 'Projet introuvable.' });
    }

    if (project.userId !== req.userId) {
      return res.status(403).json({ error: 'Action non autorisée. Vous n\'êtes pas le créateur de ce projet.' });
    }

    let updateData = { title, description, type, school, domain };
    if (year) updateData.year = parseInt(year);

    if (req.files && req.files['pdf']) {
      deleteFile(project.pdfUrl); // On supprime l'ancien PDF
      updateData.pdfUrl = `/uploads/${req.files['pdf'][0].filename}`;
    }

    if (req.files && req.files['cover']) {
      if (project.coverUrl) deleteFile(project.coverUrl); // On supprime l'ancienne image
      updateData.coverUrl = `/uploads/${req.files['cover'][0].filename}`;
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

    // On supprime les fichiers associés
    deleteFile(project.pdfUrl);
    if (project.coverUrl) deleteFile(project.coverUrl);

    await prisma.project.delete({ where: { id } });

    res.json({ message: 'Projet supprimé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la suppression du projet' });
  }
};
