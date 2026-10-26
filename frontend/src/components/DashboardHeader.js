import React from 'react';
import BrandLockup from './BrandLockup';
import './DashboardHeader.css';

const DashboardHeader = ({ role, roleLabel, title, subtitle, onLogout, onRefresh }) => {
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
        <button className="dashboard-header-logout" type="button" onClick={onLogout}>
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
