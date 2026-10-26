const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentification requise' });
  }
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ success: false, message: 'Erreur de configuration serveur' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select('_id username role actif');
    if (!user || !user.actif) {
      return res.status(401).json({ success: false, message: 'Compte introuvable ou désactivé' });
    }

    req.user = {
      id: String(user._id),
      username: user.username,
      role: String(user.role || '').toUpperCase()
    };
    return next();
  } catch (error) {
    if (error.name !== 'JsonWebTokenError' && error.name !== 'TokenExpiredError' && error.name !== 'NotBeforeError') {
      console.error('Authentication lookup failed:', error.message);
      return res.status(503).json({ success: false, message: 'Service d’authentification indisponible' });
    }
    return res.status(401).json({ success: false, message: 'Session invalide ou expirée' });
  }
};
