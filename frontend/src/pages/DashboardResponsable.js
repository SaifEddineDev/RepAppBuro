// DashboardResponsable.jsx
import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appStorage } from '../utils/appStorage';
import './DashboardResponsable.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DashboardResponsable = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [devices, setDevices] = useState([]); // Compatible avec autres dashboards
  const [factures, setFactures] = useState([]);
  const [clients, setClients] = useState([]);
  const [rapports, setRapports] = useState([]);
  const [activeTab, setActiveTab] = useState('supervision');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);
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
      setDevices(devicesResponse.data);
      
      // Charger les factures (si endpoint existe)
      try {
        const facturesResponse = await axios.get(`${API_URL}/invoices`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFactures(facturesResponse.data);
      } catch (invoiceError) {
        console.log('Endpoint factures non disponible, création locale');
        // Générer des factures à partir des appareils
        generateFacturesFromDevices(devicesResponse.data);
      }
      
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
    // Créer des factures à partir des appareils qui ont un montant
    const generatedFactures = devicesList
      .filter(device => device.facture?.montant > 0)
      .map(device => ({
        id: `FAC-${new Date(device.dateDepot).getFullYear()}-${device.id || device._id}`,
        deviceId: device.id || device._id,
        client: device.clientName,
        deviceName: device.name || `${device.marque} ${device.modele}`,
        date: device.dateDepot,
        montant: device.facture.montant,
        statutPaiement: device.facture.payee ? 'paye' : 'en_attente',
        dateEcheance: new Date(new Date(device.dateDepot).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pieces: device.piecesUtilisees || [],
        mainOeuvre: device.tempsTravail ? (device.tempsTravail / 60) * 60 : 0
      }));
    
    setFactures(generatedFactures);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const genererFacture = async (device) => {
    try {
      // Calculer le coût si non défini
      let coutPieces = 0;
      let coutMainOeuvre = 0;
      
      if (device.piecesUtilisees && device.piecesUtilisees.length > 0) {
        coutPieces = device.piecesUtilisees.reduce((total, piece) => 
          total + (piece.prix * piece.quantite), 0);
      }
      
      if (device.tempsTravail) {
        coutMainOeuvre = (device.tempsTravail / 60) * 60; // 60€/heure
      } else {
        coutMainOeuvre = 75; // Coût par défaut
      }
      
      const total = coutPieces + coutMainOeuvre;
      
      // Créer la facture dans l'API
      const factureData = {
        deviceId: device.id || device._id,
        client: device.clientName,
        montant: total,
        statutPaiement: 'en_attente',
        details: {
          pieces: device.piecesUtilisees || [],
          mainOeuvre: coutMainOeuvre,
          description: `Facture pour réparation ${device.type} ${device.marque} ${device.modele}`
        }
      };
      
      const response = await axios.post(`${API_URL}/invoices`, factureData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour l'appareil avec la facture
      const updatedDevice = {
        ...device,
        facture: {
          ...device.facture,
          montant: total,
          payee: false,
          url: `/factures/${response.data.id}.pdf`
        }
      };
      
      setDevices(devices.map(d => 
        (d.id === device.id || d._id === device._id) ? updatedDevice : d
      ));
      
      // Mettre à jour localStorage
      const updatedDevices = devices.map(d => 
        (d.id === device.id || d._id === device._id) ? updatedDevice : d
      );
      if (user?.demo) appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      
      // Ajouter la facture à la liste
      const nouvelleFacture = {
        ...response.data,
        id: response.data.id || `FAC-${Date.now()}`,
        deviceName: `${device.marque} ${device.modele}`,
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };
      
      setFactures([nouvelleFacture, ...factures]);
      setSelectedDevice(updatedDevice);
      
      alert(`Facture ${nouvelleFacture.id} générée avec succès ! Montant: ${total.toFixed(2)}€`);
      
    } catch (err) {
      console.error('Erreur génération facture:', err);
      if (!user?.demo) {
        setError(err.response?.data?.message || 'La facture n’a pas pu être enregistrée sur le serveur. Aucune facture fictive n’a été créée.');
        return;
      }
      
      // Fallback local
      const coutMainOeuvre = device.tempsTravail ? (device.tempsTravail / 60) * 60 : 75;
      const coutPieces = device.piecesUtilisees ? 
        device.piecesUtilisees.reduce((total, piece) => total + (piece.prix * piece.quantite), 0) : 0;
      const total = coutPieces + coutMainOeuvre;
      
      const factureId = `FAC-${Date.now()}`;
      const nouvelleFacture = {
        id: factureId,
        deviceId: device.id || device._id,
        client: device.clientName,
        deviceName: `${device.marque} ${device.modele}`,
        date: new Date().toISOString().split('T')[0],
        montant: total,
        statutPaiement: 'en_attente',
        dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        pieces: device.piecesUtilisees || [],
        mainOeuvre: coutMainOeuvre
      };
      
      // Mettre à jour l'appareil
      const updatedDevice = {
        ...device,
        facture: {
          ...device.facture,
          montant: total,
          payee: false
        }
      };
      
      setDevices(devices.map(d => 
        (d.id === device.id || d._id === device._id) ? updatedDevice : d
      ));
      
      setFactures([nouvelleFacture, ...factures]);
      
      // Mettre à jour localStorage
      const updatedDevices = devices.map(d => 
        (d.id === device.id || d._id === device._id) ? updatedDevice : d
      );
      appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      
      alert(`Facture ${factureId} générée localement. Montant: ${total.toFixed(2)}€`);
    }
  };

  const validerPaiement = async (factureId) => {
    try {
      // Mettre à jour via API
      await axios.put(`${API_URL}/invoices/${factureId}/pay`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour localement
      const updatedFactures = factures.map(f => 
        f.id === factureId 
          ? { ...f, statutPaiement: 'paye', datePaiement: new Date().toISOString().split('T')[0] }
          : f
      );
      setFactures(updatedFactures);
      
      // Mettre à jour l'appareil associé
      const facture = factures.find(f => f.id === factureId);
      if (facture && facture.deviceId) {
        const updatedDevices = devices.map(d => {
          if ((d.id === facture.deviceId || d._id === facture.deviceId) && d.facture) {
            return {
              ...d,
              facture: { ...d.facture, payee: true }
            };
          }
          return d;
        });
        
        setDevices(updatedDevices);
        
        // Mettre à jour localStorage
        if (user?.demo) appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      }
      
      alert(`Paiement de la facture ${factureId} validé !`);
      
    } catch (err) {
      console.error('Erreur validation paiement:', err);
      if (!user?.demo) {
        setError(err.response?.data?.message || 'Le règlement n’a pas pu être confirmé par le serveur.');
        return;
      }
      
      // Fallback local
      const facture = factures.find(f => f.id === factureId);
      if (facture) {
        const updatedFactures = factures.map(f => 
          f.id === factureId 
            ? { ...f, statutPaiement: 'paye', datePaiement: new Date().toISOString().split('T')[0] }
            : f
        );
        setFactures(updatedFactures);
        
        // Mettre à jour l'appareil
        if (facture.deviceId) {
          const updatedDevices = devices.map(d => {
            if ((d.id === facture.deviceId || d._id === facture.deviceId) && d.facture) {
              return {
                ...d,
                facture: { ...d.facture, payee: true }
              };
            }
            return d;
          });
          
          setDevices(updatedDevices);
          appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
        }
        
        alert(`Paiement validé localement pour ${factureId}`);
      }
    }
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

  const calculerRetards = () => {
    const maintenant = new Date();
    return factures.filter(f => {
      if (f.statutPaiement === 'en_attente' && f.dateEcheance) {
        const echeance = new Date(f.dateEcheance);
        return echeance < maintenant;
      }
      return false;
    }).length;
  };

  const envoyerRappel = (facture) => {
    const client = clients.find(c => 
      c.prenom && c.nom && 
      facture.client.includes(c.prenom) && facture.client.includes(c.nom)
    );
    
    if (client) {
      const message = `Bonjour ${client.prenom},\n\nVotre facture ${facture.id} d'un montant de ${facture.montant.toFixed(2)}€ est en attente de paiement.\nÉchéance: ${facture.dateEcheance}\n\nCordialement,\nRepAppBuro`;
      
      if (client.email) {
        const subject = encodeURIComponent(`Rappel facture ${facture.id}`);
        const body = encodeURIComponent(message);
        window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank');
        alert(`Email de rappel envoyé à ${client.email}`);
      } else if (client.telephone) {
        alert(`Client: ${client.prenom} ${client.nom}\nTéléphone: ${client.telephone}\nMessage: ${message.substring(0, 100)}...`);
      } else {
        alert('Aucun moyen de contact disponible pour ce client.');
      }
    } else {
      alert('Client non trouvé pour cette facture.');
    }
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
    <div className="dashboard-responsable">
      {/* Header */}
      <DashboardHeader role="RESPONSABLE" roleLabel="Pilotage atelier" title="Tableau de bord responsable" subtitle={'Supervision et gestion financi\u00e8re'} user={user} onLogout={handleLogout} onRefresh={fetchData} />

      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* Statistiques */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🔧</div>
          <div className="stat-info">
            <h3>{devices.length}</h3>
            <p>Appareils</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <h3>{calculerChiffreAffaires().toFixed(2)}€</h3>
            <p>Chiffre d'affaires</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <h3>{calculerTauxReussite()}%</h3>
            <p>Taux de réussite</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-info">
            <h3>{calculerRetards()}</h3>
            <p>Retards paiement</p>
          </div>
        </div>
      </div>

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
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Rechercher appareil, facture ou client..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

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
                          {facture.statutPaiement === 'paye' ? 'Payé' : 
                           new Date(facture.dateEcheance) < new Date() ? 'En retard' : 'En attente'}
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
                      <p><strong>Échéance:</strong> {facture.dateEcheance}</p>
                      {facture.pieces && facture.pieces.length > 0 && (
                        <p><strong>Pièces:</strong> {facture.pieces.length} type(s)</p>
                      )}
                    </div>
                    
                    <div className="facture-actions">
                      <button className="action-btn">
                        📄 PDF
                      </button>
                      {facture.statutPaiement !== 'paye' && (
                        <>
                          <button 
                            onClick={() => validerPaiement(facture.id)}
                            className="action-btn validate-btn"
                          >
                            ✅ Payer
                          </button>
                          <button 
                            onClick={() => envoyerRappel(facture)}
                            className="action-btn reminder-btn"
                          >
                            🔔 Rappeler
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
      <DashboardFooter />
    </div>
  );
};

export default DashboardResponsable;
