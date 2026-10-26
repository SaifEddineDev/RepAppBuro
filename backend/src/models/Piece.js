const mongoose = require('mongoose');

const pieceSchema = new mongoose.Schema({
  reference: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
  nom: { type: String, required: true, trim: true, maxlength: 120 },
  categorie: { type: String, default: '', trim: true, maxlength: 80 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  seuilAlerte: { type: Number, min: 0, default: 0 },
  prixUnitaire: { type: Number, min: 0, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Piece', pieceSchema);
