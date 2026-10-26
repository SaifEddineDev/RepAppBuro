import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiRequest } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './PieceManagement.css';

const PieceManagement = () => {
  const { user } = useAuth();
  const [pieces, setPieces] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ reference: '', nom: '', categorie: '', stock: '0', seuilAlerte: '0', prixUnitaire: '0' });
  const canManage = ['ADMIN', 'RESPONSABLE'].includes(user?.role);
  const loadPieces = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/pieces');
      setPieces(Array.isArray(data) ? data : []);
      setError('');
    } catch (loadError) { setError(loadError.message || 'Impossible de charger le stock.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { loadPieces(); }, [loadPieces]);
  const filteredPieces = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('fr');
    return pieces.filter((piece) => [piece.reference, piece.nom, piece.categorie]
      .some((value) => String(value || '').toLocaleLowerCase('fr').includes(term)));
  }, [pieces, searchTerm]);
  const createPiece = async (event) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const created = await apiRequest('/pieces', 'POST', { ...form, stock: Number(form.stock), seuilAlerte: Number(form.seuilAlerte), prixUnitaire: Number(form.prixUnitaire) });
      setPieces((current) => [...current, created].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')));
      setForm({ reference: '', nom: '', categorie: '', stock: '0', seuilAlerte: '0', prixUnitaire: '0' });
      setShowForm(false);
    } catch (createError) { setError(createError.message || 'Impossible d’ajouter cette pièce.'); }
    finally { setSaving(false); }
  };
  const adjustStock = async (piece, delta) => {
    setError('');
    try {
      const updated = await apiRequest(`/pieces/${piece._id}/stock`, 'PATCH', { delta });
      setPieces((current) => current.map((item) => item._id === updated._id ? updated : item));
    } catch (stockError) { setError(stockError.message || 'Impossible de modifier le stock.'); }
  };

  return (
    <div className="pieces-management-container">
      <div className="pieces-header">
        <h1 className="pieces-title">Gestion des Pièces de Rechange</h1>
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
        </div>
        <button className="new-piece-btn" type="button" onClick={() => setShowForm((current) => !current)} disabled={!canManage}>
          {canManage ? (showForm ? 'Fermer' : 'Nouvelle pièce') : 'Consultation du stock'}
        </button>
      </div>

      {error && <div className="development-notice" role="alert">{error}</div>}
      {showForm && canManage && <form className="piece-create-form" onSubmit={createPiece}>
        <label>Référence<input required maxLength="60" value={form.reference} onChange={(event) => setForm({ ...form, reference: event.target.value })} /></label>
        <label>Nom<input required maxLength="120" value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} /></label>
        <label>Catégorie<input maxLength="80" value={form.categorie} onChange={(event) => setForm({ ...form, categorie: event.target.value })} /></label>
        <label>Stock initial<input type="number" min="0" step="1" required value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} /></label>
        <label>Seuil d’alerte<input type="number" min="0" step="1" value={form.seuilAlerte} onChange={(event) => setForm({ ...form, seuilAlerte: event.target.value })} /></label>
        <label>Prix unitaire (€)<input type="number" min="0" step="0.01" value={form.prixUnitaire} onChange={(event) => setForm({ ...form, prixUnitaire: event.target.value })} /></label>
        <button className="new-piece-btn" type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer la pièce'}</button>
      </form>}
      
      <div className="pieces-table-container">
        <table className="pieces-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Nom</th>
              <th>Stock</th>
              <th>Catégorie</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <tr className="empty-table-row"><td colSpan="5">Chargement du stock…</td></tr> : filteredPieces.length === 0 ? (
              <tr className="empty-table-row"><td colSpan="5">{pieces.length ? 'Aucun résultat.' : 'Aucune pièce enregistrée.'}</td></tr>
            ) : filteredPieces.map((piece) => <tr key={piece._id}>
              <td>{piece.reference}</td><td>{piece.nom}</td>
              <td><strong>{piece.stock}</strong>{piece.stock <= piece.seuilAlerte && <span className="stock-alert"> · stock bas</span>}</td>
              <td>{piece.categorie || '—'}</td>
              <td>{canManage && <div className="stock-adjust-actions"><button type="button" aria-label={`Retirer une unité de ${piece.nom}`} onClick={() => adjustStock(piece, -1)} disabled={piece.stock <= 0}>−</button><button type="button" aria-label={`Ajouter une unité de ${piece.nom}`} onClick={() => adjustStock(piece, 1)}>+</button></div>}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PieceManagement;
