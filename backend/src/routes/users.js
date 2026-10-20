const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const authenticate = require('../middleware/auth');

const router = express.Router();
const allowedRoles = ['USER', 'RSC', 'TECHNICIEN', 'RESPONSABLE', 'ADMIN'];
const normalizePhone = (telephone) => typeof telephone === 'string'
  ? telephone.replace(/[\s().-]/g, '')
  : '';

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Accès réservé à l’administration' });
  }
  return next();
};

const toPublicUser = (user) => ({
  id: String(user._id),
  username: user.username,
  email: user.email,
  prenom: user.prenom,
  nom: user.nom,
  role: user.role,
  telephone: user.telephone,
  actif: user.actif,
  createdAt: user.createdAt,
  lastLogin: user.lastLogin
});

router.use(authenticate, requireAdmin);

router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return res.json(users.map(toPublicUser));
  } catch (error) {
    console.error('Unable to list users:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de charger les comptes' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { username, email, password, role, prenom, nom, telephone } = req.body || {};
    if ([username, email, password, role].some((value) => typeof value !== 'string' || !value.trim())) {
      return res.status(400).json({ success: false, message: 'Nom, email, mot de passe et rôle sont requis' });
    }
    if (!allowedRoles.includes(role.trim().toUpperCase())) {
      return res.status(400).json({ success: false, message: 'Rôle invalide' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await User.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
    if (duplicate) {
      return res.status(409).json({ success: false, message: 'Ce nom d’utilisateur ou cet email est déjà utilisé' });
    }

    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
      role: role.trim().toUpperCase(),
      prenom: typeof prenom === 'string' ? prenom.trim() : '',
      nom: typeof nom === 'string' ? nom.trim() : '',
      telephone: normalizePhone(telephone),
      actif: true
    });
    return res.status(201).json(toPublicUser(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ce nom d’utilisateur ou cet email est déjà utilisé' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Unable to create user:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de créer le compte' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Compte introuvable' });

    const { username, email, password, role, prenom, nom, telephone, actif } = req.body || {};
    const nextRole = role === undefined ? user.role : String(role).trim().toUpperCase();
    const nextActive = typeof actif === 'boolean' ? actif : user.actif;
    if (!allowedRoles.includes(nextRole)) {
      return res.status(400).json({ success: false, message: 'Rôle invalide' });
    }
    if (user.role === 'ADMIN' && user.actif && (nextRole !== 'ADMIN' || !nextActive)) {
      const activeAdminCount = await User.countDocuments({ role: 'ADMIN', actif: true });
      if (activeAdminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Le dernier compte administrateur actif doit être conservé' });
      }
    }
    if (String(user._id) === req.user.id && (nextRole !== 'ADMIN' || !nextActive)) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas désactiver ou rétrograder votre propre compte' });
    }
    if (username !== undefined) user.username = String(username).trim().toLowerCase();
    if (email !== undefined) user.email = String(email).trim().toLowerCase();
    user.role = nextRole;
    if (password !== undefined && password !== '') {
      if (typeof password !== 'string' || password.length < 6) {
        return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });
      }
      user.password = await bcrypt.hash(password, 12);
    }
    if (prenom !== undefined) user.prenom = String(prenom).trim();
    if (nom !== undefined) user.nom = String(nom).trim();
    if (telephone !== undefined) user.telephone = normalizePhone(String(telephone));
    user.actif = nextActive;

    await user.save();
    return res.json(toPublicUser(user));
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Ce nom d’utilisateur ou cet email est déjà utilisé' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Unable to update user:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de modifier le compte' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (String(req.user.id) === req.params.id) {
      return res.status(400).json({ success: false, message: 'Vous ne pouvez pas supprimer votre propre compte' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'Compte introuvable' });
    if (user.role === 'ADMIN') {
      const adminCount = await User.countDocuments({ role: 'ADMIN', actif: true });
      if (adminCount <= 1) {
        return res.status(400).json({ success: false, message: 'Le dernier compte administrateur ne peut pas être supprimé' });
      }
    }
    await user.deleteOne();
    return res.json({ success: true, id: String(user._id) });
  } catch (error) {
    console.error('Unable to delete user:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de supprimer le compte' });
  }
});

module.exports = router;
