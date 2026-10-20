import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ReparationManagement.css';

const ReparationManagement = () => {
  const [reparations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('tous');
  const navigate = useNavigate();
  
  const safeNavigate = (path) => {
    if (navigate && typeof navigate === 'function') {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="reparations-management-container">
      <div className="reparations-header">
        <h1 className="reparations-title">Gestion des Réparations</h1>
      </div>
      
      <div className="development-banner">
        Fonctionnalité en développement - Bientôt disponible
      </div>
      
      <div className="quick-actions">
        <button className="action-btn primary-action" onClick={() => safeNavigate('/reparations/nouveau')}>
          <span>+</span> Nouvelle Réparation
        </button>
        <button className="action-btn secondary-action" onClick={() => safeNavigate('/planning')}>
          📋 Voir le planning
        </button>
        <button className="action-btn secondary-action" onClick={() => safeNavigate('/statistiques')}>
          📊 Statistiques
        </button>
      </div>
      
      {/* Filtres */}
      <div className="filters-container">
        <div className="filters-title">Filtrer les réparations</div>
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label">Statut</label>
            <select 
              className="filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="tous">Tous les statuts</option>
              <option value="en-attente">En attente</option>
              <option value="en-cours">En cours</option>
              <option value="termine">Terminé</option>
              <option value="annule">Annulé</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Période</label>
            <select className="filter-select">
              <option value="aujourdhui">Aujourd'hui</option>
              <option value="semaine">Cette semaine</option>
              <option value="mois">Ce mois</option>
              <option value="tous">Toutes</option>
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label">Technicien</label>
            <select className="filter-select">
              <option value="tous">Tous les techniciens</option>
              <option value="1">Technicien 1</option>
              <option value="2">Technicien 2</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Tableau */}
      <div className="reparations-table-container">
        <table className="reparations-table">
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Client</th>
              <th>Appareil</th>
              <th>Statut</th>
              <th>Date dépôt</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="empty-table-row">
              <td colSpan="6">Aucune réparation enregistrée</td>
            </tr>
            {/* Exemple de ligne avec statut (pour démonstration) */}
            {/* <tr>
              <td>REP-2024-001</td>
              <td>John Doe</td>
              <td>iPhone 13 Pro</td>
              <td><span className="status-badge status-en-cours">En cours</span></td>
              <td>15/12/2024</td>
              <td>
                <div className="table-actions">
                  <div className="action-icon">👁️</div>
                  <div className="action-icon">✏️</div>
                  <div className="action-icon">📋</div>
                </div>
              </td>
            </tr> */}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReparationManagement;