const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
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
    req.user = {
      id: String(payload.userId),
      username: payload.username,
      role: String(payload.role || '').toUpperCase()
    };
    return next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Session invalide ou expirée' });
  }
};
