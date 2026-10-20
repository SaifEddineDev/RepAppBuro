const mongoose = require('mongoose');

const clientSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true
  },
  telephone: {
    type: String,
    required: true
  },
  adresse: {
    rue: String,
    codePostal: String,
    ville: String
  },
  type: {
    type: String,
    enum: ['PARTICULIER', 'ENTREPRISE'],
    default: 'PARTICULIER'
  },
  entreprise: {
    nom: String,
    siret: String
  },
  dateCreation: {
    type: Date,
    default: Date.now
  },
  notes: String
});

module.exports = mongoose.model('Client', clientSchema);