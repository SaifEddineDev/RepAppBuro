import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { userService } from '../services/api';
import './ClientManagement.css';

const ClientManagement = () => {
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', telephone: '', password: '' });

  const loadClients = useCallback(async () => {
    setLoading(true);
    try {
      const result = await userService.getAllUsers();
      setClients(Array.isArray(result) ? result.filter((item) => item.role === 'USER') : []);
      setError('');
    } catch (loadError) {
      setError(loadError.message || 'Impossible de charger les clients.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadClients(); }, [loadClients]);

  const filteredClients = useMemo(() => {
    const needle = searchTerm.trim().toLocaleLowerCase('fr');
    if (!needle) return clients;
    return clients.filter((client) => [client.prenom, client.nom, client.username, client.email, client.telephone]
      .some((value) => String(value || '').toLocaleLowerCase('fr').includes(needle)));
  }, [clients, searchTerm]);

  const createClient = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const baseUsername = (form.email.split('@')[0] || 'client').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20);
      const client = await userService.createUser({
        ...form,
        username: `${baseUsername || 'client'}-${Date.now().toString(36)}`,
        role: 'USER'
      });
      setClients((current) => [client, ...current]);
      setForm({ prenom: '', nom: '', email: '', telephone: '', password: '' });
      setShowForm(false);
      setSuccess('Le compte client a été créé.');
    } catch (createError) {
      setError(createError.message || 'Impossible de créer le client.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="clients-management-container">
      <div className="clients-header">
        <h1 className="clients-title">Gestion des Clients</h1>
      </div>

      <div className="clients-controls">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Rechercher un client..."
            className="search-input"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>
        <button className="new-client-btn" type="button" onClick={() => { setShowForm((value) => !value); setError(''); }}>
          {showForm ? 'Fermer le formulaire' : 'Nouveau client'}
        </button>
      </div>

      {error && <p role="alert" className="development-notice">{error}</p>}
      {success && <p role="status" className="development-notice">{success}</p>}

      {showForm && (
        <form className="client-create-form" onSubmit={createClient}>
          <label>Prénom<input required maxLength="60" value={form.prenom} onChange={(event) => setForm({ ...form, prenom: event.target.value })} /></label>
          <label>Nom<input required maxLength="60" value={form.nom} onChange={(event) => setForm({ ...form, nom: event.target.value })} /></label>
          <label>E-mail<input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
          <label>Téléphone<input type="tel" maxLength="20" value={form.telephone} onChange={(event) => setForm({ ...form, telephone: event.target.value })} /></label>
          <label>Mot de passe provisoire<input required type="password" minLength="6" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
          <button className="new-client-btn" type="submit" disabled={saving}>{saving ? 'Création…' : 'Créer le compte client'}</button>
        </form>
      )}

      <table className="clients-table">
        <thead>
          <tr>
            <th>Nom</th>
            <th>Téléphone</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {loading ? <tr><td colSpan="3">Chargement des clients…</td></tr> : filteredClients.length === 0 ? (
            <tr className="no-clients-row"><td colSpan="3">{clients.length ? 'Aucun résultat pour cette recherche.' : 'Aucun client enregistré.'}</td></tr>
          ) : filteredClients.map((client) => (
            <tr key={client.id}>
              <td>{[client.prenom, client.nom].filter(Boolean).join(' ') || client.username}</td>
              <td>{client.telephone || '—'}</td>
              <td>{client.email}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ClientManagement;
