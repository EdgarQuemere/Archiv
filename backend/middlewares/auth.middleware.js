const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(401).json({ error: 'Accès refusé. Veuillez vous connecter.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId; // On stocke l'ID de l'utilisateur dans la requête
    next();
  } catch (err) {
    res.status(401).json({ error: 'Token invalide ou expiré.' });
  }
};

module.exports = requireAuth;
