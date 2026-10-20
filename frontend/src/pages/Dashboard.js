import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserDashboard from './UserDashboard';
import DashboardRSC from './DashboardRSC';
import DashboardTech from './DashboardTechnicien';
import DashboardRes from './DashboardResponsable';
import DashboardAdm from './DashboardAdmin';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, switchRole, isTestMode } = useAuth();
  const navigate = useNavigate();

  if (user?.role === 'USER') {
    return <UserDashboard />;
  }

  if (user?.role === 'RSC') {
    return <DashboardRSC />;
  }

  if (user?.role === 'TECHNICIEN') {
    return <DashboardTech />;
  }

  if (user?.role === 'RESPONSABLE') {
    return <DashboardRes />;
  }

  if (user?.role === 'ADMIN') {
    return <DashboardAdm />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Statistiques par rôle
  const stats = {
    reparationsEnCours: 12,
    clientsCeMois: 24,
    piecesAlerte: 5,
  };

  // Navigation handler sécurisé
  const handleNavigation = (path) => {
    try {
      navigate(path);
    } catch (error) {
      console.error('Erreur de navigation:', error);
      window.location.href = path;
    }
  };

  // Récupérer les cartes de navigation selon le rôle
  const getNavItems = () => {
    const baseItems = [
      {
        id: 'clients',
        title: 'Gestion Clients',
        description: 'Gérer les clients et leurs appareils',
        icon: '👤',
        path: '/clients',
        color: 'blue'
      },
      {
        id: 'reparations',
        title: 'Réparations',
        description: 'Suivi des réparations en cours',
        icon: '🔧',
        path: '/reparations',
        color: 'orange'
      },
      {
        id: 'pieces',
        title: 'Pièces de Rechange',
        description: 'Gestion du stock',
        icon: '📦',
        path: '/pieces',
        color: 'green'
      }
    ];

    // Selon le rôle
    if (!user || !user.role) return baseItems;
    
    switch (user.role) {
      case 'RSC':
        return baseItems.filter(item => item.id === 'clients');
      case 'TECHNICIEN':
        return baseItems.filter(item => item.id === 'reparations');
      case 'RESPONSABLE':
        return baseItems;
      case 'ADMIN':
        return [
          ...baseItems,
          {
            id: 'facturation',
            title: 'Facturation',
            description: 'Générer et gérer les factures',
            icon: '💰',
            path: '/facturation',
            color: 'purple'
          },
          {
            id: 'utilisateurs',
            title: 'Utilisateurs',
            description: 'Gérer les comptes et permissions',
            icon: '👥',
            path: '/utilisateurs',
            color: 'red'
          }
        ];
      default:
        return baseItems;
    }
  };

  // Obtenir l'heure actuelle pour le message
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">RepAppBuro</h1>
          <p className="dashboard-subtitle">Tableau de Bord</p>
        </div>
        <div className="header-right">
          <div className="user-profile">
            <div className="avatar">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </div>
            <div className="user-info">
              <span className="user-name">{user?.prenom} {user?.nom}</span>
              <span className="user-role-badge">{user?.role}</span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            <span className="logout-icon">🚪</span>
            Déconnexion
          </button>
        </div>
      </header>

      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-message">
          <h2>{getTimeGreeting()}, {user?.prenom} 👋</h2>
          <p className="role-description">
            {user?.role === 'RSC' && 'Gérez les clients et les nouveaux dépôts'}
            {user?.role === 'TECHNICIEN' && 'Suivez vos réparations en cours'}
            {user?.role === 'RESPONSABLE' && "Supervisez l'activité de l'atelier"}
            {user?.role === 'ADMIN' && 'Administrez le système complet'}
            {!user?.role && 'Bienvenue sur votre tableau de bord'}
          </p>
        </div>
        <div className="date-info">
          <div className="current-date">
            {new Date().toLocaleDateString('fr-FR', { 
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="quick-actions">
            <button 
              className="quick-action-btn" 
              onClick={() => handleNavigation('/reparations/nouveau')}
            >
              <span className="action-icon">➕</span>
              Nouvelle Réparation
            </button>
            <button 
              className="quick-action-btn secondary" 
              onClick={() => handleNavigation('/clients/nouveau')}
            >
              <span className="action-icon">👤</span>
              Nouveau Client
            </button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="stats-section">
        <h3 className="section-title">
          <span className="title-icon">📊</span>
          Aperçu Rapide
        </h3>
        <div className="stats-grid">
          <div 
            className="stat-card stat-orange"
            onClick={() => handleNavigation('/reparations')}
          >
            <div className="stat-icon">🔄</div>
            <div className="stat-content">
              <h4 className="stat-title">Réparations en cours</h4>
              <p className="stat-value">{stats.reparationsEnCours}</p>
            </div>
            <div className="stat-arrow">→</div>
          </div>
          
          <div 
            className="stat-card stat-blue"
            onClick={() => handleNavigation('/clients')}
          >
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h4 className="stat-title">Clients ce mois</h4>
              <p className="stat-value">{stats.clientsCeMois}</p>
            </div>
            <div className="stat-arrow">→</div>
          </div>
          
          <div 
            className="stat-card stat-red"
            onClick={() => handleNavigation('/pieces')}
          >
            <div className="stat-icon">⚠️</div>
            <div className="stat-content">
              <h4 className="stat-title">Pièces en alerte</h4>
              <p className="stat-value">{stats.piecesAlerte}</p>
            </div>
            <div className="stat-arrow">→</div>
          </div>
        </div>
      </div>

      {/* Navigation par Modules */}
      <div className="modules-section">
        <h3 className="section-title">
          <span className="title-icon">📁</span>
          Modules d'Application
        </h3>
        <div className="modules-grid">
          {getNavItems().map(item => (
            <div 
              key={item.id}
              className={`module-card module-${item.color}`}
              onClick={() => handleNavigation(item.path)}
            >
              <div className="module-icon">{item.icon}</div>
              <div className="module-content">
                <h4 className="module-title">{item.title}</h4>
                <p className="module-description">{item.description}</p>
              </div>
              <div className="module-arrow">→</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sélecteur de rôle en mode test */}
      {isTestMode && (
        <div className="role-switcher">
          <div className="role-switcher-header">
            <span className="role-switcher-icon">🔄</span>
            <h4>Changer de rôle (Mode Test)</h4>
          </div>
          <div className="role-switcher-buttons">
            <button 
              className={`role-switch-btn ${user?.role === 'RSC' ? 'active' : ''}`}
              onClick={() => switchRole && switchRole('RSC')}
            >
              RSC
            </button>
            <button 
              className={`role-switch-btn ${user?.role === 'TECHNICIEN' ? 'active' : ''}`}
              onClick={() => switchRole && switchRole('TECHNICIEN')}
            >
              Technicien
            </button>
            <button 
              className={`role-switch-btn ${user?.role === 'RESPONSABLE' ? 'active' : ''}`}
              onClick={() => switchRole && switchRole('RESPONSABLE')}
            >
              Responsable
            </button>
            <button 
              className={`role-switch-btn ${user?.role === 'ADMIN' ? 'active' : ''}`}
              onClick={() => switchRole && switchRole('ADMIN')}
            >
              Admin
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="dashboard-footer">
        <div className="footer-info">
          <span>© 2024 RepAppBuro</span>
          <span className="footer-separator">•</span>
          <span>Version 1.0.0</span>
          <span className="footer-separator">•</span>
          <span>Connecté en tant que {user?.role}</span>
        </div>
        <div className="footer-actions">
          <button 
            className="footer-btn" 
            onClick={() => handleNavigation('/aide')}
          >
            Aide
          </button>
          <button 
            className="footer-btn" 
            onClick={() => handleNavigation('/parametres')}
          >
            Paramètres
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;