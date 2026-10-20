const express = require('express');
const router = express.Router();

// Route temporaire - API Analytics
router.get('/', (req, res) => {
  res.json({ 
    message: 'API Analytics fonctionnelle',
    endpoints: [
      'GET /data - Données analytiques',
      'GET /metrics - Métriques principales',
      'GET /summary - Résumé des données'
    ]
  });
});

module.exports = router;