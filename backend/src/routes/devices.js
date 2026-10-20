const express = require('express');
const router = express.Router();
const Device = require('../models/Device');
const auth = require('../middleware/auth');

// Récupérer tous les appareils (pour admin/technicien)
router.get('/', auth, async (req, res) => {
  try {
    let devices;
    if (req.user.role === 'USER') {
      // Client ne voit que ses propres appareils
      devices = await Device.find({ userId: req.user.id }).sort({ createdAt: -1 });
    } else if (req.user.role === 'TECHNICIEN') {
      // Technicien voit les appareils qui lui sont assignés
      devices = await Device.find({ 
        $or: [
          { technicianId: req.user.id },
          { technicianId: null, status: { $in: ['nouveau', 'en_diagnostic'] } }
        ]
      }).sort({ createdAt: -1 });
    } else {
      // Admin, responsable, rsc voient tous les appareils
      devices = await Device.find().sort({ createdAt: -1 }).populate('userId', 'name email');
    }
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Créer un nouvel appareil (client)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'USER') {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const device = new Device({
      userId: req.user.id,
      ...req.body,
      status: 'nouveau',
      dateDepot: new Date(),
      dateRecupEstimee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await device.save();
    res.status(201).json(device);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Mettre à jour un appareil (technicien/admin)
router.put('/:id', auth, async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    
    if (!device) {
      return res.status(404).json({ error: 'Appareil non trouvé' });
    }

    // Permissions
    const allowedRoles = ['ADMIN', 'RESPONSABLE', 'RSC', 'TECHNICIEN'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Si technicien assigne l'appareil à lui-même
    if (req.user.role === 'TECHNICIEN' && !device.technicianId) {
      req.body.technicianId = req.user.id;
    }

    Object.assign(device, req.body);
    await device.save();
    
    res.json(device);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
