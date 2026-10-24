import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appStorage } from '../utils/appStorage';
import './DashboardAdmin.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DashboardAdmin = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [devices, setDevices] = useState([]); // Ajout des appareils
  const [activeTab, setActiveTab] = useState('utilisateurs');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [nouvelUtilisateur, setNouvelUtilisateur] = useState({
    username: '',
    email: '',
    prenom: '',
    nom: '',
    role: 'USER',
    telephone: '',
    actif: true,
    password: ''
  });

  const roles = ['ADMIN', 'RESPONSABLE', 'TECHNICIEN', 'RSC', 'USER'];
  const droitsAcces = {
    ADMIN: ['Tous les droits'],
    RESPONSABLE: ['Supervision', 'Facturation', 'Rapports'],
    TECHNICIEN: ['Réparations', 'Fiches techniques'],
    RSC: ['Clients', 'Réceptions'],
    USER: ['Consultation']
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    if (user?.demo) {
      const savedDevices = appStorage.getItem('bureau_devices');
      const savedUsers = appStorage.getItem('bureau_users');
      setDevices(savedDevices ? JSON.parse(savedDevices) : []);
      setUtilisateurs(savedUsers ? JSON.parse(savedUsers) : []);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Charger les utilisateurs
      const usersResponse = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUtilisateurs(usersResponse.data);
      
      // Charger tous les appareils
      const devicesResponse = await axios.get(`${API_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(devicesResponse.data);
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      // Fallback localStorage
      const savedDevices = appStorage.getItem('bureau_devices');
      const savedUsers = appStorage.getItem('bureau_users');
      if (savedDevices) setDevices(JSON.parse(savedDevices));
      if (savedUsers) setUtilisateurs(JSON.parse(savedUsers));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const creerUtilisateur = async (e) => {
    e.preventDefault();
    
    try {
      const response = await axios.post(`${API_URL}/users`, nouvelUtilisateur, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUtilisateurs([...utilisateurs, response.data]);
      
      // Mettre à jour localStorage
      appStorage.setItem('bureau_users', JSON.stringify([...utilisateurs, response.data]));
      
      setNouvelUtilisateur({
        username: '',
        email: '',
        prenom: '',
        nom: '',
        role: 'USER',
        telephone: '',
        actif: true,
        password: ''
      });
      
      alert(`Utilisateur ${response.data.username} créé avec succès !`);
    } catch (err) {
      console.error('Erreur création utilisateur:', err);
      alert('Erreur lors de la création de l\'utilisateur');
    }
  };

  const modifierUtilisateur = async (userId, modifications) => {
    try {
      await axios.put(`${API_URL}/users/${userId}`, modifications, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUtilisateurs(utilisateurs.map(u => 
        u.id === userId ? { ...u, ...modifications } : u
      ));
      
      alert('Utilisateur mis à jour avec succès !');
    } catch (err) {
      console.error('Erreur modification utilisateur:', err);
      alert('Erreur lors de la mise à jour');
    }
  };

  const supprimerUtilisateur = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await axios.delete(`${API_URL}/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setUtilisateurs(utilisateurs.filter(u => u.id !== userId));
        alert('Utilisateur supprimé avec succès !');
      } catch (err) {
        console.error('Erreur suppression utilisateur:', err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const toggleActif = (userId) => {
    const user = utilisateurs.find(u => u.id === userId);
    modifierUtilisateur(userId, { actif: !user.actif });
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'red';
      case 'RESPONSABLE': return 'purple';
      case 'TECHNICIEN': return 'orange';
      case 'RSC': return 'blue';
      case 'USER': return 'green';
      default: return 'gray';
    }
  };

  const getStatutSysteme = () => {
    return {
      utilisateursActifs: utilisateurs.filter(u => u.actif).length,
      totalUtilisateurs: utilisateurs.length,
      appareilsEnCours: devices.filter(d => 
        ['nouveau', 'en_diagnostic', 'en_reparation', 'en_attente_piece'].includes(d.status)
      ).length,
      appareilsTermines: devices.filter(d => 
        ['termine', 'recupere'].includes(d.status)
      ).length
    };
  };

  const getStatutColor = (status) => {
    const colorMap = {
      'nouveau': 'blue',
      'en_diagnostic': 'orange',
      'en_reparation': 'red',
      'en_attente_piece': 'yellow',
      'pret_a_recuperer': 'green',
      'termine': 'purple',
      'recupere': 'gray'
    };
    return colorMap[status] || 'gray';
  };

  const getStatutLabel = (status) => {
    const statusMap = {
      'nouveau': 'Nouvelle demande',
      'en_diagnostic': 'En diagnostic',
      'en_reparation': 'En réparation',
      'en_attente_piece': 'En attente de pièce',
      'pret_a_recuperer': 'Prêt à récupérer',
      'termine': 'Terminé',
      'recupere': 'Récupéré'
    };
    return statusMap[status] || status;
  };

  const statutSysteme = getStatutSysteme();

  // Calculer les statistiques financières
  const getStatistiquesFinancieres = () => {
    const facturesPayees = devices.filter(d => d.facture?.payee);
    const chiffreAffaires = facturesPayees.reduce((total, d) => total + (d.facture?.montant || 0), 0);
    
    return {
      totalAppareils: devices.length,
      facturesPayees: facturesPayees.length,
      chiffreAffaires: chiffreAffaires,
      moyenneFacture: facturesPayees.length > 0 ? chiffreAffaires / facturesPayees.length : 0
    };
  };

  const statsFinancieres = getStatistiquesFinancieres();

  if (loading) {
    return (
      <div className="dashboard-admin loading">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-admin">
      {/* Header */}
      <DashboardHeader role="ADMIN" roleLabel="Administrateur" title="Tableau de bord administrateur" subtitle={'Gestion compl\u00e8te du syst\u00e8me'} user={user} onLogout={handleLogout} onRefresh={fetchAllData} />

      {/* Statistiques système */}
      <div className="system-stats">
        <div className="system-stat">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{statutSysteme.utilisateursActifs}/{statutSysteme.totalUtilisateurs}</h3>
            <p>Utilisateurs actifs</p>
          </div>
        </div>
        <div className="system-stat">
          <div className="stat-icon">🖨️</div>
          <div className="stat-info">
            <h3>{statutSysteme.appareilsEnCours}</h3>
            <p>Appareils en cours</p>
          </div>
        </div>
        <div className="system-stat">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{statutSysteme.appareilsTermines}</h3>
            <p>Réparations terminées</p>
          </div>
        </div>
        <div className="system-stat">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{statsFinancieres.chiffreAffaires.toFixed(2)}€</h3>
            <p>Chiffre d'affaires</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'utilisateurs' ? 'active' : ''}`}
          onClick={() => setActiveTab('utilisateurs')}
        >
          👥 Utilisateurs
        </button>
        <button 
          className={`tab-btn ${activeTab === 'appareils' ? 'active' : ''}`}
          onClick={() => setActiveTab('appareils')}
        >
          🖨️ Appareils ({devices.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'droits' ? 'active' : ''}`}
          onClick={() => setActiveTab('droits')}
        >
          🔐 Droits d'accès
        </button>
        <button 
          className={`tab-btn ${activeTab === 'finances' ? 'active' : ''}`}
          onClick={() => setActiveTab('finances')}
        >
          💰 Finances
        </button>
        <button 
          className={`tab-btn ${activeTab === 'systeme' ? 'active' : ''}`}
          onClick={() => setActiveTab('systeme')}
        >
          ⚙️ Système
        </button>
      </div>

      {/* Recherche */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Rechercher..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Contenu */}
      <div className="admin-content">
        {/* Onglet: Utilisateurs */}
        {activeTab === 'utilisateurs' && (
          <div className="tab-content">
            <h2 className="tab-title">👥 Gestion des utilisateurs</h2>
            
            <div className="users-section">
              {/* Formulaire création */}
              <div className="create-user-form">
                <h3>Créer un nouvel utilisateur</h3>
                <form onSubmit={creerUtilisateur}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Nom d'utilisateur *</label>
                      <input
                        type="text"
                        value={nouvelUtilisateur.username}
                        onChange={(e) => setNouvelUtilisateur({...nouvelUtilisateur, username: e.target.value})}
                        placeholder="Username"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Mot de passe *</label>
                      <input
                        type="password"
                        value={nouvelUtilisateur.password}
                        onChange={(e) => setNouvelUtilisateur({...nouvelUtilisateur, password: e.target.value})}
                        placeholder="Mot de passe"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={nouvelUtilisateur.email}
                        onChange={(e) => setNouvelUtilisateur({...nouvelUtilisateur, email: e.target.value})}
                        placeholder="email@exemple.com"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Prénom *</label>
                      <input
                        type="text"
                        value={nouvelUtilisateur.prenom}
                        onChange={(e) => setNouvelUtilisateur({...nouvelUtilisateur, prenom: e.target.value})}
                        placeholder="Prénom"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Nom *</label>
                      <input
                        type="text"
                        value={nouvelUtilisateur.nom}
                        onChange={(e) => setNouvelUtilisateur({...nouvelUtilisateur, nom: e.target.value})}
                        placeholder="Nom"
                        required
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Rôle</label>
                      <select
                        value={nouvelUtilisateur.role}
                        onChange={(e) => setNouvelUtilisateur({...nouvelUtilisateur, role: e.target.value})}
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="form-group">
                      <label>Téléphone</label>
                      <input
                        type="tel"
                        value={nouvelUtilisateur.telephone}
                        onChange={(e) => setNouvelUtilisateur({...nouvelUtilisateur, telephone: e.target.value})}
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>
                  
                  <button type="submit" className="submit-btn">
                    👤 Créer l'utilisateur
                  </button>
                </form>
              </div>

              {/* Liste des utilisateurs */}
              <div className="users-list">
                <h3>Liste des utilisateurs ({utilisateurs.length})</h3>
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Nom complet</th>
                        <th>Rôle</th>
                        <th>Email</th>
                        <th>Appareils</th>
                        <th>Statut</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {utilisateurs.map(user => {
                        const userDevices = devices.filter(d => d.userId === user.id || d.clientId === user.id);
                        return (
                          <tr key={user.id}>
                            <td><strong>{user.username}</strong></td>
                            <td>{user.prenom} {user.nom}</td>
                            <td>
                              <span className={`role-badge badge-${getRoleColor(user.role)}`}>
                                {user.role}
                              </span>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <span className="device-count">{userDevices.length} app.</span>
                            </td>
                            <td>
                              {user.actif ? (
                                <span className="statut-actif">✅ Actif</span>
                              ) : (
                                <span className="statut-inactif">❌ Inactif</span>
                              )}
                            </td>
                            <td>
                              <div className="user-actions">
                                <button 
                                  onClick={() => toggleActif(user.id)}
                                  className={`action-btn small ${user.actif ? 'deactivate' : 'activate'}`}
                                >
                                  {user.actif ? '❌ Désactiver' : '✅ Activer'}
                                </button>
                                <button 
                                  onClick={() => setSelectedUser(user)}
                                  className="action-btn small"
                                >
                                  ✏️ Modifier
                                </button>
                                <button 
                                  onClick={() => supprimerUtilisateur(user.id)}
                                  className="action-btn small delete"
                                  disabled={user.role === 'ADMIN'}
                                >
                                  🗑️ Supprimer
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Onglet: Appareils */}
        {activeTab === 'appareils' && (
          <div className="tab-content">
            <h2 className="tab-title">🖨️ Tous les appareils ({devices.length})</h2>
            
            <div className="devices-section">
              <div className="devices-filters">
                <select className="filter-select">
                  <option value="all">Tous les statuts</option>
                  <option value="nouveau">Nouveau</option>
                  <option value="en_reparation">En réparation</option>
                  <option value="termine">Terminé</option>
                </select>
                <select className="filter-select">
                  <option value="all">Tous les types</option>
                  <option value="Imprimante">Imprimante</option>
                  <option value="Photocopieur">Photocopieur</option>
                  <option value="Scanner">Scanner</option>
                </select>
              </div>
              
              <div className="devices-table-container">
                <table className="devices-table">
                  <thead>
                    <tr>
                      <th>Appareil</th>
                      <th>Client</th>
                      <th>Type</th>
                      <th>Problème</th>
                      <th>Statut</th>
                      <th>Technicien</th>
                      <th>Facture</th>
                      <th>Date dépôt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices.map(device => (
                      <tr key={device.id || device._id}>
                        <td>
                          <strong>{device.name}</strong><br/>
                          <small>{device.marque} {device.modele}</small>
                        </td>
                        <td>{device.clientName}</td>
                        <td>{device.type}</td>
                        <td>{device.problem.substring(0, 50)}...</td>
                        <td>
                          <span className={`statut-badge badge-${getStatutColor(device.status)}`}>
                            {getStatutLabel(device.status)}
                          </span>
                        </td>
                        <td>
                          {device.assignedTo ? (
                            <span className="assigned-to">{device.assignedTo}</span>
                          ) : (
                            <span className="not-assigned">Non assigné</span>
                          )}
                        </td>
                        <td>
                          {device.facture?.montant ? (
                            <span className={`facture-status ${device.facture.payee ? 'paid' : 'unpaid'}`}>
                              {device.facture.montant}€ {device.facture.payee ? '✅' : '⏳'}
                            </span>
                          ) : (
                            <span className="no-facture">Pas de devis</span>
                          )}
                        </td>
                        <td>{new Date(device.dateDepot).toLocaleDateString('fr-FR')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Onglet: Droits d'accès */}
        {activeTab === 'droits' && (
          <div className="tab-content">
            <h2 className="tab-title">🔐 Gestion des droits d'accès</h2>
            
            <div className="droits-section">
              <div className="roles-grid">
                {roles.map(role => {
                  const usersWithRole = utilisateurs.filter(u => u.role === role);
                  const devicesForRole = role === 'ADMIN' ? devices.length : 
                    role === 'TECHNICIEN' ? devices.filter(d => d.technicianId).length :
                    role === 'USER' ? devices.filter(d => d.userId).length : 0;
                  
                  return (
                    <div key={role} className="role-card">
                      <div className="role-header">
                        <h3>{role}</h3>
                        <span className={`role-badge badge-${getRoleColor(role)}`}>
                          {usersWithRole.length} utilisateurs
                        </span>
                      </div>
                      
                      <div className="role-stats">
                        <div className="role-stat">
                          <span className="stat-label">Utilisateurs:</span>
                          <span className="stat-value">{usersWithRole.length}</span>
                        </div>
                        <div className="role-stat">
                          <span className="stat-label">Appareils:</span>
                          <span className="stat-value">{devicesForRole}</span>
                        </div>
                      </div>
                      
                      <div className="role-permissions">
                        <h4>Permissions</h4>
                        <ul>
                          {droitsAcces[role]?.map((droit, index) => (
                            <li key={index}>{droit}</li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="role-actions">
                        <button className="action-btn">
                          ✏️ Modifier droits
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Onglet: Finances */}
        {activeTab === 'finances' && (
          <div className="tab-content">
            <h2 className="tab-title">💰 Statistiques financières</h2>
            
            <div className="finances-section">
              <div className="finances-stats">
                <div className="finance-card">
                  <h3>Chiffre d'affaires total</h3>
                  <p className="finance-amount">{statsFinancieres.chiffreAffaires.toFixed(2)}€</p>
                  <p className="finance-detail">{statsFinancieres.facturesPayees} factures payées</p>
                </div>
                
                <div className="finance-card">
                  <h3>Facture moyenne</h3>
                  <p className="finance-amount">{statsFinancieres.moyenneFacture.toFixed(2)}€</p>
                  <p className="finance-detail">Par appareil réparé</p>
                </div>
                
                <div className="finance-card">
                  <h3>En attente de paiement</h3>
                  <p className="finance-amount">
                    {devices
                      .filter(d => d.facture?.montant && !d.facture?.payee)
                      .reduce((total, d) => total + d.facture.montant, 0)
                      .toFixed(2)}€
                  </p>
                  <p className="finance-detail">
                    {devices.filter(d => d.facture?.montant && !d.facture?.payee).length} factures
                  </p>
                </div>
              </div>
              
              <div className="finances-table">
                <h3>Top 10 factures</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Client</th>
                      <th>Appareil</th>
                      <th>Montant</th>
                      <th>Statut</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {devices
                      .filter(d => d.facture?.montant)
                      .sort((a, b) => b.facture.montant - a.facture.montant)
                      .slice(0, 10)
                      .map(device => (
                        <tr key={device.id || device._id}>
                          <td>{device.clientName}</td>
                          <td>{device.name}</td>
                          <td><strong>{device.facture.montant}€</strong></td>
                          <td>
                            <span className={`payment-status ${device.facture.payee ? 'paid' : 'unpaid'}`}>
                              {device.facture.payee ? '✅ Payée' : '⏳ En attente'}
                            </span>
                          </td>
                          <td>{new Date(device.dateDepot).toLocaleDateString('fr-FR')}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Onglet: Système */}
        {activeTab === 'systeme' && (
          <div className="tab-content">
            <h2 className="tab-title">⚙️ Supervision du système</h2>
            
            <div className="system-monitoring">
              <div className="monitoring-card">
                <h3>Statistiques système</h3>
                <div className="system-metrics">
                  <div className="system-metric">
                    <span className="metric-label">Utilisateurs actifs</span>
                    <span className="metric-value">{statutSysteme.utilisateursActifs}</span>
                  </div>
                  <div className="system-metric">
                    <span className="metric-label">Appareils en cours</span>
                    <span className="metric-value">{statutSysteme.appareilsEnCours}</span>
                  </div>
                  <div className="system-metric">
                    <span className="metric-label">Appareils terminés</span>
                    <span className="metric-value">{statutSysteme.appareilsTermines}</span>
                  </div>
                  <div className="system-metric">
                    <span className="metric-label">Taux de réussite</span>
                    <span className="metric-value">
                      {devices.length > 0 
                        ? Math.round((statutSysteme.appareilsTermines / devices.length) * 100) 
                        : 0}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="monitoring-card">
                <h3>Actions système</h3>
                <div className="system-actions">
                  <button className="system-btn backup">
                    💾 Sauvegarde données
                  </button>
                  <button className="system-btn export">
                    📤 Exporter les données
                  </button>
                  <button className="system-btn logs">
                    📋 Générer rapport
                  </button>
                  <button 
                    className="system-btn refresh"
                    onClick={fetchAllData}
                  >
                    🔄 Actualiser tout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <DashboardFooter />
    </div>
  );
};

export default DashboardAdmin;
