const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// ⭐⭐ IMPORTANT : Ajouter ce middleware pour vérifier que JWT_SECRET existe ⭐⭐
router.use((req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET non défini dans .env');
    return res.status(500).json({ 
      success: false,
      message: 'Erreur de configuration serveur' 
    });
  }
  next();
});

// 🆕 FONCTION DE DEBUG COMPLÈTE
async function comparePasswordAdvanced(plainPassword, storedHash) {
  if (typeof plainPassword !== 'string' || typeof storedHash !== 'string') return false;
  try {
    return await bcrypt.compare(plainPassword, storedHash);
  } catch (error) {
    console.error('Password comparison failed:', error.message);
    return false;
  }
}

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, prenom, nom, telephone } = req.body || {};


    // Validation des données
    if (typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string' || !username.trim() || !email.trim() || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Nom d\'utilisateur, email et mot de passe sont requis' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Normaliser les données
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ 
      $or: [ 
        { username: normalizedUsername }, 
        { email: normalizedEmail } 
      ] 
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: existingUser.username === normalizedUsername 
          ? 'Ce nom d\'utilisateur est déjà utilisé' 
          : 'Cet email est déjà utilisé'
      });
    }

    // ⭐⭐ HASHER LE MOT DE PASSE - VERSION SIMPLIFIÉE ⭐⭐
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    

    // Créer le nouvel utilisateur
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      prenom: typeof prenom === 'string' ? prenom.trim() : '',
      nom: typeof nom === 'string' ? nom.trim() : '',
      telephone: typeof telephone === 'string' ? telephone.trim() : '',
      role: 'USER',
      actif: true
    });

    await newUser.save();


    // Générer le token JWT
    const token = jwt.sign(
      { 
        userId: newUser._id, 
        username: newUser.username,
        role: newUser.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Retourner la réponse
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      prenom: newUser.prenom,
      nom: newUser.nom,
      role: newUser.role,
      email: newUser.email,
      telephone: newUser.telephone,
      actif: newUser.actif,
      createdAt: newUser.createdAt
    };


    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: userResponse
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Username or email is already in use' });
    }
    console.error('Registration failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to create account',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Connexion - VERSION CORRIGÉE
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (typeof username !== 'string' || !username.trim() || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: "Nom d'utilisateur et mot de passe requis" });
    }

    const normalizedInput = username.trim().toLowerCase();
    const user = await User.findOne({ $or: [{ username: normalizedInput }, { email: normalizedInput }] });
    if (!user || !(await comparePasswordAdvanced(password, user.password))) {
      return res.status(401).json({ success: false, message: 'Identifiants incorrects' });
    }
    if (!user.actif) {
      return res.status(403).json({ success: false, message: "Compte desactive. Contactez l'administrateur." });
    }

    user.lastLogin = new Date();
    await user.save();
    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    const userResponse = {
      id: user._id,
      username: user.username,
      prenom: user.prenom,
      nom: user.nom,
      role: user.role,
      email: user.email,
      telephone: user.telephone,
      actif: user.actif,
      lastLogin: user.lastLogin
    };

    return res.json({ success: true, message: 'Connexion reussie', token, user: userResponse });
  } catch (error) {
    console.error('Login failed:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Token verification routes follow.
router.post('/verify-token', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Token manquant ou format incorrect' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token manquant' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true, 
      valid: true, 
      user: {
        id: user._id,
        username: user.username,
        prenom: user.prenom,
        nom: user.nom,
        role: user.role,
        email: user.email,
        telephone: user.telephone,
        actif: user.actif
      }
    });
    
  } catch (error) {
    console.error('❌ ERREUR VÉRIFICATION TOKEN:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Token invalide ou expiré' 
    });
  }
});

// Vérification du token (GET pour le AuthContext)
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false,
        message: 'Token manquant ou format incorrect' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        message: 'Token manquant' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'Utilisateur non trouvé' 
      });
    }

    res.json({ 
      success: true,
      user: {
        id: user._id,
        username: user.username,
        prenom: user.prenom,
        nom: user.nom,
        role: user.role,
        email: user.email,
        telephone: user.telephone,
        actif: user.actif
      }
    });

  } catch (error) {
    console.error('❌ ERREUR VÉRIFICATION TOKEN GET:', error.message);
    res.status(401).json({ 
      success: false,
      message: 'Token invalide ou expiré' 
    });
  }
});

// Connexion rapide pour les tests
router.post('/test-login', async (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ 
      success: false,
      message: 'Non disponible en production' 
    });
  }

  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: 'Rôle requis' 
      });
    }
    
    const testUsers = {
      RSC: {
        username: 'jdupont',
        password: 'rsc123456',
        prenom: 'Jean',
        nom: 'Dupont',
        role: 'RSC',
        email: 'jdupont@repappburo.test',
        telephone: '01 23 45 67 89'
      },
      USER: {
        username: 'testuser',
        password: 'test123456',
        prenom: 'Test',
        nom: 'Utilisateur',
        role: 'USER',
        email: 'test@repappburo.test',
        telephone: '01 23 45 67 93'
      }
    };

    const testUser = testUsers[role];
    if (!testUser) {
      return res.status(400).json({ 
        success: false,
        message: 'Rôle invalide' 
      });
    }

    const normalizedUsername = testUser.username.toLowerCase();
    let user = await User.findOne({ username: normalizedUsername });
    
    if (!user) {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      user = new User({
        ...testUser,
        username: normalizedUsername,
        email: testUser.email.toLowerCase(),
        password: hashedPassword,
        actif: true
      });
      await user.save();
      console.log('✅ Utilisateur de test créé:', normalizedUsername);
    }

    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username,
        role: user.role,
        prenom: user.prenom,
        nom: user.nom
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user._id,
      username: user.username,
      prenom: user.prenom,
      nom: user.nom,
      role: user.role,
      email: user.email,
      telephone: user.telephone,
      actif: user.actif
    };

    res.json({
      success: true,
      token,
      user: userResponse,
      isTestMode: true
    });

  } catch (error) {
    console.error('🔥 ERREUR TEST-LOGIN:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur' 
    });
  }
});

// Déconnexion
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

// Route de test de l'API
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'API Auth fonctionnelle',
    timestamp: new Date(),
    env: process.env.NODE_ENV
  });
});

module.exports = router;