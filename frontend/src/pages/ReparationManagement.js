import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import './ReparationManagement.css';

const ReparationManagement = () => {
  const [reparations, setReparations] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadRepairs = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await apiRequest('/devices');
      setReparations(Array.isArray(rows) ? rows : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les réparations.');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { loadRepairs(); }, [loadRepairs]);
  const statusLabels = {
    nouveau: 'Nouveau', en_diagnostic: 'En diagnostic', en_reparation: 'En réparation',
    en_attente_piece: 'En attente de pièce', termine: 'Terminé · à valider',
    pret_a_recuperer: 'Prêt à récupérer', recupere: 'Restitué'
  };
  const visibleRepairs = useMemo(() => {
    const needle = searchTerm.trim().toLocaleLowerCase('fr');
    return reparations.filter((item) => {
      const client = item.userId && typeof item.userId === 'object'
        ? [item.userId.prenom, item.userId.nom, item.userId.username].filter(Boolean).join(' ') : '';
      const matchesSearch = !needle || [item._id, item.name, item.type, item.marque, item.modele, client]
        .some((value) => String(value || '').toLocaleLowerCase('fr').includes(needle));
      return matchesSearch && (statusFilter === 'all' || item.status === statusFilter);
    });
  }, [reparations, searchTerm, statusFilter]);

  return (
    <div className="reparations-management-container">
      <div className="reparations-header">
        <h1 className="reparations-title">Gestion des Réparations</h1>
      </div>
      
      {error && <div className="development-banner" role="alert">{error}</div>}
      
      {/* Filtres */}
      <div className="filters-container">
        <div className="filters-grid">
          <div className="filter-group">
            <label className="filter-label" htmlFor="repairs-search">Recherche</label>
            <input id="repairs-search" className="filter-select" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Dossier, client, appareil…" />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="repairs-status">Statut</label>
            <select id="repairs-status" className="filter-select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <option value="all">Tous les statuts</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          <button className="action-btn secondary-action" type="button" onClick={loadRepairs} disabled={loading}>{loading ? 'Actualisation…' : 'Actualiser'}</button>
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
            </tr>
          </thead>
          <tbody>
            {loading ? <tr className="empty-table-row"><td colSpan="5">Chargement des réparations…</td></tr> : visibleRepairs.length === 0 ? (
              <tr className="empty-table-row"><td colSpan="5">{reparations.length ? 'Aucun résultat pour ces filtres.' : 'Aucune réparation enregistrée.'}</td></tr>
            ) : visibleRepairs.map((item) => {
              const client = item.userId && typeof item.userId === 'object'
                ? [item.userId.prenom, item.userId.nom].filter(Boolean).join(' ') || item.userId.username
                : 'Client';
              return <tr key={item._id}>
                <td><strong>{String(item._id).slice(-8).toUpperCase()}</strong></td>
                <td>{client}</td>
                <td>{[item.name, item.marque, item.modele].filter(Boolean).join(' · ')}</td>
                <td>{statusLabels[item.status] || item.status}</td>
                <td>{item.dateDepot ? new Date(item.dateDepot).toLocaleDateString('fr-FR') : '—'}</td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReparationManagement;
