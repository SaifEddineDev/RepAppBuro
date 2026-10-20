const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
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
async function debugPasswordComparison(plainPassword, storedHash, username) {
  console.log('\n🔬 DEBUG COMPLET POUR:', username);
  console.log('='.repeat(50));
  
  // 1. Analyser le hash stocké
  console.log('1. ANALYSE DU HASH STOCKÉ:');
  console.log('   - Hash complet:', storedHash);
  console.log('   - Longueur:', storedHash.length);
  console.log('   - Début:', storedHash.substring(0, 30));
  console.log('   - Version bcrypt:', storedHash.substring(0, 4));
  
  // 2. Extraire les composants du hash bcrypt
  const hashParts = storedHash.split('$');
  if (hashParts.length >= 4) {
    console.log('\n2. DÉCOMPOSITION BCRYPT:');
    console.log('   - Algorithme:', hashParts[1]);
    console.log('   - Cost factor:', hashParts[2]);
    console.log('   - Salt (22 premiers chars):', hashParts[3].substring(0, 22));
  }
  
  // 3. Essayer différentes méthodes de comparaison
  console.log('\n3. TESTS DE COMPARAISON:');
  
  // Méthode 1: bcrypt.compare standard
  try {
    const result1 = await bcrypt.compare(plainPassword, storedHash);
    console.log('   Méthode 1 (bcrypt.compare):', result1 ? '✓' : '✗');
  } catch (e) {
    console.log('   Méthode 1: Erreur', e.message);
  }
  
  // Méthode 2: Extraction du salt manuel
  try {
    const salt = storedHash.substring(0, 29);
    const testHash = await bcrypt.hash(plainPassword, salt);
    console.log('   Méthode 2 (salt extrait):', testHash === storedHash ? '✓' : '✗');
    console.log('   - Test hash:', testHash.substring(0, 30) + '...');
  } catch (e) {
    console.log('   Méthode 2: Erreur', e.message);
  }
  
  // Méthode 3: Générer un nouveau hash complet
  try {
    const testHash = await bcrypt.hash(plainPassword, 10);
    console.log('   Méthode 3 (nouveau hash):', testHash.substring(0, 30) + '...');
    console.log('   - Version:', testHash.substring(0, 4));
  } catch (e) {
    console.log('   Méthode 3: Erreur', e.message);
  }
  
  console.log('='.repeat(50) + '\n');
}

// 🆕 FONCTION DE COMPARAISON AMÉLIORÉE
async function comparePasswordAdvanced(plainPassword, storedHash) {
  try {
    console.log('🔍 Comparaison avancée démarrée...');
    
    // 1. Vérifier si le hash est valide
    if (!storedHash || storedHash.length !== 60) {
      console.log('❌ Hash invalide - longueur incorrecte');
      return false;
    }
    
    if (!storedHash.startsWith('$2')) {
      console.log('❌ Hash invalide - pas un hash bcrypt');
      return false;
    }
    
    // 2. Essayer bcrypt.compare d'abord (la méthode standard)
    console.log('   Essai 1: bcrypt.compare standard...');
    const directCompare = await bcrypt.compare(plainPassword, storedHash);
    if (directCompare) {
      console.log('   ✅ bcrypt.compare: SUCCÈS');
      return true;
    }
    console.log('   ❌ bcrypt.compare: ÉCHEC');
    
    // 3. Si bcrypt.compare échoue, essayer avec salt extrait
    console.log('   Essai 2: Extraction du salt...');
    const saltFromHash = storedHash.substring(0, 29);
    const regeneratedHash = await bcrypt.hash(plainPassword, saltFromHash);
    
    console.log('   - Salt utilisé:', saltFromHash.substring(0, 15) + '...');
    console.log('   - Hash régénéré (début):', regeneratedHash.substring(0, 30));
    console.log('   - Hash stocké (début):', storedHash.substring(0, 30));
    
    if (regeneratedHash === storedHash) {
      console.log('   ✅ Comparaison avec salt extrait: SUCCÈS');
      return true;
    }
    console.log('   ❌ Comparaison avec salt extrait: ÉCHEC');
    
    // 4. Si les deux méthodes échouent, le mot de passe est incorrect
    console.log('   ⚠️  Toutes les méthodes ont échoué');
    return false;
    
  } catch (error) {
    console.error('   💥 Erreur dans comparePasswordAdvanced:', error.message);
    return false;
  }
}

// 🆕 ROUTE POUR VÉRIFIER LE MOT DE PASSE STOCKÉ
router.post('/debug-password', async (req, res) => {
  try {
    const { username, testPassword } = req.body;
    
    if (!username) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur requis'
      });
    }
    
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    console.log('\n🔍 DEBUG MANUEL POUR:', user.username);
    console.log('📋 Hash stocké:', user.password);
    console.log('📋 Longueur:', user.password.length);
    
    // Vérifier si c'est un hash bcrypt valide
    const isBcryptHash = user.password.startsWith('$2a$') || 
                        user.password.startsWith('$2b$') || 
                        user.password.startsWith('$2y$');
    
    console.log('✅ Format bcrypt valide:', isBcryptHash);
    
    if (testPassword) {
      console.log('🧪 Test avec mot de passe fourni...');
      const isMatch = await bcrypt.compare(testPassword, user.password);
      console.log('🔍 Résultat:', isMatch ? '✓ CORRECT' : '✗ INCORRECT');
      
      // Essayer aussi avec salt extrait
      const salt = user.password.substring(0, 29);
      const testHash = await bcrypt.hash(testPassword, salt);
      console.log('🔧 Hash test généré:', testHash.substring(0, 30) + '...');
      console.log('🔧 Correspondance exacte:', testHash === user.password);
    }
    
    res.json({
      success: true,
      username: user.username,
      hash: user.password,
      hashLength: user.password.length,
      isBcryptValid: isBcryptHash,
      hashVersion: user.password.substring(0, 4)
    });
    
  } catch (error) {
    console.error('❌ Erreur debug:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de debug'
    });
  }
});

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, prenom, nom, telephone } = req.body;

    console.log('📝 TENTATIVE INSCRIPTION:', { 
      username, 
      email, 
      passwordLength: password ? password.length : 0 
    });

    // Validation des données
    if (!username || !email || !password) {
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
    console.log('🔐 Hashage du mot de passe...');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    console.log('✅ Mot de passe hashé avec succès');
    console.log('📋 Hash (début):', hashedPassword.substring(0, 30) + '...');
    console.log('📋 Version:', hashedPassword.substring(0, 4));

    // Créer le nouvel utilisateur
    const newUser = new User({
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      prenom: (prenom || '').trim(),
      nom: (nom || '').trim(),
      telephone: (telephone || '').trim(),
      role: 'USER',
      actif: true
    });

    await newUser.save();

    console.log('✅ UTILISATEUR CRÉÉ:', normalizedUsername);

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

    console.log('🎉 INSCRIPTION RÉUSSIE');

    res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('🔥 ERREUR INSCRIPTION:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur lors de la création du compte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Connexion - VERSION CORRIGÉE
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    

    console.log('\n' + '='.repeat(50));
    console.log('🔑 TENTATIVE CONNEXION POUR:', username);
    console.log('='.repeat(50));

    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis' 
      });
    }

    // Normaliser
    const normalizedInput = username.trim().toLowerCase();

    // Chercher l'utilisateur
    const user = await User.findOne({ 
      $or: [
        { username: normalizedInput },
        { email: normalizedInput }
      ]
    });

    if (!user) {
      console.log('❌ UTILISATEUR NON TROUVÉ:', normalizedInput);
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    console.log('✅ UTILISATEUR TROUVÉ:', user.username);
    console.log('📋 Hash stocké (début):', user.password.substring(0, 30) + '...');
    console.log('📋 Version bcrypt:', user.password.substring(0, 4));

    // ⭐⭐ UTILISER LA FONCTION DE COMPARAISON AMÉLIORÉE ⭐⭐
    const isPasswordValid = await comparePasswordAdvanced(password, user.password);
    
    console.log('\n🎯 RÉSULTAT FINAL:', isPasswordValid ? '✓ CORRECT' : '✗ INCORRECT');

    if (!isPasswordValid) {
      // Lancer un debug complet
      await debugPasswordComparison(password, user.password, user.username);
      
      console.log('💡 SUGGESTIONS:');
      console.log('   1. Le mot de passe stocké pourrait être différent');
      console.log('   2. Vérifiez le modèle User.js pour un éventuel double hashage');
      console.log('   3. Essayez de réinitialiser le mot de passe');
      
      return res.status(401).json({ 
        success: false,
        message: 'Identifiants incorrects' 
      });
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      return res.status(403).json({ 
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.' 
      });
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date();
    await user.save();

    // Créer le token JWT
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

    // Préparer la réponse utilisateur
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

    console.log('\n🎉 CONNEXION RÉUSSIE POUR:', user.username);
    console.log('='.repeat(50));

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: userResponse
    });

  } catch (error) {
    console.error('🔥 ERREUR CONNEXION:', error);
    res.status(500).json({ 
      success: false,
      message: 'Erreur interne du serveur',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🆕 ROUTE POUR RÉINITIALISER LE MOT DE PASSE (FORCÉ)
router.post('/force-reset-password', async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur et nouveau mot de passe requis'
      });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }
    
    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }
    
    console.log('\n🔄 RÉINITIALISATION FORCÉE POUR:', user.username);
    console.log('- Ancien hash:', user.password.substring(0, 30) + '...');
    console.log('- Version ancienne:', user.password.substring(0, 4));
    
    // Créer un NOUVEAU hash propre
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);
    
    console.log('- Nouveau hash:', newHash.substring(0, 30) + '...');
    console.log('- Version nouvelle:', newHash.substring(0, 4));
    
    // Sauvegarder
    user.password = newHash;
    await user.save();
    
    console.log('✅ MOT DE PASSE RÉINITIALISÉ AVEC SUCCÈS');
    
    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      username: user.username,
      hashVersion: newHash.substring(0, 4)
    });
    
  } catch (error) {
    console.error('❌ ERREUR RÉINITIALISATION:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation'
    });
  }
});

// Les autres routes (restent inchangées)...
// verify-token, verify, test-login, logout, test

// Vérification du token (POST)
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