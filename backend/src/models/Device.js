const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  marque: {
    type: String,
    required: true
  },
  modele: {
    type: String,
    required: true
  },
  problem: {
    type: String,
    required: true
  },
  serialNumber: String,
  diagnostic: { type: String, default: '', maxlength: 4000 },
  piecesUtilisees: [{
    nom: { type: String, required: true, maxlength: 120 },
    quantite: { type: Number, min: 1, default: 1 },
    prix: { type: Number, min: 0, default: 0 }
  }],
  tempsTravail: { type: Number, min: 0, default: 0 },
  accessoires: { type: String, default: '', maxlength: 1000 },
  urgence: { type: String, enum: ['standard', 'urgent', 'prioritaire', 'express'], default: 'standard' },
  status: {
    type: String,
    enum: ['nouveau', 'en_diagnostic', 'en_reparation', 'en_attente_piece', 'pret_a_recuperer', 'termine', 'recupere'],
    default: 'nouveau'
  },
  dateDepot: {
    type: Date,
    default: Date.now
  },
  dateRecupEstimee: Date,
  facture: {
    montant: Number,
    payee: {
      type: Boolean,
      default: false
    },
    url: String
  },
  technicianId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedTo: { type: String, default: '', maxlength: 120 },
  notes: [{
    user: String,
    message: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  historique: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: String,
    action: String,
    message: String,
    date: { type: Date, default: Date.now }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
