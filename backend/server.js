const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
const allowedOriginValues = [
  'http://localhost:3000',
  'http://localhost:3001',
  // GitHub Pages serves the production and isolated demo app from this origin.
  'https://saifeddinedev.github.io',
  'https://repappburo-web.onrender.com',
  'https://repappburo-demo-web.onrender.com',
  ...(process.env.FRONTEND_URL || '').split(',')
];
const allowedOrigins = new Set(
  allowedOriginValues.flatMap(value => {
    try {
      return [new URL(value.trim()).origin];
    } catch {
      return [];
    }
  })
);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true
};

// Answer browser preflight requests before any API route is evaluated.
app.options(/.*/, cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Variables d'environnement
const PORT = process.env.PORT || 5000;
const DEMO_MODE = process.env.DEMO_MODE === 'true';
const MONGODB_URI = DEMO_MODE
  ? process.env.DEMO_MONGODB_URI
  : process.env.MONGODB_URI || 'mongodb://localhost:27017/RepAppBruno';

if (DEMO_MODE && !/\/repappburo-demo(?:\?|$)/i.test(MONGODB_URI || '')) {
  throw new Error('DEMO_MODE requires DEMO_MONGODB_URI to target the isolated repappburo-demo database.');
}

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

const userRoutes = require('./src/routes/users');
app.use('/api/users', userRoutes);

const deviceRoutes = require('./src/routes/devices');
app.use('/api/devices', deviceRoutes);

// Routes Dashboard (avec gestion d'erreur)
try {
  const dashboardRoutes = require('./src/routes/dashboardRoutes');
  app.use('/api/dashboards', dashboardRoutes);
  console.log('âœ… Routes Dashboard chargÃ©es');
} catch (error) {
  console.log('âš ï¸  Routes Dashboard non chargÃ©es - fichier manquant');
}

try {
  const analyticsRoutes = require('./src/routes/analyticsRoutes');
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
      dashboards: 'active',
      analytics: 'active',
      devices: 'active'
    }
  });
});

// Gestion des erreurs 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route non trouvÃ©e',
    availableRoutes: ['/api/auth', '/api/users', '/api/devices', '/api/dashboards', '/api/analytics', '/api/health']
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
});
