const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Veuillez entrer un email valide'],
    index: true
  },
  password: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  nom: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  role: {
    type: String,
    enum: ['RSC', 'TECHNICIEN', 'RESPONSABLE', 'ADMIN', 'USER'],
    default: 'USER'
  },
  telephone: {
    type: String,
    required: false,
    default: '',
    trim: true
  },
  actif: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  },
  updatedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// ⭐⭐ SUPPRIMER LE MIDDLEWARE DE HASHAGE ⭐⭐
// C'est la cause du double hashage
// NE PAS utiliser pre('save') pour hasher le mot de passe
// Le mot de passe doit être hashé UNIQUEMENT dans la route d'inscription

// Garder seulement le middleware pour updatedAt
userSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Assurer que email et username sont propres
  if (this.email) {
    this.email = this.email.toLowerCase().trim();
  }
  if (this.username) {
    this.username = this.username.trim();
  }
  
  next();
});

// Méthode pour vérifier le mot de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    console.error('Erreur de comparaison de mot de passe:', error);
    throw new Error('Erreur lors de la comparaison des mots de passe');
  }
};

// Méthode pour obtenir le nom complet
userSchema.methods.getFullName = function() {
  return `${this.prenom} ${this.nom}`.trim() || this.username;
};

// Méthode pour formater les données utilisateur pour la réponse
userSchema.methods.toJSON = function() {
  const userObject = this.toObject();
  
  // Supprimer les propriétés sensibles
  delete userObject.password;
  delete userObject.__v;
  
  return userObject;
};

// Méthode statique pour trouver un utilisateur par username ou email
userSchema.statics.findByCredentials = async function(usernameOrEmail, password) {
  try {
    // Chercher par username ou email
    const user = await this.findOne({
      $or: [
        { username: usernameOrEmail.toLowerCase().trim() },
        { email: usernameOrEmail.toLowerCase().trim() }
      ]
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      throw new Error('Mot de passe incorrect');
    }

    // Vérifier si le compte est actif
    if (!user.actif) {
      throw new Error('Compte désactivé');
    }

    // Mettre à jour lastLogin
    user.lastLogin = new Date();
    await user.save();

    return user;
  } catch (error) {
    throw error;
  }
};

// Index composé pour les recherches fréquentes
userSchema.index({ username: 1, email: 1 });
userSchema.index({ role: 1, actif: 1 });

// Validation personnalisée pour le téléphone (optionnel)
userSchema.path('telephone').validate(function(telephone) {
  if (!telephone || telephone === '') return true; // Le téléphone est optionnel
  
  // Format français simple : 10 chiffres, peut commencer par 0
  const phoneRegex = /^0[1-9](\d{2}){4}$/;
  return phoneRegex.test(telephone);
}, 'Numéro de téléphone invalide. Format attendu: 0XXXXXXXXX');

const User = mongoose.model('User', userSchema);

module.exports = User;