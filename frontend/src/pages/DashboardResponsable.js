// DashboardResponsable.jsx
import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import DashboardSidebar from '../components/DashboardSidebar';
import DashboardOverview from '../components/DashboardOverview';
import useDashboardNavigation from '../hooks/useDashboardNavigation';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appStorage } from '../utils/appStorage';
import './DashboardResponsable.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const escapeHtml = (value) => String(value || '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));

const DashboardResponsable = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [devices, setDevices] = useState([]); // Compatible avec autres dashboards
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [activeTab, setActiveTab] = useDashboardNavigation('overview', ['overview', 'supervision', 'facturation', 'rapports', 'clients']);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [correctionReason, setCorrectionReason] = useState('');
  const [selectedFacture, setSelectedFacture] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (user?.demo) {
      const savedDevices = appStorage.getItem('bureau_devices');
      const savedUsers = appStorage.getItem('bureau_users');
      const localDevices = savedDevices ? JSON.parse(savedDevices) : [];
      const localUsers = savedUsers ? JSON.parse(savedUsers) : [];
      setDevices(localDevices);
      setClients(localUsers.filter((localUser) => localUser.role === 'USER'));
      generateFacturesFromDevices(localDevices);
      setError('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Charger tous les appareils (compatible avec UserDashboard)
      const devicesResponse = await axios.get(`${API_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const deviceRows = Array.isArray(devicesResponse.data) ? devicesResponse.data : [];
      setDevices(deviceRows);
      // The current schema stores invoice metadata on each repair record.
      generateFacturesFromDevices(deviceRows);
      
      // Charger les clients
      const clientsResponse = await axios.get(`${API_URL}/users?role=USER`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClients(clientsResponse.data);
      
      setError('');
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Vérifiez votre connexion.');
      setDevices([]);
      setClients([]);
      setFactures([]);
    } finally {
      setLoading(false);
    }
  };

  const generateFacturesFromDevices = (devicesList) => {
    const generatedFactures = devicesList
      .filter(device => device.facture?.montant > 0)
      .map(device => {
        const id = String(device.id || device._id);
        const owner = device.userId && typeof device.userId === 'object' ? device.userId : null;
        return {
          id: device.facture.numero || `FAC-${new Date(device.dateDepot).getFullYear()}-${id.slice(-6).toUpperCase()}`,
          deviceId: id,
          client: device.clientName || [owner?.prenom, owner?.nom].filter(Boolean).join(' ') || owner?.username || 'Client',
          email: owner?.email || '',
          deviceName: device.name || `${device.marque} ${device.modele}`,
          date: device.facture.dateEmission || device.dateDepot,
          montant: Number(device.facture.montant),
          statutPaiement: device.facture.payee ? 'paye' : 'en_attente',
          pieces: device.piecesUtilisees || [],
          mainOeuvre: device.tempsTravail || 0
        };
      });
    
    setFactures(generatedFactures);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const updateRepairStatus = async (status, note = '') => {
    if (!selectedDevice) return;
    const id = String(selectedDevice.id || selectedDevice._id);
    try {
      let updatedDevice;
      if (user?.demo) {
        updatedDevice = {
          ...selectedDevice,
          status,
          notes: note ? [...(selectedDevice.notes || []), { user: user.username, message: note, date: new Date().toISOString() }] : selectedDevice.notes
        };
      } else {
        const response = await axios.put(`${API_URL}/devices/${id}`, { status, note }, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        updatedDevice = response.data;
      }
      const updatedDevices = devices.map(device => String(device.id || device._id) === id ? updatedDevice : device);
      setDevices(updatedDevices);
      if (user?.demo) appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      setSelectedDevice(updatedDevice);
      setCorrectionReason('');
      setError('');
      generateFacturesFromDevices(updatedDevices);
    } catch (updateError) {
      setError(updateError.response?.data?.message || 'Le changement de statut n’a pas été enregistré.');
    }
  };

  const genererFacture = async (device) => {
    const answer = window.prompt('Saisissez le montant total convenu avec le client (€). Aucune taxe ni échéance ne sera ajoutée automatiquement.', device.facture?.montant || '');
    if (answer === null) return;
    const amount = Number(answer.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0 || amount > 10000000) {
      setError('Saisissez un montant supérieur à 0 et inférieur à 10 000 000 €.');
      return;
    }

    const id = String(device.id || device._id);
    const invoiceNumber = device.facture?.numero || `FAC-${new Date().getFullYear()}-${id.slice(-6).toUpperCase()}`;
    const invoiceDate = new Date().toISOString();
    const invoice = { montant: amount, numero: invoiceNumber, dateEmission: invoiceDate, payee: false, url: '' };
    try {
      let savedDevice;
      if (user?.demo) {
        savedDevice = { ...device, facture: invoice };
      } else {
        const response = await axios.put(`${API_URL}/devices/${id}`, { facture: invoice }, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
        });
        savedDevice = response.data;
      }
      const updatedDevices = devices.map(item => String(item.id || item._id) === id ? savedDevice : item);
      setDevices(updatedDevices);
      if (user?.demo) appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      generateFacturesFromDevices(updatedDevices);
      setSelectedDevice(savedDevice);
      setError('');
      alert(`Facture ${invoiceNumber} enregistrée. Le document peut être imprimé en PDF depuis la liste des factures.`);
    } catch (err) {
      console.error('Erreur génération facture:', err);
      setError(err.response?.data?.message || 'La facture n’a pas pu être enregistrée.');
    }
  };

  const validerPaiement = async (factureId) => {
    if (!user?.demo) {
      setError('La confirmation de paiement en ligne n’est pas configurée. Ne marquez la facture payée qu’après vérification du règlement.');
      return;
    }
    const invoice = factures.find(item => item.id === factureId);
    if (!invoice) return;
    const updatedDevices = devices.map(device => String(device.id || device._id) === String(invoice.deviceId)
      ? { ...device, facture: { ...device.facture, payee: true } }
      : device);
    setDevices(updatedDevices);
    appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
    generateFacturesFromDevices(updatedDevices);
    setError('Simulation de paiement enregistrée dans les données de démonstration.');
  };

  const genererRapport = () => {
    const nouveauRapport = {
      id: `RAP-${new Date().getFullYear()}-${(rapports.length + 1).toString().padStart(3, '0')}`,
      titre: `Rapport ${new Date().toLocaleDateString('fr-FR')}`,
      periode: `${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('fr-FR')} - ${new Date().toLocaleDateString('fr-FR')}`,
      nbReparations: devices.length,
      chiffreAffaires: factures.filter(f => f.statutPaiement === 'paye').reduce((sum, f) => sum + f.montant, 0),
      tauxReussite: Math.round((devices.filter(d => d.status === 'termine' || d.status === 'recupere').length / devices.length) * 100) || 0,
      details: {
        appareilsParType: getAppareilsParType(),
        revenusParMois: getRevenusParMois(),
        clientsActifs: new Set(devices.map(d => d.clientName)).size
      },
      dateGeneration: new Date().toISOString().split('T')[0]
    };

    setRapports([nouveauRapport, ...rapports]);
    alert(`Rapport ${nouveauRapport.id} généré avec succès !`);
  };

  const getAppareilsParType = () => {
    const types = {};
    devices.forEach(device => {
      types[device.type] = (types[device.type] || 0) + 1;
    });
    return types;
  };

  const getRevenusParMois = () => {
    const mois = {};
    factures
      .filter(f => f.statutPaiement === 'paye')
      .forEach(facture => {
        const moisKey = facture.date.substring(0, 7); // YYYY-MM
        mois[moisKey] = (mois[moisKey] || 0) + facture.montant;
      });
    return mois;
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
      'nouveau': 'Nouveau',
      'en_diagnostic': 'Diagnostic',
      'en_reparation': 'Réparation',
      'en_attente_piece': 'Attente pièce',
      'pret_a_recuperer': 'Prêt à récupérer',
      'termine': 'Terminé',
      'recupere': 'Récupéré'
    };
    return statusMap[status] || status;
  };

  const getStatutPaiementColor = (statut) => {
    switch(statut) {
      case 'en_attente': return 'orange';
      case 'paye': return 'green';
      case 'en_retard': return 'red';
      default: return 'gray';
    }
  };

  const calculerChiffreAffaires = () => {
    return factures.filter(f => f.statutPaiement === 'paye').reduce((sum, f) => sum + f.montant, 0);
  };

  const calculerTauxReussite = () => {
    return Math.round((devices.filter(d => d.status === 'termine' || d.status === 'recupere').length / devices.length) * 100) || 0;
  };

  const calculerRetards = () => factures.filter(f => f.statutPaiement === 'en_attente').length;

  const envoyerRappel = (facture) => {
    const client = clients.find(c =>
      c.prenom && c.nom && 
      String(facture.client || '').includes(c.prenom) && String(facture.client || '').includes(c.nom)
    );
    const email = facture.email || client?.email;
    if (!email) {
      setError('Adresse e-mail du client indisponible.');
      return;
    }
    const message = `Bonjour ${client?.prenom || facture.client || 'Madame, Monsieur'},\n\nVotre facture ${facture.id} d'un montant de ${Number(facture.montant).toFixed(2)} € est en attente de paiement.\n\nCordialement,\nRepAppBuro`;
    const subject = encodeURIComponent(`Facture ${facture.id}`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${encodeURIComponent(message)}`;
    setError('Brouillon d’e-mail ouvert. Le rappel ne sera envoyé qu’après votre envoi depuis votre messagerie.');
  };

  const imprimerFacture = (facture) => {
    const popup = window.open('', '_blank');
    if (!popup) {
      setError('Autorisez les fenêtres contextuelles pour imprimer la facture.');
      return;
    }
    popup.document.write(`<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Facture ${escapeHtml(facture.id)}</title><style>body{font:16px Arial,sans-serif;color:#17263e;max-width:760px;margin:48px auto;padding:24px}header{border-bottom:3px solid #35d6bc;padding-bottom:20px;margin-bottom:28px}h1{margin:0 0 8px}table{width:100%;border-collapse:collapse;margin:24px 0}th,td{text-align:left;padding:12px;border-bottom:1px solid #dfe7f1}.total{text-align:right;font-size:22px;font-weight:bold}.muted{color:#71839d}@media print{body{margin:0;padding:0}}</style></head><body><header><h1>RepAppBuro</h1><div class="muted">Facture ${escapeHtml(facture.id)}</div></header><p><strong>Client :</strong> ${escapeHtml(facture.client)}</p><p><strong>Appareil :</strong> ${escapeHtml(facture.deviceName)}</p><p><strong>Date d’émission :</strong> ${escapeHtml(new Date(facture.date).toLocaleDateString('fr-FR'))}</p><table><thead><tr><th>Description</th><th>Montant convenu</th></tr></thead><tbody><tr><td>Réparation ${escapeHtml(facture.deviceName)}</td><td>${Number(facture.montant).toFixed(2)} €</td></tr></tbody></table><p class="total">Total : ${Number(facture.montant).toFixed(2)} €</p><p class="muted">Aucune taxe ou échéance n’est ajoutée automatiquement par l’application.</p></body></html>`);
    popup.document.close();
    popup.focus();
    popup.print();
  };

  if (loading && devices.length === 0) {
    return (
      <div className="dashboard-responsable loading">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className={`dashboard-responsable${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      {/* Header */}
      <DashboardHeader role="RESPONSABLE" roleLabel="Pilotage atelier" title="Tableau de bord responsable" subtitle={'Supervision et gestion financi\u00e8re'} user={user} onLogout={handleLogout} onRefresh={fetchData} />
      <div className={`dashboard-workspace${sidebarCollapsed ? ' is-sidebar-collapsed' : ''}`}>
      <DashboardSidebar role="RESPONSABLE" user={user} activeItem={activeTab} onNavigate={setActiveTab} onLogout={handleLogout} onCollapseChange={setSidebarCollapsed} />
        <main className="dashboard-workspace-main">

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {activeTab === 'overview' && <DashboardOverview
        roleLabel="Pilotage atelier"
        description="Suivez l’activité de l’atelier, les résultats et les factures à encaisser."
        metrics={[
          { label: 'Appareils', value: devices.length },
          { label: 'Chiffre d’affaires', value: `${calculerChiffreAffaires().toFixed(2)} €` },
          { label: 'Taux de réussite', value: `${calculerTauxReussite()} %` },
          { label: 'Factures à encaisser', value: calculerRetards() }
        ]}
        links={[{ id: 'supervision', label: 'Superviser les réparations' }, { id: 'facturation', label: 'Gérer la facturation' }, { id: 'rapports', label: 'Consulter les rapports' }]}
        onNavigate={setActiveTab}
      />}

      {/* Navigation */}
      <div className="responsable-tabs">
        <button 
          className={`tab-btn ${activeTab === 'supervision' ? 'active' : ''}`}
          onClick={() => setActiveTab('supervision')}
        >
          👁️ Supervision
        </button>
        <button 
          className={`tab-btn ${activeTab === 'facturation' ? 'active' : ''}`}
          onClick={() => setActiveTab('facturation')}
        >
          💰 Facturation ({factures.filter(f => f.statutPaiement === 'en_attente').length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rapports' ? 'active' : ''}`}
          onClick={() => setActiveTab('rapports')}
        >
          📊 Rapports
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          👥 Clients ({clients.length})
        </button>
      </div>

      {/* Recherche */}
      {['supervision', 'facturation', 'clients'].includes(activeTab) && <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Rechercher appareil, facture ou client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>}

      {/* Contenu */}
      <div className="responsable-content">
        {/* Onglet: Supervision */}
        {activeTab === 'supervision' && (
          <div className="tab-content">
            <h2 className="tab-title">👁️ Supervision des réparations</h2>
            
            <div className="supervision-header">
              <h3>Appareils en réparation ({devices.length})</h3>
              <button onClick={genererRapport} className="generate-report-btn">
                📄 Générer rapport
              </button>
            </div>
            
            <div className="devices-table-container">
              <table className="devices-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Client</th>
                    <th>Appareil</th>
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th>Date dépôt</th>
                    <th>Facture</th>
                    <th>Montant</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {devices.map(device => (
                    <tr key={device.id || device._id}>
                      <td><strong>{device.etiquette || device.id || device._id}</strong></td>
                      <td>{device.clientName}</td>
                      <td>{device.marque} {device.modele}</td>
                      <td>{device.type}</td>
                      <td>
                        <span className={`statut-badge badge-${getStatutColor(device.status)}`}>
                          {getStatutLabel(device.status)}
                        </span>
                      </td>
                      <td>{device.assignedTo || 'Non assigné'}</td>
                      <td>{new Date(device.dateDepot).toLocaleDateString('fr-FR')}</td>
                      <td>
                        {device.facture?.montant ? (
                          <span className={`facture-status ${device.facture.payee ? 'paid' : device.facture.montant > 0 ? 'generated' : 'pending'}`}>
                            {device.facture.payee ? '✅ Payée' : device.facture.montant > 0 ? '📝 Générée' : '❌ À faire'}
                          </span>
                        ) : (
                          <button 
                            onClick={() => genererFacture(device)}
                            className="generate-facture-btn"
                          >
                            📝 Générer
                          </button>
                        )}
                      </td>
                      <td>
                        {device.facture?.montant ? `${device.facture.montant.toFixed(2)}€` : '-'}
                      </td>
                      <td>
                        <button 
                          onClick={() => setSelectedDevice(device)}
                          className="action-btn small"
                        >
                          👁️ Voir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedDevice && <section className="tab-content repair-review-panel" aria-label="Contrôle de la réparation">
              <div className="section-header">
                <div>
                  <h3>Contrôle de la réparation</h3>
                  <p>{selectedDevice.name || `${selectedDevice.marque} ${selectedDevice.modele}`} · {getStatutLabel(selectedDevice.status)}</p>
                </div>
                <button type="button" className="action-btn small" onClick={() => setSelectedDevice(null)}>Fermer</button>
              </div>
              <p><strong>Diagnostic :</strong> {selectedDevice.diagnostic || 'Non renseigné'}</p>
              <p><strong>Pièces :</strong> {(selectedDevice.piecesUtilisees || []).map(part => `${part.nom} × ${part.quantite}`).join(', ') || 'Aucune déclarée'}</p>
              <p><strong>Temps déclaré :</strong> {selectedDevice.tempsTravail || 0} min</p>
              <p><strong>Historique :</strong></p>
              <ul>{(selectedDevice.historique || []).map((entry, index) => <li key={`${entry.date || index}-${index}`}>{entry.date ? new Date(entry.date).toLocaleString('fr-FR') : ''} · {entry.message}</li>)}</ul>
              {selectedDevice.status === 'termine' && <div className="repair-review-actions">
                <label htmlFor="correction-reason">Motif si une correction est nécessaire</label>
                <textarea id="correction-reason" value={correctionReason} onChange={event => setCorrectionReason(event.target.value)} maxLength={2000} placeholder="Décrivez le point à reprendre" />
                <button type="button" className="action-btn" disabled={!correctionReason.trim()} onClick={() => updateRepairStatus('en_reparation', correctionReason.trim())}>Demander une correction</button>
                <button type="button" className="action-btn validate-btn" onClick={() => updateRepairStatus('pret_a_recuperer')}>Valider et informer de la disponibilité</button>
              </div>}
              {selectedDevice.status === 'pret_a_recuperer' && <button type="button" className="action-btn validate-btn" onClick={() => updateRepairStatus('recupere')}>Enregistrer la restitution</button>}
            </section>}
          </div>
        )}

        {/* Onglet: Facturation */}
        {activeTab === 'facturation' && (
          <div className="tab-content">
            <h2 className="tab-title">💰 Gestion des factures ({factures.length})</h2>
            
            <div className="factures-filters">
              <button 
                className={`filter-btn ${!selectedFacture ? 'active' : ''}`}
                onClick={() => setSelectedFacture(null)}
              >
                Toutes ({factures.length})
              </button>
              <button 
                className={`filter-btn ${selectedFacture === 'en_attente' ? 'active' : ''}`}
                onClick={() => setSelectedFacture('en_attente')}
              >
                En attente ({factures.filter(f => f.statutPaiement === 'en_attente').length})
              </button>
              <button 
                className={`filter-btn ${selectedFacture === 'paye' ? 'active' : ''}`}
                onClick={() => setSelectedFacture('paye')}
              >
                Payées ({factures.filter(f => f.statutPaiement === 'paye').length})
              </button>
            </div>
            
            <div className="factures-grid">
              {factures
                .filter(f => !selectedFacture || f.statutPaiement === selectedFacture)
                .map(facture => (
                  <div key={facture.id} className="facture-card">
                    <div className="facture-header">
                      <div className="facture-id">
                        <h3>{facture.id}</h3>
                        <span className={`paiement-badge badge-${getStatutPaiementColor(facture.statutPaiement)}`}>
                          {facture.statutPaiement === 'paye' ? 'Payée' : 'En attente'}
                        </span>
                      </div>
                      <div className="facture-montant">
                        <h3>{facture.montant.toFixed(2)}€</h3>
                      </div>
                    </div>
                    
                    <div className="facture-details">
                      <p><strong>Appareil:</strong> {facture.deviceName}</p>
                      <p><strong>Client:</strong> {facture.client}</p>
                      <p><strong>Date:</strong> {facture.date}</p>
                      <p><strong>Émise le :</strong> {new Date(facture.date).toLocaleDateString('fr-FR')}</p>
                      {facture.pieces && facture.pieces.length > 0 && (
                        <p><strong>Pièces:</strong> {facture.pieces.length} type(s)</p>
                      )}
                    </div>
                    
                    <div className="facture-actions">
                      <button className="action-btn" type="button" onClick={() => imprimerFacture(facture)}>
                        Imprimer / PDF
                      </button>
                      {facture.statutPaiement !== 'paye' && (
                        <>
                          {user?.demo && <button type="button" onClick={() => validerPaiement(facture.id)} className="action-btn validate-btn">Simuler un règlement</button>}
                          <button 
                            onClick={() => envoyerRappel(facture)}
                            className="action-btn reminder-btn"
                          >
                            Préparer un e-mail
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Onglet: Rapports */}
        {activeTab === 'rapports' && (
          <div className="tab-content">
            <h2 className="tab-title">📊 Rapports d'activité</h2>
            
            <div className="rapports-grid">
              {rapports.map(rapport => (
                <div key={rapport.id} className="rapport-card">
                  <div className="rapport-header">
                    <h3>{rapport.titre}</h3>
                    <span className="rapport-date">{rapport.dateGeneration}</span>
                  </div>
                  
                  <div className="rapport-details">
                    <p><strong>Période:</strong> {rapport.periode}</p>
                    <div className="rapport-stats">
                      <div className="rapport-stat">
                        <span className="stat-value">{rapport.nbReparations}</span>
                        <span className="stat-label">Appareils</span>
                      </div>
                      <div className="rapport-stat">
                        <span className="stat-value">{rapport.chiffreAffaires.toFixed(2)}€</span>
                        <span className="stat-label">Chiffre d'affaires</span>
                      </div>
                      <div className="rapport-stat">
                        <span className="stat-value">{rapport.tauxReussite}%</span>
                        <span className="stat-label">Taux de réussite</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rapport-actions">
                    <button className="action-btn">
                      📊 Voir
                    </button>
                    <button className="action-btn">
                      📄 PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="generate-rapport-section">
              <button onClick={genererRapport} className="generate-rapport-btn">
                📈 Générer un nouveau rapport
              </button>
            </div>
          </div>
        )}

        {/* Onglet: Clients */}
        {activeTab === 'clients' && (
          <div className="tab-content">
            <h2 className="tab-title">👥 Gestion des clients ({clients.length})</h2>
            
            <div className="clients-stats">
              <div className="client-stat">
                <h3>{new Set(devices.map(d => d.clientName)).size}</h3>
                <p>Clients actifs</p>
              </div>
              <div className="client-stat">
                <h3>{factures.filter(f => f.statutPaiement === 'paye').length}</h3>
                <p>Factures payées</p>
              </div>
              <div className="client-stat">
                <h3>
                  {clients.filter(c => 
                    devices.some(d => d.userId === c.id && d.status === 'termine')
                  ).length}
                </h3>
                <p>Réparations terminées</p>
              </div>
            </div>
            
            <div className="clients-table-container">
              <h3>Top clients par chiffre d'affaires</h3>
              <table className="clients-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Type</th>
                    <th>Appareils</th>
                    <th>Montant total</th>
                    <th>Dernière facture</th>
                    <th>Statut paiement</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.slice(0, 10).map(client => {
                    const clientDevices = devices.filter(d => d.userId === client.id);
                    const clientFactures = factures.filter(f => 
                      clientDevices.some(d => d.id === f.deviceId || d._id === f.deviceId)
                    );
                    
                    if (clientDevices.length === 0) return null;
                    
                    return (
                      <tr key={client.id}>
                        <td>
                          <strong>{client.prenom} {client.nom}</strong>
                          {client.societe && <div><small>{client.societe}</small></div>}
                        </td>
                        <td>{client.societe ? 'Entreprise' : 'Particulier'}</td>
                        <td>{clientDevices.length}</td>
                        <td>
                          <strong>{clientFactures.reduce((sum, f) => sum + f.montant, 0).toFixed(2)}€</strong>
                        </td>
                        <td>
                          {clientFactures.length > 0 
                            ? new Date(clientFactures[0].date).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </td>
                        <td>
                          {clientFactures.every(f => f.statutPaiement === 'paye') ? (
                            <span className="paiement-ok">✅ À jour</span>
                          ) : clientFactures.some(f => f.statutPaiement === 'en_attente') ? (
                            <span className="paiement-attente">⚠️ En attente</span>
                          ) : (
                            <span className="paiement-none">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
        </main>
      </div>
      <DashboardFooter />
    </div>
  );
};

export default DashboardResponsable;
