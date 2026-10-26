const express = require('express');
const mongoose = require('mongoose');
const Piece = require('../models/Piece');
const authenticate = require('../middleware/auth');

const router = express.Router();
const readRoles = ['TECHNICIEN', 'RESPONSABLE', 'ADMIN'];
const manageRoles = ['RESPONSABLE', 'ADMIN'];
const text = (value, limit) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

router.use(authenticate);

router.get('/', async (req, res) => {
  if (!readRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Accès non autorisé' });
  try {
    const pieces = await Piece.find().sort({ nom: 1 });
    return res.json(pieces);
  } catch (error) {
    console.error('Unable to list inventory:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de charger le stock' });
  }
});

router.post('/', async (req, res) => {
  if (!manageRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Gestion du stock réservée au responsable et à l’administration' });
  try {
    const reference = text(req.body?.reference, 60);
    const nom = text(req.body?.nom, 120);
    const stock = Number(req.body?.stock);
    const seuilAlerte = Number(req.body?.seuilAlerte || 0);
    const prixUnitaire = Number(req.body?.prixUnitaire || 0);
    if (!reference || !nom || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(seuilAlerte) || seuilAlerte < 0 || !Number.isFinite(prixUnitaire) || prixUnitaire < 0) {
      return res.status(400).json({ success: false, message: 'Référence, nom, stock et prix doivent être valides' });
    }
    const piece = await Piece.create({
      reference,
      nom,
      categorie: text(req.body.categorie, 80),
      stock,
      seuilAlerte,
      prixUnitaire,
      createdBy: req.user.id
    });
    return res.status(201).json(piece);
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Cette référence existe déjà' });
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
    console.error('Unable to create inventory item:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible d’ajouter la pièce' });
  }
});

router.patch('/:id/stock', async (req, res) => {
  if (!manageRoles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'Réapprovisionnement réservé au responsable et à l’administration' });
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ success: false, message: 'Identifiant invalide' });
  const delta = Number(req.body?.delta);
  if (!Number.isInteger(delta) || delta === 0) return res.status(400).json({ success: false, message: 'La variation de stock doit être un entier non nul' });
  try {
    const piece = await Piece.findById(req.params.id);
    if (!piece) return res.status(404).json({ success: false, message: 'Pièce introuvable' });
    const nextStock = piece.stock + delta;
    if (nextStock < 0) return res.status(400).json({ success: false, message: 'Le stock ne peut pas devenir négatif' });
    piece.stock = nextStock;
    await piece.save();
    return res.json(piece);
  } catch (error) {
    console.error('Unable to change stock:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de modifier le stock' });
  }
});

module.exports = router;
