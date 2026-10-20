const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Modèles
const User = require('../src/models/User');
const Client = require('../src/models/Client');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/repappburo';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connecté à MongoDB pour le seeding');

    // Nettoyer la base de données
    await User.deleteMany({});
    await Client.deleteMany({});
    console.log('🗑️ Base de données nettoyée');

    // Créer les utilisateurs de test
    const users = [
      {
        username: 'jdupont',
        password: 'rsc123456',
        prenom: 'Jean',
        nom: 'Dupont',
        role: 'RSC',
        email: 'jdupont@repappburo.fr',
        telephone: '01 23 45 67 89'
      },
      {
        username: 'pmartin',
        password: 'tech123456',
        prenom: 'Pierre',
        nom: 'Martin',
        role: 'TECHNICIEN',
        email: 'pmartin@repappburo.fr',
        telephone: '01 23 45 67 90'
      },
      {
        username: 'mdurand',
        password: 'resp123456',
        prenom: 'Marie',
        nom: 'Durand',
        role: 'RESPONSABLE',
        email: 'mdurand@repappburo.fr',
        telephone: '01 23 45 67 91'
      },
      {
        username: 'admin',
        password: 'admin123456',
        prenom: 'Admin',
        nom: 'Système',
        role: 'ADMIN',
        email: 'admin@repappburo.fr',
        telephone: '01 23 45 67 92'
      }
    ];

    // Hash les mots de passe et sauvegarde
    for (let userData of users) {
      const user = new User(userData);
      await user.save();
    }
    console.log('👤 Utilisateurs de test créés');

    // Créer des clients de test
    const clients = [
      {
        nom: 'Martin',
        prenom: 'Paul',
        email: 'paul.martin@email.com',
        telephone: '06 12 34 56 78',
        adresse: {
          rue: '12 Rue de la Paix',
          codePostal: '75008',
          ville: 'Paris'
        },
        type: 'PARTICULIER'
      },
      {
        nom: 'Dubois',
        prenom: 'Sophie',
        email: 'sophie.dubois@email.com',
        telephone: '06 23 45 67 89',
        adresse: {
          rue: '45 Avenue des Champs',
          codePostal: '75016',
          ville: 'Paris'
        },
        type: 'PARTICULIER'
      },
      {
        nom: 'TechCorp',
        prenom: 'Service',
        email: 'contact@techcorp.fr',
        telephone: '01 56 78 90 12',
        adresse: {
          rue: '78 Boulevard Haussmann',
          codePostal: '75009',
          ville: 'Paris'
        },
        type: 'ENTREPRISE',
        entreprise: {
          nom: 'TechCorp SAS',
          siret: '12345678901234'
        }
      }
    ];

    for (let clientData of clients) {
      const client = new Client(clientData);
      await client.save();
    }
    console.log('👥 Clients de test créés');

    console.log('✅ Seeding terminé avec succès');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  }
}

seedDatabase();