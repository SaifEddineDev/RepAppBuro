// TechnicienDashboard.jsx
import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appStorage } from '../utils/appStorage';
import './DashboardTechnicien.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const TechnicienDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [devices, setDevices] = useState([]); // Renommé de "reparations" à "devices"
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [diagnostic, setDiagnostic] = useState('');
  const [piecesUtilisees, setPiecesUtilisees] = useState([]);
  const [nouvellePiece, setNouvellePiece] = useState({ nom: '', quantite: 1, prix: 0 });
  const [tempsTravail, setTempsTravail] = useState({ heures: 0, minutes: 0 });
  const [statut, setStatut] = useState('en_diagnostic');
  const [activeTab, setActiveTab] = useState('mes-taches');
  const [searchTerm, setSearchTerm] = useState('');
  const [noteTechnicien, setNoteTechnicien] = useState('');

  // Statuts compatibles avec UserDashboard
  const statuts = [
    { id: 'nouveau', label: 'Nouvelle demande', color: 'blue' },
    { id: 'en_diagnostic', label: 'En diagnostic', color: 'orange' },
    { id: 'en_reparation', label: 'En réparation', color: 'red' },
    { id: 'en_attente_piece', label: 'En attente de pièce', color: 'yellow' },
    { id: 'pret_a_recuperer', label: 'Prêt à récupérer', color: 'green' },
    { id: 'termine', label: 'Terminé', color: 'purple' },
    { id: 'recupere', label: 'Récupéré', color: 'gray' }
  ];

  // Charger les appareils depuis l'API
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    if (user?.demo) {
      const savedDevices = appStorage.getItem('bureau_devices');
      setDevices(savedDevices ? JSON.parse(savedDevices) : []);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/devices`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setDevices(response.data);
      
      setDevices(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error('Erreur lors du chargement des appareils:', err);
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const selectDevice = (device) => {
    setSelectedDevice(device);
    setDiagnostic(device.notes?.find(n => n.type === 'diagnostic')?.message || '');
    setPiecesUtilisees(device.piecesUtilisees || []);
    setStatut(device.status || 'nouveau');
    setTempsTravail({
      heures: Math.floor((device.tempsTravail || 0) / 60),
      minutes: (device.tempsTravail || 0) % 60
    });
    setNoteTechnicien('');
    setActiveTab('fiche-reparation');
  };

  const assignToMe = async (deviceId) => {
    try {
      await axios.put(`${API_URL}/devices/${deviceId}`, {
        technicianId: user.id,
        assignedTo: `${user.prenom} ${user.nom}`
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour localement
      setDevices(devices.map(d =>
        String(d.id || d._id) === String(deviceId)
          ? { ...d, technicianId: user.id, assignedTo: `${user.prenom} ${user.nom}` }
          : d
      ));
      
      // Mettre à jour localStorage
      const updatedDevices = devices.map(d =>
        String(d.id || d._id) === String(deviceId)
          ? { ...d, technicianId: user.id, assignedTo: `${user.prenom} ${user.nom}` }
          : d
      );
      if (user?.demo) appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      
      alert('Appareil assigné avec succès !');
    } catch (err) {
      console.error('Erreur d\'assignation:', err);
      alert('Erreur lors de l\'assignation.');
    }
  };

  const ajouterPiece = () => {
    if (nouvellePiece.nom) {
      setPiecesUtilisees([...piecesUtilisees, { ...nouvellePiece }]);
      setNouvellePiece({ nom: '', quantite: 1, prix: 0 });
    }
  };

  const supprimerPiece = (index) => {
    setPiecesUtilisees(piecesUtilisees.filter((_, i) => i !== index));
  };

  const calculerTotalPieces = () => {
    return piecesUtilisees.reduce((total, piece) => total + (piece.prix * piece.quantite), 0);
  };

  const calculerTempsTotal = () => {
    return (tempsTravail.heures * 60) + tempsTravail.minutes;
  };

  const sauvegarderFiche = async () => {
    if (!selectedDevice) return;

    const totalTemps = calculerTempsTotal();
    
    const updatedDevice = {
      ...selectedDevice,
      diagnostic: diagnostic,
      piecesUtilisees: piecesUtilisees,
      tempsTravail: totalTemps,
      status: statut,
      notes: [
        ...(selectedDevice.notes || []),
        {
          type: 'technicien',
          user: `${user.prenom} ${user.nom}`,
          message: noteTechnicien || 'Fiche mise à jour',
          date: new Date().toISOString()
        }
      ],
      updatedAt: new Date().toISOString()
    };

    try {
      // Sauvegarder via API
      await axios.put(`${API_URL}/devices/${selectedDevice.id || selectedDevice._id}`, {
        technicianId: user.id,
        diagnostic,
        piecesUtilisees,
        tempsTravail: totalTemps,
        status: statut,
        note: noteTechnicien || 'Fiche mise à jour'
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Mettre à jour l'état local
      setDevices(devices.map(d => 
        (d.id === selectedDevice.id || d._id === selectedDevice._id) ? updatedDevice : d
      ));
      
      // Mettre à jour localStorage
      const updatedDevices = devices.map(d => 
        (d.id === selectedDevice.id || d._id === selectedDevice._id) ? updatedDevice : d
      );
      if (user?.demo) appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      
      setSelectedDevice(updatedDevice);
      
      alert('Fiche mise à jour avec succès ! Le client peut maintenant voir les modifications.');
    } catch (err) {
      console.error('Erreur de sauvegarde:', err);
      alert('Erreur lors de la sauvegarde.');
    }
  };

  const getDevicesFiltres = () => {
    return devices.filter(device =>
      device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.marque?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.problem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      device.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getStatutColor = (statutId) => {
    const statutObj = statuts.find(s => s.id === statutId);
    return statutObj?.color || 'gray';
  };

  const getStatutLabel = (statutId) => {
    const statutObj = statuts.find(s => s.id === statutId);
    return statutObj?.label || statutId;
  };

  // Filtrer les appareils selon le statut et l'assignation
  const devicesFiltres = getDevicesFiltres();
  const mesAppareils = devicesFiltres.filter(d => d.technicianId === user?.id || d.assignedTo?.includes(user?.prenom));
  const appareilsNonAssignes = devicesFiltres.filter(d => !d.technicianId && d.status === 'nouveau');
  const tousLesAppareils = devicesFiltres;

  const getDeviceCounts = () => {
    return {
      total: devices.length,
      assignes: mesAppareils.length,
      nonAssignes: appareilsNonAssignes.length,
      termines: devices.filter(d => d.status === 'termine' || d.status === 'recupere').length
    };
  };

  const counts = getDeviceCounts();

  if (loading && devices.length === 0) {
    return (
      <div className="dashboard-technicien loading">
        <div className="spinner"></div>
        <p>Chargement des appareils...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-technicien">
      {/* Header */}
      <DashboardHeader role="TECHNICIEN" roleLabel={'\u00c9quipe technique'} title="Tableau de bord technicien" subtitle={`Suivi des r\u00e9parations \u00b7 ${counts.total} appareils`} user={user} onLogout={handleLogout} onRefresh={fetchDevices} />

      {/* Navigation */}
      <div className="technicien-tabs">
        <button 
          className={`tab-btn ${activeTab === 'mes-taches' ? 'active' : ''}`}
          onClick={() => setActiveTab('mes-taches')}
        >
          📋 Mes appareils ({counts.assignes})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'non-assignes' ? 'active' : ''}`}
          onClick={() => setActiveTab('non-assignes')}
        >
          🆕 Non assignés ({counts.nonAssignes})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'fiche-reparation' ? 'active' : ''}`}
          onClick={() => setActiveTab('fiche-reparation')}
          disabled={!selectedDevice}
        >
          📝 Fiche réparation
        </button>
        <button 
          className={`tab-btn ${activeTab === 'tous' ? 'active' : ''}`}
          onClick={() => setActiveTab('tous')}
        >
          👁️ Tous les appareils
        </button>
        <button 
          className={`tab-btn ${activeTab === 'statistiques' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistiques')}
        >
          📊 Statistiques
        </button>
      </div>

      {/* Recherche */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Rechercher un appareil..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Contenu */}
      <div className="technicien-content">
        {/* Onglet: Mes appareils assignés */}
        {activeTab === 'mes-taches' && (
          <div className="tab-content">
            <h2 className="tab-title">📋 Mes appareils assignés ({mesAppareils.length})</h2>
            
            <div className="reparations-grid">
              {mesAppareils.length === 0 ? (
                <div className="no-devices">
                  <p>Vous n'avez aucun appareil assigné.</p>
                  <p>Consultez l'onglet "Non assignés" pour prendre en charge des appareils.</p>
                </div>
              ) : (
                mesAppareils.map(device => (
                  <div 
                    key={device.id || device._id} 
                    className={`reparation-card statut-${getStatutColor(device.status)}`}
                    onClick={() => selectDevice(device)}
                  >
                    <div className="reparation-header">
                      <div className="reparation-id">
                        <h3>{device.name || 'Appareil sans nom'}</h3>
                        <span className={`statut-badge badge-${getStatutColor(device.status)}`}>
                          {getStatutLabel(device.status)}
                        </span>
                      </div>
                      <div className="reparation-date">
                        <p>Déposé: {new Date(device.dateDepot).toLocaleDateString('fr-FR')}</p>
                        <p>Échéance: {new Date(device.dateRecupEstimee).toLocaleDateString('fr-FR')}</p>
                      </div>
                    </div>
                    
                    <div className="reparation-info">
                      <p><strong>Client:</strong> {device.clientName || 'Non spécifié'}</p>
                      <p><strong>Marque/Modèle:</strong> {device.marque} {device.modele}</p>
                      <p><strong>Problème:</strong> {device.problem}</p>
                      {device.diagnostic && <p><strong>Diagnostic:</strong> {device.diagnostic}</p>}
                    </div>
                    
                    <div className="reparation-details">
                      <p><strong>Type:</strong> {device.type}</p>
                      {device.facture?.montant > 0 && (
                        <p><strong>Devis:</strong> {device.facture.montant}€</p>
                      )}
                    </div>
                    
                    <button 
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        selectDevice(device);
                      }}
                    >
                      📝 Traiter
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Onglet: Appareils non assignés */}
        {activeTab === 'non-assignes' && (
          <div className="tab-content">
            <h2 className="tab-title">🆕 Appareils non assignés ({appareilsNonAssignes.length})</h2>
            
            <div className="reparations-grid">
              {appareilsNonAssignes.length === 0 ? (
                <div className="no-devices">
                  <p>Tous les appareils sont assignés.</p>
                  <p>Les nouveaux appareils déposés par les clients apparaîtront ici.</p>
                </div>
              ) : (
                appareilsNonAssignes.map(device => (
                  <div 
                    key={device.id || device._id} 
                    className={`reparation-card statut-${getStatutColor(device.status)}`}
                  >
                    <div className="reparation-header">
                      <div className="reparation-id">
                        <h3>{device.name || 'Appareil sans nom'}</h3>
                        <span className={`statut-badge badge-${getStatutColor(device.status)}`}>
                          {getStatutLabel(device.status)}
                        </span>
                      </div>
                      <div className="reparation-date">
                        <p>Déposé: {new Date(device.dateDepot).toLocaleDateString('fr-FR')}</p>
                        <p>Attente depuis: {
                          Math.floor((new Date() - new Date(device.dateDepot)) / (1000 * 60 * 60 * 24))
                        } jours</p>
                      </div>
                    </div>
                    
                    <div className="reparation-info">
                      <p><strong>Client:</strong> {device.clientName || 'Non spécifié'}</p>
                      <p><strong>Appareil:</strong> {device.marque} {device.modele}</p>
                      <p><strong>Type:</strong> {device.type}</p>
                      <p><strong>Problème:</strong> {device.problem}</p>
                    </div>
                    
                    <div className="reparation-actions">
                      <button 
                        className="assign-btn"
                        onClick={() => assignToMe(device.id || device._id)}
                      >
                        👨‍🔧 M'assigner cet appareil
                      </button>
                      <button 
                        className="view-btn"
                        onClick={() => selectDevice(device)}
                      >
                        👁️ Voir détails
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Onglet: Fiche réparation */}
        {activeTab === 'fiche-reparation' && selectedDevice && (
          <div className="tab-content">
            <h2 className="tab-title">📝 Fiche de réparation: {selectedDevice.name}</h2>
            <div className="device-id">ID: {selectedDevice.id || selectedDevice._id}</div>
            
            <div className="fiche-container">
              {/* Informations générales */}
              <div className="fiche-section">
                <h3>Informations générales</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Client</label>
                    <p>{selectedDevice.clientName || 'Non spécifié'}</p>
                  </div>
                  <div className="info-item">
                    <label>Appareil</label>
                    <p>{selectedDevice.marque} {selectedDevice.modele}</p>
                  </div>
                  <div className="info-item">
                    <label>Type</label>
                    <p>{selectedDevice.type}</p>
                  </div>
                  <div className="info-item">
                    <label>Numéro série</label>
                    <p>{selectedDevice.serialNumber || 'Non renseigné'}</p>
                  </div>
                  <div className="info-item">
                    <label>Problème initial</label>
                    <p>{selectedDevice.problem}</p>
                  </div>
                  <div className="info-item">
                    <label>Date dépôt</label>
                    <p>{new Date(selectedDevice.dateDepot).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="info-item">
                    <label>Échéance</label>
                    <p>{new Date(selectedDevice.dateRecupEstimee).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>

              {/* Notes du client */}
              {selectedDevice.notes?.filter(n => n.type !== 'technicien').length > 0 && (
                <div className="fiche-section">
                  <h3>Notes du client</h3>
                  <div className="client-notes">
                    {selectedDevice.notes
                      .filter(note => note.type !== 'technicien')
                      .map((note, idx) => (
                        <div key={idx} className="note">
                          <strong>{note.user}:</strong> {note.message}
                          <small>{new Date(note.date).toLocaleDateString('fr-FR')}</small>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Diagnostic */}
              <div className="fiche-section">
                <h3>Diagnostic</h3>
                <textarea
                  value={diagnostic}
                  onChange={(e) => setDiagnostic(e.target.value)}
                  placeholder="Rédigez votre diagnostic ici..."
                  rows="4"
                  className="diagnostic-textarea"
                />
              </div>

              {/* Pièces utilisées */}
              <div className="fiche-section">
                <h3>Pièces utilisées</h3>
                
                <div className="add-piece-form">
                  <input
                    type="text"
                    value={nouvellePiece.nom}
                    onChange={(e) => setNouvellePiece({...nouvellePiece, nom: e.target.value})}
                    placeholder="Nom de la pièce"
                    className="piece-input"
                  />
                  <input
                    type="number"
                    value={nouvellePiece.quantite}
                    onChange={(e) => setNouvellePiece({...nouvellePiece, quantite: parseInt(e.target.value) || 1})}
                    placeholder="Qty"
                    className="piece-qty"
                    min="1"
                  />
                  <input
                    type="number"
                    value={nouvellePiece.prix}
                    onChange={(e) => setNouvellePiece({...nouvellePiece, prix: parseFloat(e.target.value) || 0})}
                    placeholder="Prix (€)"
                    className="piece-price"
                    step="0.01"
                    min="0"
                  />
                  <button onClick={ajouterPiece} className="add-btn">
                    ➕ Ajouter
                  </button>
                </div>

                <div className="pieces-list">
                  {piecesUtilisees.length > 0 ? (
                    <table className="pieces-table">
                      <thead>
                        <tr>
                          <th>Pièce</th>
                          <th>Quantité</th>
                          <th>Prix unitaire</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {piecesUtilisees.map((piece, index) => (
                          <tr key={index}>
                            <td>{piece.nom}</td>
                            <td>{piece.quantite}</td>
                            <td>{piece.prix.toFixed(2)}€</td>
                            <td>{(piece.prix * piece.quantite).toFixed(2)}€</td>
                            <td>
                              <button 
                                onClick={() => supprimerPiece(index)}
                                className="delete-btn"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="3"><strong>Total pièces:</strong></td>
                          <td colSpan="2"><strong>{calculerTotalPieces().toFixed(2)}€</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  ) : (
                    <p className="no-pieces">Aucune pièce utilisée</p>
                  )}
                </div>
              </div>

              {/* Temps de travail */}
              <div className="fiche-section">
                <h3>Temps de travail</h3>
                <div className="temps-inputs">
                  <div className="temps-input">
                    <label>Heures</label>
                    <input
                      type="number"
                      value={tempsTravail.heures}
                      onChange={(e) => setTempsTravail({...tempsTravail, heures: parseInt(e.target.value) || 0})}
                      min="0"
                    />
                  </div>
                  <div className="temps-input">
                    <label>Minutes</label>
                    <input
                      type="number"
                      value={tempsTravail.minutes}
                      onChange={(e) => setTempsTravail({...tempsTravail, minutes: parseInt(e.target.value) || 0})}
                      min="0"
                      max="59"
                    />
                  </div>
                  <div className="temps-total">
                    <label>Total (minutes)</label>
                    <p>{calculerTempsTotal()}</p>
                  </div>
                </div>
              </div>

              {/* Note du technicien */}
              <div className="fiche-section">
                <h3>Note interne</h3>
                <textarea
                  value={noteTechnicien}
                  onChange={(e) => setNoteTechnicien(e.target.value)}
                  placeholder="Note interne pour les autres techniciens..."
                  rows="3"
                  className="note-textarea"
                />
              </div>

              {/* Statut */}
              <div className="fiche-section">
                <h3>Statut de la réparation</h3>
                <div className="statut-options">
                  {statuts.map(s => (
                    <button
                      key={s.id}
                      className={`statut-option ${statut === s.id ? 'active' : ''} ${s.id}`}
                      onClick={() => setStatut(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="fiche-actions">
                <button onClick={sauvegarderFiche} className="save-btn">
                  💾 Sauvegarder la fiche
                </button>
                <button onClick={() => setActiveTab('mes-taches')} className="back-btn">
                  ↩️ Retour aux tâches
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Onglet: Tous les appareils */}
        {activeTab === 'tous' && (
          <div className="tab-content">
            <h2 className="tab-title">👁️ Tous les appareils ({tousLesAppareils.length})</h2>
            
            <div className="devices-table-container">
              <table className="devices-table">
                <thead>
                  <tr>
                    <th>Appareil</th>
                    <th>Client</th>
                    <th>Problème</th>
                    <th>Statut</th>
                    <th>Technicien</th>
                    <th>Date dépôt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tousLesAppareils.map(device => (
                    <tr key={device.id || device._id}>
                      <td>
                        <strong>{device.name}</strong><br/>
                        <small>{device.type}</small>
                      </td>
                      <td>{device.clientName}</td>
                      <td>{device.problem.substring(0, 50)}...</td>
                      <td>
                        <span className={`table-status status-${getStatutColor(device.status)}`}>
                          {getStatutLabel(device.status)}
                        </span>
                      </td>
                      <td>
                        {device.assignedTo || device.technicianId ? 
                          (device.assignedTo || 'Assigné') : 
                          <span className="not-assigned">Non assigné</span>
                        }
                      </td>
                      <td>{new Date(device.dateDepot).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <button 
                          onClick={() => selectDevice(device)}
                          className="table-action-btn"
                        >
                          👁️
                        </button>
                        {!device.technicianId && (
                          <button 
                            onClick={() => assignToMe(device.id || device._id)}
                            className="table-action-btn assign"
                          >
                            👨‍🔧
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Onglet: Statistiques */}
        {activeTab === 'statistiques' && (
          <div className="tab-content">
            <h2 className="tab-title">📊 Mes statistiques</h2>
            
            <div className="stats-container">
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>{counts.assignes}</h3>
                  <p>Appareils assignés</p>
                </div>
                <div className="stat-card">
                  <h3>{counts.termines}</h3>
                  <p>Réparations terminées</p>
                </div>
                <div className="stat-card">
                  <h3>
                    {devices
                      .filter(d => d.technicianId === user?.id)
                      .reduce((total, d) => total + (d.tempsTravail || 0), 0)} min
                  </h3>
                  <p>Temps total travaillé</p>
                </div>
                <div className="stat-card">
                  <h3>
                    {devices
                      .filter(d => d.technicianId === user?.id)
                      .reduce((total, d) => total + (d.facture?.montant || 0), 0)
                      .toFixed(2)}€
                  </h3>
                  <p>Chiffre d'affaires généré</p>
                </div>
              </div>
              
              <div className="activity-chart">
                <h3>Appareils par statut</h3>
                <div className="status-distribution">
                  {statuts.map(statut => {
                    const count = devices.filter(d => d.status === statut.id).length;
                    if (count === 0) return null;
                    return (
                      <div key={statut.id} className="status-bar">
                        <span className="status-label">{statut.label}</span>
                        <div className="status-bar-bg">
                          <div 
                            className={`status-bar-fill status-${statut.color}`}
                            style={{ width: `${(count / devices.length) * 100}%` }}
                          ></div>
                        </div>
                        <span className="status-count">{count}</span>
                      </div>
                    );
                  })}
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

export default TechnicienDashboard;
