// UserDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appStorage } from '../utils/appStorage';
import './UserDashboard.css';

// URL de l'API - à adapter selon votre configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DeviceTypeSelect = ({ value, options, onChange, disabled }) => {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(Math.max(0, options.indexOf(value)));
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const listId = 'device-type-options';
  const selectedIndex = Math.max(0, options.indexOf(value));

  useEffect(() => {
    if (open) {
      document.getElementById(`device-type-option-${activeIndex}`)?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeIndex, open]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('touchstart', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('touchstart', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const choose = (option) => {
    onChange(option);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else {
        setActiveIndex((index) => (index + 1) % options.length);
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setActiveIndex(selectedIndex);
        setOpen(true);
      } else {
        setActiveIndex((index) => (index - 1 + options.length) % options.length);
      }
    } else if (event.key === 'Home' && open) {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End' && open) {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if ((event.key === 'Enter' || event.key === ' ') && open) {
      event.preventDefault();
      choose(options[activeIndex]);
    } else if ((event.key === 'Enter' || event.key === ' ') && !open) {
      event.preventDefault();
      setActiveIndex(selectedIndex);
      setOpen(true);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div className={`device-type-select${open ? ' is-open' : ''}`} ref={rootRef}>
      <button
        ref={triggerRef}
        id="device-type-select"
        className="device-type-select-trigger"
        type="button"
        role="combobox"
        aria-label="Type d'appareil"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open ? `device-type-option-${activeIndex}` : undefined}
        disabled={disabled}
        onClick={() => {
          setActiveIndex(selectedIndex);
          setOpen((isOpen) => !isOpen);
        }}
        onKeyDown={handleKeyDown}
      >
        <span>{value}</span>
        <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5 7.5 5 5 5-5" /></svg>
      </button>
      {open && (
        <ul className="device-type-select-list" id={listId} role="listbox" aria-label="Choisir un type d'appareil">
          {options.map((option, index) => (
            <li
              className={`device-type-select-option${value === option ? ' is-selected' : ''}${activeIndex === index ? ' is-active' : ''}`}
              id={`device-type-option-${index}`}
              key={option}
              role="option"
              aria-selected={value === option}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
            >
              <span>{option}</span>
              {value === option && <span className="device-type-select-check" aria-hidden="true">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const UserDashboard = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'Imprimante',
    problem: '',
    serialNumber: '',
    marque: '',
    modele: ''
  });

  const deviceTypes = [
    'Imprimante',
    'Photocopieur',
    'Scanner',
    'Destructeur de documents',
    'Télécopieur (Fax)',
    'Machine à affranchir',
    'Plieuse-inséreuse',
    'Relieuse',
    'Massicot',
    'Perforatrice',
    'Plastifieuse',
    'Autre'
  ];

  // Charger les appareils depuis l'API
  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    if (user?.demo) {
      const savedDevices = appStorage.getItem('bureau_devices');
      const localDevices = savedDevices ? JSON.parse(savedDevices) : [];
      setDevices(localDevices.filter(
        (device) => device.userId === user?.id || device.clientId === user?.id
      ));
      setError('');
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
      setError('');
    } catch (err) {
      console.error('Erreur lors du chargement des appareils:', err);
      setError('Impossible de charger vos appareils. Veuillez réessayer.');
      setDevices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusText = (status) => {
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

  const getStatusColor = (status) => {
    const colorMap = {
      'nouveau': 'status-blue',
      'en_diagnostic': 'status-orange',
      'en_reparation': 'status-red',
      'en_attente_piece': 'status-yellow',
      'pret_a_recuperer': 'status-green',
      'termine': 'status-purple',
      'recupere': 'status-gray'
    };
    return colorMap[status] || 'status-gray';
  };

  const handleSubmitDevice = async (e) => {
    e.preventDefault();
    
    if (!newDevice.name || !newDevice.problem || !newDevice.marque || !newDevice.modele) {
      alert('Veuillez remplir tous les champs obligatoires (*)');
      return;
    }

    try {
      // Envoyer l'appareil au backend
      const response = await axios.post(`${API_URL}/devices`, newDevice, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Ajouter le nouvel appareil à la liste
      setDevices([response.data, ...devices]);
      
      // Réinitialiser le formulaire
      setNewDevice({ 
        name: '', 
        type: 'Imprimante', 
        problem: '', 
        serialNumber: '',
        marque: '',
        modele: ''
      });
      
      if (user?.demo) {
        const updatedDevices = [response.data, ...devices];
        appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      }
      
      alert('Votre appareil bureautique a été déposé avec succès ! Un technicien vous contactera pour le diagnostic.');
    } catch (err) {
      console.error('Erreur lors du dépôt:', err);
      if (!user?.demo) {
        setError(err.response?.data?.message || 'Le serveur ne peut pas enregistrer votre dépôt. Aucune donnée n’a été sauvegardée.');
        return;
      }

      // Fallback: sauvegarder localement si l'API échoue
      const estimatedCost = {
        'Imprimante': 149.99,
        'Photocopieur': 289.99,
        'Scanner': 89.99,
        'Destructeur de documents': 129.99,
        'Télécopieur (Fax)': 119.99,
        'Machine à affranchir': 199.99,
        'Plieuse-inséreuse': 259.99,
        'Relieuse': 179.99,
        'Massicot': 139.99,
        'Perforatrice': 79.99,
        'Plastifieuse': 99.99,
        'Autre': 149.99
      };

      const newDeviceObj = {
        id: Date.now(), // ID unique basé sur timestamp
        ...newDevice,
        userId: user?.id || 'client_' + Date.now(),
        clientName: user?.prenom || user?.username || 'Client',
        status: 'nouveau',
        dateDepot: new Date().toISOString(),
        dateRecupEstimee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        facture: { 
          montant: estimatedCost[newDevice.type] || 149.99, 
          payee: false, 
          url: null 
        }
      };

      // Mettre à jour l'état local
      setDevices([newDeviceObj, ...devices]);
      
      // Sauvegarder dans localStorage pour partage avec autres rôles
      const currentDevices = JSON.parse(appStorage.getItem('bureau_devices') || '[]');
      const updatedDevices = [newDeviceObj, ...currentDevices];
      appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      
      setNewDevice({ 
        name: '', 
        type: 'Imprimante', 
        problem: '', 
        serialNumber: '',
        marque: '',
        modele: ''
      });
      
      alert('Appareil déposé localement. Les techniciens verront cet appareil lors de leur prochaine connexion.');
    }
  };

  const markAsRecovered = async (deviceId) => {
    try {
      // Mettre à jour via API
      await axios.put(`${API_URL}/devices/${deviceId}`, {
        status: 'recupere'
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour l'état local
      setDevices(devices.map(device => 
        device.id === deviceId 
          ? { ...device, status: 'recupere' }
          : device
      ));
      
      if (user?.demo) {
        const updatedDevices = devices.map(device =>
          device.id === deviceId
            ? { ...device, status: 'recupere' }
            : device
        );
        appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      }
      
      alert('Appareil marqué comme récupéré !');
    } catch (err) {
      console.error('Erreur lors de la mise à jour:', err);
      alert('Erreur lors de la mise à jour. Veuillez réessayer.');
    }
  };

  const downloadInvoice = async (device) => {
    if (device.facture?.url) {
      try {
        // Télécharger depuis l'API
        const response = await axios.get(`${API_URL}/invoices/${device.id}/download`, {
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        });
        
        // Créer un lien pour télécharger le fichier
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `facture-${device.id}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } catch (err) {
        console.error('Erreur de téléchargement:', err);
        alert('Impossible de télécharger la facture.');
      }
    } else {
      alert('Facture non disponible pour le moment');
    }
  };

  const payInvoice = async (deviceId) => {
    try {
      // Mettre à jour le paiement via API
      await axios.put(`${API_URL}/devices/${deviceId}/pay`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Mettre à jour l'état local
      setDevices(devices.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              facture: { ...device.facture, payee: true } 
            }
          : device
      ));
      
      // Mettre à jour localStorage
      const updatedDevices = devices.map(device => 
        device.id === deviceId 
          ? { 
              ...device, 
              facture: { ...device.facture, payee: true } 
            }
          : device
      );
      appStorage.setItem('bureau_devices', JSON.stringify(updatedDevices));
      
      alert('Paiement effectué avec succès !');
    } catch (err) {
      console.error('Erreur de paiement:', err);
      alert('Erreur lors du paiement. Veuillez réessayer.');
    }
  };

  // Fonction pour rafraîchir périodiquement les données
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDevices();
    }, 30000); // Rafraîchir toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  if (loading && devices.length === 0) {
    return (
      <div className="user-dashboard loading">
        <div className="spinner"></div>
        <p>Chargement de vos appareils...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard">
      {/* Header */}
      <DashboardHeader role="USER" roleLabel="Espace client" title="Votre espace client" subtitle={`Bonjour, ${user?.prenom || user?.username} ! Suivez vos r\u00e9parations et vos appareils.`} user={user} onLogout={handleLogout} onRefresh={fetchDevices} />

      <div className="dashboard-content">
        {/* Section de dépôt d'appareil */}
        <div className="depot-section">
          <h2 className="section-title">
            <span className="icon">🖨️</span>
            Déposer un appareil bureautique
          </h2>
          
          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}
          
          <form className="depot-form" onSubmit={handleSubmitDevice}>
            <div className="form-grid">
              <div className="form-group">
                <label>Nom de l'appareil *</label>
                <input
                  type="text"
                  value={newDevice.name}
                  onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                  placeholder="Ex: Imprimante Laser, Photocopieur..."
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Marque *</label>
                <input
                  type="text"
                  value={newDevice.marque}
                  onChange={(e) => setNewDevice({...newDevice, marque: e.target.value})}
                  placeholder="Ex: HP, Canon, Brother..."
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Modèle *</label>
                <input
                  type="text"
                  value={newDevice.modele}
                  onChange={(e) => setNewDevice({...newDevice, modele: e.target.value})}
                  placeholder="Ex: LaserJet Pro, imageRUNNER..."
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="device-type-select">Type d'appareil *</label>
                <DeviceTypeSelect
                  value={newDevice.type}
                  options={deviceTypes}
                  onChange={(type) => setNewDevice((current) => ({ ...current, type }))}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group full-width">
                <label>Problème rencontré *</label>
                <textarea
                  value={newDevice.problem}
                  onChange={(e) => setNewDevice({...newDevice, problem: e.target.value})}
                  placeholder="Décrivez le problème en détail... (bourrage papier, erreur d'impression, problème de numérisation, etc.)"
                  rows="3"
                  required
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label>Numéro de série (optionnel)</label>
                <input
                  type="text"
                  value={newDevice.serialNumber}
                  onChange={(e) => setNewDevice({...newDevice, serialNumber: e.target.value})}
                  placeholder="SN123456789"
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              <span className="btn-icon">🛠️</span>
              {loading ? 'Envoi en cours...' : 'Demander une réparation'}
            </button>
            
            <div className="info-note">
              <p>💡 <strong>Information :</strong> Nos techniciens spécialisés en matériel bureautique analyseront votre appareil sous 48h. Vous recevrez un devis détaillé par email.</p>
            </div>
          </form>
        </div>

        {/* Section des appareils en cours */}
        <div className="devices-section">
          <h2 className="section-title">
            <span className="icon">📊</span>
            Suivi de vos équipements bureautiques ({devices.length})
          </h2>
          
          {devices.length === 0 ? (
            <div className="no-devices">
              <p>Vous n'avez pas encore déposé d'appareil.</p>
              <p>Utilisez le formulaire ci-dessus pour faire votre première demande.</p>
            </div>
          ) : (
            <div className="devices-grid">
              {devices.map(device => (
                <div key={device.id || device._id} className="device-card">
                  <div className="device-header">
                    <div className="device-name">
                      <h3>{device.name}</h3>
                      <span className="device-type">{device.type}</span>
                      {device.technicianId && (
                        <span className="assigned-badge">
                          👨‍🔧 Technicien assigné
                        </span>
                      )}
                    </div>
                    <div className={`device-status ${getStatusColor(device.status)}`}>
                      {getStatusText(device.status)}
                    </div>
                  </div>
                  
                  <div className="device-details">
                    <div className="detail-item">
                      <span className="detail-label">Problème :</span>
                      <span className="detail-value">{device.problem}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Marque/Modèle :</span>
                      <span className="detail-value">{device.marque} {device.modele}</span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Date de dépôt :</span>
                      <span className="detail-value">
                        {new Date(device.dateDepot).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    <div className="detail-item">
                      <span className="detail-label">Récupération estimée :</span>
                      <span className="detail-value">
                        {new Date(device.dateRecupEstimee).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    
                    {device.technicianNotes && device.technicianNotes.length > 0 && (
                      <div className="detail-item full-width">
                        <span className="detail-label">Notes du technicien :</span>
                        <div className="technician-notes">
                          {device.technicianNotes.map((note, idx) => (
                            <div key={idx} className="note">
                              <strong>{note.user}:</strong> {note.message}
                              <small>{new Date(note.date).toLocaleDateString('fr-FR')}</small>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Section Facture */}
                  <div className="invoice-section">
                    <div className="invoice-header">
                      <span className="invoice-title">Devis & Facture</span>
                      <span className="invoice-amount">{device.facture?.montant || 0}€</span>
                    </div>
                    
                    <div className="invoice-actions">
                      {device.facture?.url && (
                        <button 
                          onClick={() => downloadInvoice(device)}
                          className="invoice-btn download-btn"
                          disabled={loading}
                        >
                          📄 Télécharger
                        </button>
                      )}
                      
                      {device.facture?.montant > 0 && !device.facture?.payee && (
                        <button 
                          onClick={() => payInvoice(device.id || device._id)}
                          className="invoice-btn pay-btn"
                          disabled={loading}
                        >
                          💳 Payer le devis
                        </button>
                      )}
                      
                      {device.facture?.payee && (
                        <span className="paid-badge">✅ Facture réglée</span>
                      )}
                      
                      {device.status === 'pret_a_recuperer' && (
                        <button 
                          onClick={() => markAsRecovered(device.id || device._id)}
                          className="recover-btn"
                          disabled={loading}
                        >
                          📦 Récupérer l'appareil
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section informations */}
        <div className="info-section">
          <div className="info-card">
            <div className="info-icon">🏢</div>
            <div className="info-content">
              <h3>Notre atelier spécialisé</h3>
              <p className="info-card-intro">Un atelier dédié à l’entretien et à la réparation de vos équipements professionnels.</p>
              <p>📌 456 Avenue du Parc Industriel<br />69000 Lyon</p>
              <p>📞 04 78 12 34 56</p>
              <p>🕒 Lun-Ven: 8h-19h, Sam: 9h-15h</p>
              <p>🚚 Service de collecte disponible</p>
              <button className="contact-btn">Demander une collecte</button>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">⚙️</div>
            <div className="info-content">
              <h3>Nos spécialités</h3>
              <p className="info-card-intro">Des solutions expertes pour prolonger la durée de vie de votre matériel.</p>
              <ul>
                <li>🖨️ Réparation d'imprimantes laser & jet d'encre</li>
                <li>📠 Maintenance de photocopieurs</li>
                <li>📄 Réparation de destructeurs de documents</li>
                <li>📧 Réparation de fax & scanners</li>
                <li>🔧 Maintenance préventive</li>
                <li>♻️ Recyclage de matériel bureautique</li>
              </ul>
              <button className="contact-btn">Voir nos services</button>
            </div>
          </div>
          
          <div className="info-card">
            <div className="info-icon">📞</div>
            <div className="info-content">
              <h3>Support & Maintenance</h3>
              <p className="info-card-intro">Notre équipe vous accompagne pour garder votre activité sans interruption.</p>
              <p>📧 support@repappburo.fr</p>
              <p>💬 Assistance technique en ligne</p>
              <p>📱 Hotline urgente: 04 78 12 34 57</p>
              <p>🛠️ Contrats de maintenance disponibles</p>
              <button className="contact-btn">Contacter un technicien</button>
            </div>
          </div>
        </div>
      </div>

      <DashboardFooter />
    </div>
  );
};

export default UserDashboard;
