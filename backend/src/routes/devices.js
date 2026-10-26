const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Device = require('../models/Device');
const User = require('../models/User');
const auth = require('../middleware/auth');

const statuses = ['nouveau', 'en_diagnostic', 'en_reparation', 'en_attente_piece', 'termine', 'pret_a_recuperer', 'recupere'];
const statusTransitions = {
  nouveau: ['en_diagnostic'],
  en_diagnostic: ['en_reparation', 'en_attente_piece'],
  en_reparation: ['en_attente_piece', 'termine'],
  en_attente_piece: ['en_reparation'],
  termine: ['pret_a_recuperer'],
  pret_a_recuperer: ['recupere'],
  recupere: []
};

const cleanText = (value, maxLength) => typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.get('/', auth, async (req, res) => {
  try {
    const role = req.user.role;
    let filter;
    if (role === 'USER') {
      filter = { userId: req.user.id };
    } else if (role === 'TECHNICIEN') {
      filter = {
        $or: [
          { technicianId: req.user.id },
          { technicianId: null, status: { $in: ['nouveau', 'en_diagnostic'] } }
        ]
      };
    } else if (['ADMIN', 'RESPONSABLE', 'RSC'].includes(role)) {
      filter = {};
    } else {
      return res.status(403).json({ success: false, message: 'Accès non autorisé' });
    }

    let query = Device.find(filter).sort({ createdAt: -1 });
    if (['ADMIN', 'RESPONSABLE', 'RSC'].includes(role)) {
      query = query.populate('userId', 'username prenom nom email telephone');
    } else if (role === 'TECHNICIEN') {
      query = query.populate('userId', 'username prenom nom');
    }
    return res.json(await query);
  } catch (error) {
    console.error('Unable to list devices:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de charger les appareils' });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const role = req.user.role;
    if (!['USER', 'RSC'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Seuls un client ou l’accueil peuvent créer un dépôt' });
    }

    let ownerId = req.user.id;
    if (role === 'RSC') {
      if (!isValidObjectId(req.body?.userId)) {
        return res.status(400).json({ success: false, message: 'Client invalide' });
      }
      const client = await User.findOne({ _id: req.body.userId, role: 'USER', actif: true }).select('_id');
      if (!client) return res.status(404).json({ success: false, message: 'Compte client introuvable ou désactivé' });
      ownerId = String(client._id);
    }

    const name = cleanText(req.body?.name, 120);
    const type = cleanText(req.body?.type, 80);
    const marque = cleanText(req.body?.marque, 100);
    const modele = cleanText(req.body?.modele, 120);
    const problem = cleanText(req.body?.problem, 3000);
    if (!name || !type || !marque || !modele || !problem) {
      return res.status(400).json({ success: false, message: 'Nom, type, marque, modèle et problème sont requis' });
    }

    const device = await Device.create({
      userId: ownerId,
      name,
      type,
      marque,
      modele,
      problem,
      serialNumber: cleanText(req.body.serialNumber, 120),
      accessoires: role === 'RSC' ? cleanText(req.body.accessoires, 1000) : '',
      urgence: role === 'RSC' && ['standard', 'urgent', 'prioritaire', 'express'].includes(req.body.urgence)
        ? req.body.urgence
        : 'standard',
      status: 'nouveau',
      dateDepot: new Date(),
      dateRecupEstimee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      historique: [{ userId: req.user.id, role, action: 'creation', message: 'Dépôt créé' }]
    });

    return res.status(201).json(device);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ success: false, message: error.message });
    }
    console.error('Unable to create device:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible d’enregistrer le dépôt' });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Identifiant d’appareil invalide' });
    }
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ success: false, message: 'Appareil introuvable' });

    const role = req.user.role;
    const body = req.body || {};
    const previousStatus = device.status;
    let allowedFields;

    if (role === 'TECHNICIEN') {
      const assignedToOther = device.technicianId && String(device.technicianId) !== req.user.id;
      const canClaim = !device.technicianId && ['nouveau', 'en_diagnostic'].includes(device.status);
      if (assignedToOther || (!canClaim && String(device.technicianId || '') !== req.user.id)) {
        return res.status(403).json({ success: false, message: 'Cette réparation ne vous est pas attribuée' });
      }
      if (body.technicianId !== undefined && String(body.technicianId) !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Vous pouvez uniquement vous attribuer une réparation à vous-même' });
      }
      if (canClaim) device.technicianId = req.user.id;
      allowedFields = ['diagnostic', 'piecesUtilisees', 'tempsTravail', 'status'];
      if (typeof body.diagnostic === 'string') device.diagnostic = cleanText(body.diagnostic, 4000);
      if (body.piecesUtilisees !== undefined) {
        if (!Array.isArray(body.piecesUtilisees) || body.piecesUtilisees.length > 100) {
          return res.status(400).json({ success: false, message: 'Liste de pièces invalide' });
        }
        device.piecesUtilisees = body.piecesUtilisees.map((part) => ({
          nom: cleanText(part?.nom, 120),
          quantite: Math.max(1, Math.min(10000, Number(part?.quantite) || 1)),
          prix: Math.max(0, Math.min(10000000, Number(part?.prix) || 0))
        }));
        if (device.piecesUtilisees.some((part) => !part.nom)) {
          return res.status(400).json({ success: false, message: 'Chaque pièce doit avoir un nom' });
        }
      }
      if (body.tempsTravail !== undefined) {
        const minutes = Number(body.tempsTravail);
        if (!Number.isFinite(minutes) || minutes < 0 || minutes > 100000) {
          return res.status(400).json({ success: false, message: 'Durée de travail invalide' });
        }
        device.tempsTravail = minutes;
      }
      if (body.note && typeof body.note === 'string' && body.note.trim()) {
        device.notes.push({ type: 'technicien', user: req.user.username, message: cleanText(body.note, 2000) });
      }
    } else if (role === 'RESPONSABLE') {
      allowedFields = ['status', 'facture', 'dateRecupEstimee'];
      if (body.facture !== undefined) {
        if (!body.facture || typeof body.facture !== 'object' || Array.isArray(body.facture)) {
          return res.status(400).json({ success: false, message: 'Facture invalide' });
        }
        const amount = Number(body.facture.montant);
        if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) {
          return res.status(400).json({ success: false, message: 'Montant de facture invalide' });
        }
        device.facture = {
          montant: amount,
          payee: device.facture?.payee === true,
          url: typeof body.facture.url === 'string' ? cleanText(body.facture.url, 500) : device.facture?.url
        };
      }
      if (body.dateRecupEstimee !== undefined) {
        const date = new Date(body.dateRecupEstimee);
        if (Number.isNaN(date.getTime())) return res.status(400).json({ success: false, message: 'Date invalide' });
        device.dateRecupEstimee = date;
      }
    } else if (role === 'ADMIN') {
      allowedFields = ['name', 'type', 'marque', 'modele', 'problem', 'serialNumber', 'status', 'facture', 'dateRecupEstimee', 'technicianId', 'urgence', 'accessoires'];
      for (const field of ['name', 'type', 'marque', 'modele', 'problem', 'serialNumber', 'accessoires']) {
        if (body[field] !== undefined) device[field] = cleanText(body[field], field === 'problem' ? 3000 : 1000);
      }
      if (body.urgence !== undefined && ['standard', 'urgent', 'prioritaire', 'express'].includes(body.urgence)) device.urgence = body.urgence;
      if (body.technicianId !== undefined) {
        if (body.technicianId === null || body.technicianId === '') device.technicianId = null;
        else if (isValidObjectId(body.technicianId) && await User.exists({ _id: body.technicianId, role: 'TECHNICIEN', actif: true })) device.technicianId = body.technicianId;
        else return res.status(400).json({ success: false, message: 'Technicien invalide' });
      }
      if (body.facture !== undefined) {
        if (!body.facture || typeof body.facture !== 'object' || Array.isArray(body.facture)) return res.status(400).json({ success: false, message: 'Facture invalide' });
        const amount = Number(body.facture.montant);
        if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) return res.status(400).json({ success: false, message: 'Montant de facture invalide' });
        device.facture = { montant: amount, payee: body.facture.payee === true, url: typeof body.facture.url === 'string' ? cleanText(body.facture.url, 500) : '' };
      }
      if (body.dateRecupEstimee !== undefined) {
        const date = new Date(body.dateRecupEstimee);
        if (Number.isNaN(date.getTime())) return res.status(400).json({ success: false, message: 'Date invalide' });
        device.dateRecupEstimee = date;
      }
    } else {
      return res.status(403).json({ success: false, message: 'Modification non autorisée pour ce rôle' });
    }

    if (body.status !== undefined) {
      if (!statuses.includes(body.status)) return res.status(400).json({ success: false, message: 'Statut invalide' });
      if (body.status !== previousStatus && !statusTransitions[previousStatus]?.includes(body.status)) {
        return res.status(400).json({ success: false, message: `Transition de statut impossible : ${previousStatus} → ${body.status}` });
      }
      if (role === 'TECHNICIEN' && !['en_diagnostic', 'en_reparation', 'en_attente_piece', 'termine'].includes(body.status)) {
        return res.status(403).json({ success: false, message: 'Le technicien ne peut pas valider la restitution' });
      }
      if (role === 'RESPONSABLE' && !['pret_a_recuperer', 'recupere'].includes(body.status)) {
        return res.status(403).json({ success: false, message: 'Le responsable peut uniquement valider ou enregistrer une restitution' });
      }
      device.status = body.status;
    }

    if (role === 'TECHNICIEN' && !device.technicianId) device.technicianId = req.user.id;
    if (body.assignedTo !== undefined && role !== 'ADMIN') {
      // Le nom d’affectation est dérivé du compte serveur, jamais du texte client.
      device.assignedTo = req.user.username;
    }
    const changedFields = allowedFields.filter((field) => body[field] !== undefined);
    if (device.status !== previousStatus) {
      device.historique.push({ userId: req.user.id, role, action: 'statut', message: `${previousStatus} → ${device.status}` });
    } else if (changedFields.length || role === 'TECHNICIEN') {
      device.historique.push({ userId: req.user.id, role, action: 'mise_a_jour', message: changedFields.length ? changedFields.join(', ') : 'Affectation à soi-même' });
    }

    await device.save();
    return res.json(device);
  } catch (error) {
    if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: error.message });
    console.error('Unable to update device:', error.message);
    return res.status(500).json({ success: false, message: 'Impossible de modifier la réparation' });
  }
});

module.exports = router;
