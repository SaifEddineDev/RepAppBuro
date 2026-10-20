import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PieceManagement.css';

const PieceManagement = () => {
  const [pieces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  const safeNavigate = (path) => {
    if (navigate && typeof navigate === 'function') {
      navigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="pieces-management-container">
      <div className="pieces-header">
        <h1 className="pieces-title">Gestion des Pièces de Rechange</h1>
      </div>
      
      <div className="development-notice">
        Fonctionnalité en développement
      </div>
      
      <div className="pieces-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher une pièce..."
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="search-icon">🔍</span>
        </div>
        
        <button className="new-piece-btn" onClick={() => safeNavigate('/pieces/nouveau')}>
          Nouvelle Pièce
        </button>
      </div>
      
      <div className="pieces-table-container">
        <table className="pieces-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nom</th>
              <th>Stock</th>
              <th>Catégorie</th>
            </tr>
          </thead>
          <tbody>
            <tr className="empty-table-row">
              <td colSpan="4">Aucune pièce enregistrée</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PieceManagement;