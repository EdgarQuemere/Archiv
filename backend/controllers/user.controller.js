const prisma = require('../config/db');
const bcrypt = require('bcrypt');

exports.getProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        pseudo: true,
        displayPreference: true,
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
        savedProjects: {
          include: {
            project: {
              include: {
                domain: true,
                author: {
                  select: {
                    firstName: true,
                    lastName: true,
                    pseudo: true,
                    displayPreference: true,
                    profilePicture: true
                  }
                }
              }
            }
          }
        }
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
    if (req.body.email) {
      return res.status(400).json({ error: "La modification de l'adresse e-mail n'est pas autorisée." });
    }

    const {
      firstName,
      lastName,
      pseudo,
      displayPreference,
      role,
      currentSchool,
      behanceLink,
      instaLink,
      personalLink
    } = req.body;

    let updateData = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (displayPreference !== undefined) updateData.displayPreference = displayPreference;
    if (role !== undefined) updateData.role = role;
    if (currentSchool !== undefined) updateData.currentSchool = currentSchool;
    if (behanceLink !== undefined) updateData.behanceLink = behanceLink;
    if (instaLink !== undefined) updateData.instaLink = instaLink;
    if (personalLink !== undefined) updateData.personalLink = personalLink;

    // Vérification et unicité du pseudo s'il est modifié
    if (pseudo) {
      const cleanPseudo = pseudo.trim().toLowerCase();
      const existing = await prisma.user.findFirst({
        where: {
          pseudo: cleanPseudo,
          NOT: { id: req.userId }
        }
      });

      if (existing) {
        return res.status(400).json({ error: 'Ce pseudo est déjà utilisé.' });
      }

      updateData.pseudo = cleanPseudo;
    }

    // Image de profil
    if (req.file) {
      updateData.profilePicture = req.file.location;
    }

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        pseudo: true,
        displayPreference: true,
        role: true,
        currentSchool: true,
        behanceLink: true,
        instaLink: true,
        personalLink: true,
        profilePicture: true,
        isOmniscient: true,
        isAdmin: true
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
    const { reason } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
        pseudo: true,
        role: true,
        currentSchool: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur introuvable.' });
    }

    await prisma.deletedAccount.create({
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        pseudo: user.pseudo,
        role: user.role,
        school: user.currentSchool,
        reason: reason || 'Aucune raison fournie'
      }
    });

    await prisma.savedProject.deleteMany({ where: { userId: req.userId } });
    await prisma.project.deleteMany({ where: { userId: req.userId } });

    await prisma.user.delete({
      where: { id: req.userId }
    });

    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none'
    });

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Delete Account Error:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du compte.' });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const identifier = req.params.id || req.params.identifier;

    if (!identifier || identifier === 'undefined' || identifier === 'null') {
      return res.status(400).json({ error: 'Identifiant ou pseudo manquant.' });
    }

    const cleanIdentifier = decodeURIComponent(identifier).trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { pseudo: cleanIdentifier },
          { pseudo: cleanIdentifier.toLowerCase() },
          { id: cleanIdentifier }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        pseudo: true,
        displayPreference: true,
        role: true,
        currentSchool: true,
        behanceLink: true,
        instaLink: true,
        personalLink: true,
        profilePicture: true,
        isOmniscient: true,
        createdAt: true,
        projects: {
          select: {
            id: true,
            slug: true,
            title: true,
            description: true,
            type: true,
            school: true,
            year: true,
            coverUrl: true,
            pdfUrl: true,
            pdfSize: true,
            orientation: true,
            aspectRatio: true,
            allowDownload: true,
            createdAt: true,
            domain: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    res.json(user);
  } catch (error) {
    console.error('Erreur getPublicProfile:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération du profil public.' });
  }
};

exports.getSavedProjects = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const savedProjects = await prisma.savedProject.findMany({
      where: { userId: req.userId },
      include: {
        project: {
          include: {
            domain: true,
            author: {
              select: {
                firstName: true,
                lastName: true,
                pseudo: true,
                displayPreference: true,
                profilePicture: true
              }
            }
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