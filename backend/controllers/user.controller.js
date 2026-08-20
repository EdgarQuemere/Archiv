const prisma = require('../config/db');

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
        createdAt: true,
        projects: true
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
      }
    });

    res.json({ message: 'Profil mis à jour avec succès', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du profil.' });
  }
};
