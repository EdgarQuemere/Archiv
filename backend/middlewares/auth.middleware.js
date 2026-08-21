const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const requireAuth = async (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Veuillez vous connecter.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Vérifier si l'utilisateur est banni
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isBanned: true }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Utilisateur introuvable.' });
    }
    
    if (user.isBanned) {
      res.clearCookie('auth_token');
      return res.status(403).json({ error: 'Votre compte a été banni. Contactez l\'administrateur.' });
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

module.exports = requireAuth;
