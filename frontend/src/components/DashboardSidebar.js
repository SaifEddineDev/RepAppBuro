import React, { useState } from 'react';
import BrandLockup from './BrandLockup';
import './DashboardSidebar.css';

const ROLE_ITEMS = {
  ADMIN: [
    { id: 'overview', label: 'Vue d’ensemble', icon: '⌂' },
    { id: 'utilisateurs', label: 'Utilisateurs', icon: '♙' },
    { id: 'appareils', label: 'Appareils', icon: '▣' },
    { id: 'droits', label: 'Droits d’accès', icon: '⌑' },
    { id: 'finances', label: 'Finances', icon: '€' },
    { id: 'systeme', label: 'Système', icon: '⚙' }
  ],
  RSC: [
    { id: 'overview', label: 'Vue d’ensemble', icon: '⌂' },
    { id: 'nouveau-client', label: 'Nouveau client', icon: '＋' },
    { id: 'nouvelle-reparation', label: 'Nouveau dépôt', icon: '▣' },
    { id: 'clients', label: 'Clients', icon: '♧' },
    { id: 'reparations', label: 'Réparations', icon: '⌁' },
    { id: 'etiquettes', label: 'Étiquettes', icon: '⌗' }
  ],
  TECHNICIEN: [
    { id: 'overview', label: 'Vue d’ensemble', icon: '⌂' },
    { id: 'mes-taches', label: 'Mes réparations', icon: '▤' },
    { id: 'non-assignes', label: 'En attente', icon: '＋' },
    { id: 'fiche-reparation', label: 'Fiche technique', icon: '▧' },
    { id: 'tous', label: 'Atelier', icon: '⌂' },
    { id: 'statistiques', label: 'Statistiques', icon: '▥' }
  ],
  RESPONSABLE: [
    { id: 'overview', label: 'Vue d’ensemble', icon: '⌂' },
    { id: 'supervision', label: 'Supervision', icon: '⌂' },
    { id: 'facturation', label: 'Facturation', icon: '€' },
    { id: 'rapports', label: 'Rapports', icon: '▥' },
    { id: 'clients', label: 'Clients', icon: '♧' }
  ],
  USER: [
    { id: 'overview', label: 'Vue d’ensemble', icon: '⌂' },
    { id: 'new-repair', label: 'Nouvelle demande', icon: '＋' },
    { id: 'repairs', label: 'Mes réparations', icon: '⌁' },
    { id: 'invoices', label: 'Mes factures', icon: '€' },
    { id: 'support', label: 'Atelier & support', icon: '☏' }
  ]
};

const DashboardSidebar = ({ role, user, activeItem, onNavigate, onLogout, onCollapseChange, disabledItems = [] }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    onCollapseChange?.(next);
  };

  const handleNavigate = (item) => {
    onNavigate?.(item.id);
    setMobileOpen(false);
  };

  const items = ROLE_ITEMS[role] || [];

  return (
    <>
      <button
        type="button"
        className="dashboard-sidebar-mobile-toggle"
        aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={mobileOpen}
        onClick={() => setMobileOpen((open) => !open)}
      >
        {mobileOpen ? '×' : '☰'}
      </button>
      {mobileOpen && <button type="button" className="dashboard-sidebar-scrim" aria-label="Fermer le menu" onClick={() => setMobileOpen(false)} />}
      <aside className={`dashboard-sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`} aria-label={`Navigation ${role}`}>
        <div className="dashboard-sidebar-brand">
          <BrandLockup className="dashboard-sidebar-lockup" />
          <button type="button" className="dashboard-sidebar-collapse" aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'} onClick={toggleCollapsed}>
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        <p className="dashboard-sidebar-caption">ESPACE DE TRAVAIL</p>
        <nav className="dashboard-sidebar-nav">
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`dashboard-sidebar-item${activeItem === item.id ? ' is-active' : ''}`}
              title={item.label}
              aria-current={activeItem === item.id ? 'page' : undefined}
              disabled={disabledItems.includes(item.id)}
              onClick={() => handleNavigate(item)}
            >
              <span className="dashboard-sidebar-icon" aria-hidden="true">{item.icon}</span>
              <span className="dashboard-sidebar-label">{item.label}</span>
              {item.badge != null && <span className="dashboard-sidebar-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="dashboard-sidebar-account">
          <div className="dashboard-sidebar-avatar" aria-hidden="true">{(user?.prenom || user?.username || role || '?').slice(0, 1).toUpperCase()}</div>
          <div className="dashboard-sidebar-user-copy">
            <strong>{[user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.username || 'Compte'}</strong>
            <span>{role}</span>
          </div>
          <button type="button" className="dashboard-sidebar-logout" onClick={onLogout} title="Déconnexion" aria-label="Déconnexion">
            <span aria-hidden="true">↪</span><span className="dashboard-sidebar-label">Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default DashboardSidebar;
