import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './TestLogin.css';

const TestLogin = () => {
  const { quickLogin } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role) => {
    if (quickLogin(role)) {
      navigate('/dashboard');
    }
  };

  const testUsers = [
    {
      role: 'RSC',
      title: 'Représentant Service Clientèle',
      description: 'Gère les clients et les nouvelles réparations',
      permissions: [
        'Ajouter/modifier clients',
        'Créer fiches réparation',
        'Générer étiquettes',
        'Contacter clients'
      ],
      color: 'blue',
      icon: '👨‍💼'
    },
    {
      role: 'TECHNICIEN',
      title: 'Technicien',
      description: 'Diagnostique et répare les appareils',
      permissions: [
        'Voir réparations assignées',
        'Ajouter diagnostic',
        'Saisir pièces utilisées',
        'Mettre à jour statuts'
      ],
      color: 'orange',
      icon: '👨‍🔧'
    },
    {
      role: 'RESPONSABLE',
      title: 'Responsable Clientèle',
      description: 'Supervise l\'atelier et valide les factures',
      permissions: [
        'Toutes actions RSC',
        'Valider factures',
        'Voir statistiques',
        'Gérer planning'
      ],
      color: 'green',
      icon: '👔'
    },
    {
      role: 'ADMIN',
      title: 'Administrateur',
      description: 'Gère le système complet',
      permissions: [
        'Toutes actions',
        'Gérer utilisateurs',
        'Configuration système',
        'Rapports complets'
      ],
      color: 'purple',
      icon: '🔧'
    }
  ];

  return (
    <div className="test-login-container">
      <div className="test-login-header">
        <h1 className="test-login-title">Mode Test RepAppBuro</h1>
        <p className="test-login-subtitle">
          Sélectionnez un rôle pour tester l'interface avec les permissions correspondantes
        </p>
        <div className="test-mode-badge">MODE TEST - Données fictives</div>
      </div>

      <div className="role-selection-grid">
        {testUsers.map((user) => (
          <div 
            key={user.role}
            className={`role-card role-${user.color}`}
            onClick={() => handleRoleSelect(user.role)}
          >
            <div className="role-card-header">
              <div className="role-icon">{user.icon}</div>
              <div className="role-title-group">
                <h3 className="role-title">{user.title}</h3>
                <span className="role-tag">{user.role}</span>
              </div>
            </div>
            
            <p className="role-description">{user.description}</p>
            
            <div className="role-permissions">
              <h4>Permissions :</h4>
              <ul>
                {user.permissions.map((perm, index) => (
                  <li key={index}>{perm}</li>
                ))}
              </ul>
            </div>
            
            <button className="role-select-btn">
              Tester ce rôle →
            </button>
          </div>
        ))}
      </div>

      <div className="test-login-footer">
        <p className="test-notice">
          ⚠️ Ce mode utilise des données de test. Toutes les modifications seront perdues après déconnexion.
        </p>
        <button 
          className="back-to-login-btn"
          onClick={() => navigate('/login')}
        >
          ← Retour à la connexion normale
        </button>
      </div>
    </div>
  );
};

export default TestLogin;