const express = require('express');
const router = express.Router();

// Route temporaire - API Dashboard
router.get('/', (req, res) => {
  res.json({ 
    message: 'API Dashboard fonctionnelle',
    endpoints: [
      'GET / - Liste des dashboards',
      'POST / - Créer un dashboard',
      'GET /:id - Récupérer un dashboard',
      'PUT /:id - Modifier un dashboard',
      'DELETE /:id - Supprimer un dashboard'
    ]
  });
});

module.exports = router;