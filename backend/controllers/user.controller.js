const prisma = require('../config/db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true, lastName: true,
        role: true,
        currentSchool: true,
        behanceLink: true,
        instaLink: true,
        personalLink: true,
        profilePicture: true,
        isOmniscient: true,
        isAdmin: true,
        createdAt: true,
        projects: true,
        savedProjects: { include: { project: { include: { domain: true, author: { select: { firstName: true, lastName: true, profilePicture: true } } } } } }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, role, currentSchool, behanceLink, instaLink, personalLink } = req.body;
    let updateData = { name, role, currentSchool, behanceLink, instaLink, personalLink };

    // Si une image a été uploadée, on met à jour l'URL
    if (req.file) {
      updateData.profilePicture = `/uploads/${req.file.filename}`;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: { // On ne renvoie pas le mot de passe
        id: true,
        email: true,
        firstName: true, lastName: true,
        role: true,
        currentSchool: true,
        behanceLink: true,
        instaLink: true,
        personalLink: true,
        profilePicture: true,
        isOmniscient: true,
        isAdmin: true,
      }
    });

    res.json({ message: 'Profil mis à jour avec succès', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    // Supprimer d'abord les projets pour éviter les erreurs de clés étrangères
    await prisma.project.deleteMany({
      where: { userId: req.userId }
    });

    // Supprimer l'utilisateur
    await prisma.user.delete({
      where: { id: req.userId }
    });

    // Déconnecter l'utilisateur en supprimant le cookie
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
    });

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte.' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        currentSchool: true,
        behanceLink: true,
        instaLink: true,
        personalLink: true,
        profilePicture: true,
        createdAt: true,
        projects: {
          include: { domain: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil public.' });
  }
};

exports.getSavedProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const savedProjects = await prisma.savedProject.findMany({
      where: { userId: req.userId },
      include: {
        project: {
          include: {
            domain: true,
            author: { select: { firstName: true, lastName: true, profilePicture: true } }
          }
        }
      },
      skip,
      take: limit
    });
    
    const total = await prisma.savedProject.count({ where: { userId: req.userId } });

    res.json({
      savedProjects,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalProjects: total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la récupération des projets sauvegardés.' });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Ancien et nouveau mot de passe requis.' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    if (!user || !user.password) {
      return res.status(400).json({ error: 'Utilisateur invalide ou inscrit via un service tiers.' });
    }

    const passwordMatch = await bcrypt.compare(oldPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Ancien mot de passe incorrect.' });
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit contenir au moins 8 caractères, une majuscule et un chiffre.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: req.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Mot de passe mis à jour avec succès.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la modification du mot de passe.' });
  }
};
