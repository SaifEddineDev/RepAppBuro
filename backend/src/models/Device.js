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
  notes: [{
    user: String,
    message: String,
    date: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Device', DeviceSchema);