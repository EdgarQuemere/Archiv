const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const requireAdmin = async (req, res, next) => {
  try {
    const token = req.cookies.auth_token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non autorisé - Token manquant' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key');
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable' });
    if (!user.isAdmin) return res.status(403).json({ message: 'Accès refusé - Privilèges administrateur requis' });

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Non autorisé - Token invalide' });
  }
};
module.exports = requireAdmin;