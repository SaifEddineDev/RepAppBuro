import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ClientManagement.css';

const ClientManagement = () => {
  const [clients] = useState([]);
  const navigate = useNavigate();
  
  const safeNavigate = (path) => {
    if (navigate && typeof navigate === 'function') {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="clients-management-container">
      <div className="clients-header">
        <h1 className="clients-title">Gestion des Clients</h1>
      </div>
      
      <div className="development-notice">
        Fonctionnalité en développement
      </div>
      
      <div className="clients-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <button className="new-client-btn" onClick={() => safeNavigate('/clients/nouveau')}>
          Nouveau Client
        </button>
      </div>
      <table className="clients-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          <tr className="no-clients-row">
            <td>Aucun client</td>
            <td>-</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ClientManagement;