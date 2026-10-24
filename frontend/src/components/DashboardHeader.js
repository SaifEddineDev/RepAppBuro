import React from 'react';
import BrandLockup from './BrandLockup';
import './DashboardHeader.css';

const DashboardHeader = ({ role, roleLabel, title, subtitle, user, onLogout, onRefresh }) => {
  const initials = `${user?.prenom?.[0] || ''}${user?.nom?.[0] || user?.username?.[0] || ''}`.toUpperCase();
  const displayName = [user?.prenom, user?.nom].filter(Boolean).join(' ') || user?.username || 'Utilisateur';

  return (
    <header className={`dashboard-header dashboard-header-${role.toLowerCase()}`}>
      <BrandLockup className="dashboard-header-lockup" />

      <div className="dashboard-header-heading">
        <span className="dashboard-header-role">{roleLabel}</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>

      <div className="dashboard-header-actions">
        {onRefresh && (
          <button className="dashboard-header-refresh" type="button" onClick={onRefresh}>
            <span aria-hidden="true">↻</span>
            <span>Rafraîchir</span>
          </button>
        )}
        <div className="dashboard-header-profile">
          <span className="dashboard-header-avatar" aria-hidden="true">{initials || 'U'}</span>
          <span className="dashboard-header-identity">
            <strong>{displayName}</strong>
            <span>{roleLabel}</span>
          </span>
        </div>
        <button className="dashboard-header-logout" type="button" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
