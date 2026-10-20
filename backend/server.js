const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://saifeddinedev.github.io',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variables d'environnement
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/RepAppBruno';

// Connexion Ã  MongoDB
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('âœ… ConnectÃ© Ã  MongoDB'))
.catch(err => console.error('âŒ Erreur de connexion MongoDB:', err));

// Routes principales
const authRoutes = require('./src/routes/auth');
app.use('/api/auth', authRoutes);

// Routes Dashboard (avec gestion d'erreur)
try {
  const dashboardRoutes = require('./routes/dashboardRoutes');
  app.use('/api/dashboards', dashboardRoutes);
  console.log('âœ… Routes Dashboard chargÃ©es');
} catch (error) {
  console.log('âš ï¸  Routes Dashboard non chargÃ©es - fichier manquant');
}

try {
  const analyticsRoutes = require('./routes/analyticsRoutes');
  app.use('/api/analytics', analyticsRoutes);
  console.log('âœ… Routes Analytics chargÃ©es');
} catch (error) {
  console.log('âš ï¸  Routes Analytics non chargÃ©es - fichier manquant');
}

// Routes de base
app.get('/', (req, res) => {
  res.json({ 
    message: 'API RepAppBuro - Backend actif',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      dashboards: '/api/dashboards',
      analytics: '/api/analytics',
      health: '/api/health'
    }
  });
});

app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    database: databaseConnected ? 'connected' : 'disconnected',
    services: {
      auth: 'active',
      dashboards: 'checking...',
      analytics: 'checking...'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvÃ©e',
    availableRoutes: ['/api/auth', '/api/dashboards', '/api/analytics', '/api/health']
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('âŒ Erreur serveur:', err);
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// DÃ©marrer le serveur
app.listen(PORT, () => {
  console.log(`\nðŸš€ Serveur backend lancÃ© sur http://localhost:${PORT}`);
  console.log(`ðŸ“Š Health check: http://localhost:${PORT}/api/health`);
  console.log(`ðŸ” Authentification: http://localhost:${PORT}/api/auth`);
  console.log(`ðŸ“ˆ Dashboards: http://localhost:${PORT}/api/dashboards`);
  console.log(`ðŸ“Š Analytics: http://localhost:${PORT}/api/analytics`);
  console.log(`\nðŸ“‹ Pour crÃ©er les routes dashboard, exÃ©cutez:`);
  console.log(`1. npm install mongoose express-validator`);
  console.log(`2. CrÃ©ez les fichiers dans ./routes/`);
  console.log(`3. RedÃ©marrez le serveur\n`);
});
