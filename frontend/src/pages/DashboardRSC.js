// DashboardRSC.jsx
import React, { useState, useEffect } from 'react';
import DashboardHeader from '../components/DashboardHeader';
import DashboardFooter from '../components/DashboardFooter';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { appStorage } from '../utils/appStorage';
import './DashboardRSC.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const DashboardRSC = () => {
  const { user, logout, token } = useAuth();
  const navigate = useNavigate();
  
  const [clients, setClients] = useState([]);
  const [devices, setDevices] = useState([]); // Renommé pour être compatible
  const [newClient, setNewClient] = useState({
    username: '',
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    societe: '',
    typeClient: 'particulier',
    role: 'USER',
    password: ''
  });
  
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'Imprimante',
    marque: '',
    modele: '',
    problem: '',
    serialNumber: '',
    clientId: '',
    accessoires: '',
    urgence: 'standard'
  });
  
  const [activeTab, setActiveTab] = useState('nouveau-client');
  const [selectedClient, setSelectedClient] = useState(null);
  const [labelsToPrint, setLabelsToPrint] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Types d'appareils compatibles avec UserDashboard
  const typesAppareils = [
    { id: 'Imprimante', nom: 'Imprimante', icon: '🖨️' },
    { id: 'Photocopieur', nom: 'Photocopieur', icon: '📋' },
    { id: 'Scanner', nom: 'Scanner', icon: '📄' },
    { id: 'Destructeur de documents', nom: 'Destructeur de documents', icon: '🗑️' },
    { id: 'Télécopieur (Fax)', nom: 'Télécopieur (Fax)', icon: '📠' },
    { id: 'Machine à affranchir', nom: 'Machine à affranchir', icon: '✉️' },
    { id: 'Plieuse-inséreuse', nom: 'Plieuse-inséreuse', icon: '📄' },
    { id: 'Relieuse', nom: 'Relieuse', icon: '📕' },
    { id: 'Autre', nom: 'Autre périphérique', icon: '🔧' }
  ];

  // Niveaux d'urgence
  const niveauxUrgence = [
    { id: 'standard', nom: 'Standard (5-7 jours)', color: 'blue' },
    { id: 'urgent', nom: 'Urgent (48-72h)', color: 'orange' },
    { id: 'prioritaire', nom: 'Prioritaire (24h)', color: 'red' },
    { id: 'express', nom: 'Express (< 4h)', color: 'purple' }
  ];

  // Charger les données
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Rafraîchir toutes les 30 secondes
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    if (user?.demo) {
      const savedDevices = appStorage.getItem('bureau_devices');
      const savedUsers = appStorage.getItem('bureau_users');
      setDevices(savedDevices ? JSON.parse(savedDevices) : []);
      const localUsers = savedUsers ? JSON.parse(savedUsers) : [];
      setClients(localUsers.filter((localUser) => localUser.role === 'USER'));
      setError('');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Charger les clients (utilisateurs avec rôle USER)
      const usersResponse = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clientUsers = usersResponse.data.filter(u => u.role === 'USER');
      setClients(clientUsers);
      
      // Charger tous les appareils
      const devicesResponse = await axios.get(`${API_URL}/devices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDevices(devicesResponse.data);
      
      setError('');
      
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données. Vérifiez votre connexion.');
      
      // Fallback localStorage pour les données de démo
      const savedDevices = appStorage.getItem('bureau_devices');
      const savedUsers = appStorage.getItem('bureau_users');
      
      if (savedDevices) {
        setDevices(JSON.parse(savedDevices));
      }
      
      if (savedUsers) {
        const allUsers = JSON.parse(savedUsers);
        const clientUsers = allUsers.filter(u => u.role === 'USER');
        setClients(clientUsers);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNewClient = async (e) => {
    e.preventDefault();
    
    try {
      // Générer un nom d'utilisateur unique
      const username = `${newClient.prenom.toLowerCase()}.${newClient.nom.toLowerCase()}.${Date.now()}`;
      
      const clientData = {
        ...newClient,
        username: username,
        role: 'USER',
        actif: true
      };
      
      const response = await axios.post(`${API_URL}/users`, clientData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Ajouter le client à la liste
      setClients([response.data, ...clients]);
      
      // Mettre à jour localStorage comme backup
      const currentUsers = JSON.parse(appStorage.getItem('bureau_users') || '[]');
      appStorage.setItem('bureau_users', JSON.stringify([response.data, ...currentUsers]));
      
      // Réinitialiser le formulaire
      setNewClient({
        username: '',
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        societe: '',
        typeClient: 'particulier',
        role: 'USER',
        password: ''
      });
      
      // Préparer pour ajouter un appareil
      setNewDevice(prev => ({ ...prev, clientId: response.data.id }));
      setActiveTab('nouvelle-reparation');
      setSelectedClient(response.data);
      
      alert(`Client ${newClient.typeClient === 'entreprise' ? newClient.societe : `${newClient.prenom} ${newClient.nom}`} créé avec succès !`);
      
    } catch (err) {
      console.error('Erreur création client:', err);
      
      // Fallback: créer localement si l'API échoue
      const clientId = `client_${Date.now()}`;
      const newClientObj = {
        id: clientId,
        ...newClient,
        username: `${newClient.prenom.toLowerCase()}.${newClient.nom.toLowerCase()}`,
        role: 'USER',
        actif: true,
        dateCreation: new Date().toISOString()
      };
      
      setClients([newClientObj, ...clients]);
      
      // Mettre à jour localStorage
      const currentUsers = JSON.parse(appStorage.getItem('bureau_users') || '[]');
      appStorage.setItem('bureau_users', JSON.stringify([newClientObj, ...currentUsers]));
      
      setNewClient({
        username: '',
        prenom: '',
        nom: '',
        email: '',
        telephone: '',
        adresse: '',
        societe: '',
        typeClient: 'particulier',
        role: 'USER',
        password: ''
      });
      
      setNewDevice(prev => ({ ...prev, clientId: clientId }));
      setActiveTab('nouvelle-reparation');
      setSelectedClient(newClientObj);
      
      alert('Client créé localement. Les données seront synchronisées plus tard.');
    }
  };

  const handleNewDevice = async (e) => {
    e.preventDefault();
    
    if (!newDevice.clientId || !newDevice.marque || !newDevice.problem) {
      alert('Veuillez remplir les champs obligatoires');
      return;
    }
    
    try {
      const selectedClient = clients.find(c => c.id === newDevice.clientId);
      if (!selectedClient) {
        alert('Client non trouvé');
        return;
      }
      
      // Calcul du coût estimé (compatible avec UserDashboard)
      const estimatedCost = {
        'Imprimante': 149.99,
        'Photocopieur': 289.99,
        'Scanner': 89.99,
        'Destructeur de documents': 129.99,
        'Télécopieur (Fax)': 119.99,
        'Machine à affranchir': 199.99,
        'Plieuse-inséreuse': 259.99,
        'Relieuse': 179.99,
        'Autre': 149.99
      };
      
      const deviceData = {
        name: newDevice.name || `${newDevice.marque} ${newDevice.modele}`,
        type: newDevice.type,
        marque: newDevice.marque,
        modele: newDevice.modele,
        problem: newDevice.problem,
        serialNumber: newDevice.serialNumber,
        userId: newDevice.clientId,
        clientName: selectedClient.societe 
          ? `${selectedClient.prenom} ${selectedClient.nom} (${selectedClient.societe})`
          : `${selectedClient.prenom} ${selectedClient.nom}`,
        status: 'nouveau',
        dateDepot: new Date().toISOString(),
        dateRecupEstimee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        facture: { 
          montant: estimatedCost[newDevice.type] || 149.99, 
          payee: false, 
          url: null 
        },
        notes: [{
          type: 'rsc',
          user: `${user.prenom} ${user.nom}`,
          message: `Réception par RSC. Urgence: ${niveauxUrgence.find(n => n.id === newDevice.urgence)?.nom}. ${newDevice.accessoires ? `Accessoires: ${newDevice.accessoires}` : ''}`,
          date: new Date().toISOString()
        }],
        urgence: newDevice.urgence
      };
      
      const response = await axios.post(`${API_URL}/devices`, deviceData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Générer une étiquette
      const etiquetteId = `ETQ-${(devices.length + 1).toString().padStart(3, '0')}`;
      const deviceWithEtiquette = {
        ...response.data,
        etiquette: etiquetteId
      };
      
      // Mettre à jour l'état local
      setDevices([deviceWithEtiquette, ...devices]);
      setLabelsToPrint([deviceWithEtiquette, ...labelsToPrint]);
      
      // Mettre à jour localStorage
      const currentDevices = JSON.parse(appStorage.getItem('bureau_devices') || '[]');
      appStorage.setItem('bureau_devices', JSON.stringify([deviceWithEtiquette, ...currentDevices]));
      
      // Réinitialiser le formulaire
      setNewDevice({
        name: '',
        type: 'Imprimante',
        marque: '',
        modele: '',
        problem: '',
        serialNumber: '',
        clientId: '',
        accessoires: '',
        urgence: 'standard'
      });
      
      alert(`Appareil enregistré avec succès !\nÉtiquette: ${etiquetteId}\n\nL'appareil est maintenant visible par les techniciens.`);
      
    } catch (err) {
      console.error('Erreur création appareil:', err);
      
      // Fallback: créer localement
      const selectedClient = clients.find(c => c.id === newDevice.clientId);
      if (!selectedClient) {
        alert('Client non trouvé');
        return;
      }
      
      const estimatedCost = {
        'Imprimante': 149.99,
        'Photocopieur': 289.99,
        'Scanner': 89.99,
        'Destructeur de documents': 129.99,
        'Télécopieur (Fax)': 119.99,
        'Machine à affranchir': 199.99,
        'Plieuse-inséreuse': 259.99,
        'Relieuse': 179.99,
        'Autre': 149.99
      };
      
      const deviceId = `device_${Date.now()}`;
      const etiquetteId = `ETQ-${(devices.length + 1).toString().padStart(3, '0')}`;
      
      const newDeviceObj = {
        id: deviceId,
        name: newDevice.name || `${newDevice.marque} ${newDevice.modele}`,
        type: newDevice.type,
        marque: newDevice.marque,
        modele: newDevice.modele,
        problem: newDevice.problem,
        serialNumber: newDevice.serialNumber,
        userId: newDevice.clientId,
        clientName: selectedClient.societe 
          ? `${selectedClient.prenom} ${selectedClient.nom} (${selectedClient.societe})`
          : `${selectedClient.prenom} ${selectedClient.nom}`,
        status: 'nouveau',
        dateDepot: new Date().toISOString(),
        dateRecupEstimee: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        facture: { 
          montant: estimatedCost[newDevice.type] || 149.99, 
          payee: false, 
          url: null 
        },
        notes: [{
          type: 'rsc',
          user: `${user.prenom} ${user.nom}`,
          message: `Réception par RSC. Urgence: ${niveauxUrgence.find(n => n.id === newDevice.urgence)?.nom}. ${newDevice.accessoires ? `Accessoires: ${newDevice.accessoires}` : ''}`,
          date: new Date().toISOString()
        }],
        urgence: newDevice.urgence,
        etiquette: etiquetteId
      };
      
      setDevices([newDeviceObj, ...devices]);
      setLabelsToPrint([newDeviceObj, ...labelsToPrint]);
      
      // Mettre à jour localStorage
      const currentDevices = JSON.parse(appStorage.getItem('bureau_devices') || '[]');
      appStorage.setItem('bureau_devices', JSON.stringify([newDeviceObj, ...currentDevices]));
      
      setNewDevice({
        name: '',
        type: 'Imprimante',
        marque: '',
        modele: '',
        problem: '',
        serialNumber: '',
        clientId: '',
        accessoires: '',
        urgence: 'standard'
      });
      
      alert('Appareil enregistré localement. Les techniciens verront cet appareil lors de leur prochaine connexion.');
    }
  };

  const handleContactClient = (client, device = null) => {
    let message = `Bonjour ${client.prenom}`;
    
    if (client.societe) {
      message += ` (${client.societe})`;
    }
    
    if (device) {
      message += `,\n\nVotre ${device.type} ${device.marque} ${device.modele} `;
      if (device.etiquette) message += `(${device.etiquette}) `;
      
      // Utiliser les mêmes statuts que les autres dashboards
      switch (device.status) {
        case 'nouveau':
          message += 'a bien été reçu par notre service.';
          break;
        case 'en_diagnostic':
          message += 'est en cours de diagnostic.';
          break;
        case 'en_attente_piece':
          message += 'est en attente de pièce détachée.';
          break;
        case 'pret_a_recuperer':
          message += 'est prêt à être récupéré.';
          break;
        case 'termine':
          message += 'est prêt à être récupéré.';
          break;
        default:
          message += 'est pris en charge par notre service technique.';
      }
    } else {
      message += ',\n\nC\'est le service réception de RepAppBuro.';
    }
    
    message += '\n\nCordialement,\nL\'équipe RepAppBuro';
    
    if (contactMessage) {
      message = contactMessage;
    }
    
    // Vérifier les moyens de contact disponibles
    const hasPhone = client.telephone && client.telephone.trim() !== '';
    const hasEmail = client.email && client.email.trim() !== '';
    
    if (!hasPhone && !hasEmail) {
      alert('Aucun moyen de contact disponible pour ce client.');
      return;
    }
    
    if (hasPhone && hasEmail) {
      const choice = window.confirm(
        `Contacter ${client.prenom} ${client.nom}${client.societe ? ` (${client.societe})` : ''} ?\n\n` +
        `📞 Téléphone: ${client.telephone}\n` +
        `📧 Email: ${client.email}\n\n` +
        `Message:\n"${message.substring(0, 100)}..."\n\n` +
        `Cliquez sur OK pour appeler, Annuler pour envoyer un email.`
      );
      
      if (choice) {
        window.open(`tel:${client.telephone.replace(/\s/g, '')}`, '_blank');
      } else {
        const subject = encodeURIComponent(device 
          ? `Votre appareil ${device.marque} ${device.modele} - RepAppBuro`
          : 'Votre appareil - RepAppBuro'
        );
        const body = encodeURIComponent(message);
        window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank');
      }
    } else if (hasPhone) {
      const choice = window.confirm(
        `Appeler ${client.prenom} ${client.nom}${client.societe ? ` (${client.societe})` : ''} ?\n\n` +
        `📞 Téléphone: ${client.telephone}\n\n` +
        `Message:\n"${message.substring(0, 100)}..."`
      );
      if (choice) {
        window.open(`tel:${client.telephone.replace(/\s/g, '')}`, '_blank');
      }
    } else if (hasEmail) {
      const subject = encodeURIComponent(device 
        ? `Votre appareil ${device.marque} ${device.modele} - RepAppBuro`
        : 'Votre appareil - RepAppBuro'
      );
      const body = encodeURIComponent(message);
      window.open(`mailto:${client.email}?subject=${subject}&body=${body}`, '_blank');
    }
    
    setContactMessage('');
  };

  const handlePrintLabel = (device) => {
    setLabelsToPrint([device]);
    
    setTimeout(() => {
      window.print();
      alert(`Étiquette ${device.etiquette} imprimée pour ${device.marque} ${device.modele}`);
    }, 500);
  };

  const handlePrintAllLabels = () => {
    if (labelsToPrint.length === 0) {
      alert('Aucune étiquette à imprimer');
      return;
    }
    
    setTimeout(() => {
      window.print();
      alert(`${labelsToPrint.length} étiquette(s) imprimée(s)`);
    }, 500);
  };

  const getAppareilIcon = (type) => {
    return typesAppareils.find(t => t.id === type)?.icon || '🔧';
  };

  const getUrgenceColor = (urgence) => {
    return niveauxUrgence.find(n => n.id === urgence)?.color || 'blue';
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

  const filteredClients = clients.filter(client =>
    `${client.prenom} ${client.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.societe && client.societe.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (client.telephone && client.telephone.includes(searchTerm))
  );

  const filteredDevices = devices.filter(device =>
    (device.clientName && device.clientName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (device.marque && device.marque.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (device.id && device.id.toString().toLowerCase().includes(searchTerm.toLowerCase())) ||
    (device.modele && device.modele.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (device.etiquette && device.etiquette.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const stats = {
    devicesEnCours: devices.filter(d => !['termine', 'recupere'].includes(d.status)).length,
    clientsEntreprises: clients.filter(c => c.typeClient === 'entreprise').length,
    devicesEnUrgence: devices.filter(d => d.urgence && ['urgent', 'prioritaire', 'express'].includes(d.urgence)).length,
    devicesTermines: devices.filter(d => d.status === 'termine' || d.status === 'recupere').length
  };

  if (loading && devices.length === 0) {
    return (
      <div className="dashboard-rsc loading">
        <div className="spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-rsc">
      {/* Header */}
      <DashboardHeader role="RSC" roleLabel={'Accueil et r\u00e9ception'} title={'R\u00e9ception service client'} subtitle={'Gestion des clients et des d\u00e9p\u00f4ts d\u2019appareils'} user={user} onLogout={handleLogout} onRefresh={fetchData} />

      {/* Afficher les erreurs */}
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
            <h3>{stats.devicesEnCours}</h3>
            <p>Appareils en cours</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏢</div>
          <div className="stat-info">
            <h3>{stats.clientsEntreprises}</h3>
            <p>Clients entreprises</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-info">
            <h3>{stats.devicesEnUrgence}</h3>
            <p>Urgences</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <h3>{stats.devicesTermines}</h3>
            <p>Terminés</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="rsc-tabs">
        <button 
          className={`tab-btn ${activeTab === 'nouveau-client' ? 'active' : ''}`}
          onClick={() => setActiveTab('nouveau-client')}
        >
          👤 Nouveau Client
        </button>
        <button 
          className={`tab-btn ${activeTab === 'nouvelle-reparation' ? 'active' : ''}`}
          onClick={() => setActiveTab('nouvelle-reparation')}
        >
          🖨️ Nouvel Appareil
        </button>
        <button 
          className={`tab-btn ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
        >
          📋 Clients ({clients.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'reparations' ? 'active' : ''}`}
          onClick={() => setActiveTab('reparations')}
        >
          🔧 Appareils ({devices.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'etiquettes' ? 'active' : ''}`}
          onClick={() => setActiveTab('etiquettes')}
        >
          🏷️ Étiquettes ({labelsToPrint.length})
        </button>
      </div>

      {/* Recherche */}
      <div className="search-section">
        <input
          type="text"
          placeholder="🔍 Rechercher client, appareil ou numéro de série..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Contenu selon l'onglet */}
      <div className="rsc-content">
        {/* Onglet: Nouveau Client */}
        {activeTab === 'nouveau-client' && (
          <div className="tab-content">
            <h2 className="tab-title">👤 Enregistrement d'un nouveau client</h2>
            
            <form className="client-form" onSubmit={handleNewClient}>
              <div className="client-type-selector">
                <label>Type de client :</label>
                <div className="type-options">
                  <button
                    type="button"
                    className={`type-btn ${newClient.typeClient === 'particulier' ? 'active' : ''}`}
                    onClick={() => setNewClient({...newClient, typeClient: 'particulier'})}
                  >
                    👤 Particulier
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${newClient.typeClient === 'entreprise' ? 'active' : ''}`}
                    onClick={() => setNewClient({...newClient, typeClient: 'entreprise'})}
                  >
                    🏢 Entreprise
                  </button>
                </div>
              </div>
              
              <div className="form-grid">
                <div className="form-group">
                  <label>Prénom *</label>
                  <input
                    type="text"
                    value={newClient.prenom}
                    onChange={(e) => setNewClient({...newClient, prenom: e.target.value})}
                    placeholder="Prénom du client"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Nom *</label>
                  <input
                    type="text"
                    value={newClient.nom}
                    onChange={(e) => setNewClient({...newClient, nom: e.target.value})}
                    placeholder="Nom du client"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Mot de passe *</label>
                  <input
                    type="password"
                    value={newClient.password}
                    onChange={(e) => setNewClient({...newClient, password: e.target.value})}
                    placeholder="Mot de passe pour l'espace client"
                    required
                  />
                </div>
                
                {newClient.typeClient === 'entreprise' && (
                  <div className="form-group full-width">
                    <label>Société / Raison sociale *</label>
                    <input
                      type="text"
                      value={newClient.societe}
                      onChange={(e) => setNewClient({...newClient, societe: e.target.value})}
                      placeholder="Nom de l'entreprise"
                      required
                    />
                  </div>
                )}
                
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    placeholder="email@exemple.com"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Téléphone *</label>
                  <input
                    type="tel"
                    value={newClient.telephone}
                    onChange={(e) => setNewClient({...newClient, telephone: e.target.value})}
                    placeholder="01 23 45 67 89"
                    required
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Adresse {newClient.typeClient === 'entreprise' ? 'de l\'entreprise' : 'du client'}</label>
                  <textarea
                    value={newClient.adresse}
                    onChange={(e) => setNewClient({...newClient, adresse: e.target.value})}
                    placeholder="Adresse complète"
                    rows="2"
                  />
                </div>
              </div>
              
              <button type="submit" className="submit-btn">
                📝 Enregistrer le client
              </button>
            </form>
          </div>
        )}

        {/* Onglet: Nouvel Appareil */}
        {activeTab === 'nouvelle-reparation' && (
          <div className="tab-content">
            <h2 className="tab-title">🖨️ Nouvelle fiche de réparation</h2>
            
            <form className="reparation-form" onSubmit={handleNewDevice}>
              <div className="form-section">
                <h3>1. Sélection du client</h3>
                <select
                  value={newDevice.clientId}
                  onChange={(e) => {
                    setNewDevice({...newDevice, clientId: e.target.value});
                    const client = clients.find(c => c.id === e.target.value);
                    setSelectedClient(client);
                  }}
                  className="client-select"
                  required
                >
                  <option value="">Sélectionner un client...</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.societe 
                        ? `${client.societe} (${client.prenom} ${client.nom})`
                        : `${client.prenom} ${client.nom}`
                      }
                    </option>
                  ))}
                </select>
                
                {selectedClient && (
                  <div className="client-preview">
                    <p><strong>Client :</strong> {selectedClient.societe 
                      ? `${selectedClient.societe} (${selectedClient.prenom} ${selectedClient.nom})`
                      : `${selectedClient.prenom} ${selectedClient.nom}`
                    }</p>
                    <p>📧 {selectedClient.email} | 📞 {selectedClient.telephone}</p>
                  </div>
                )}
              </div>
              
              <div className="form-section">
                <h3>2. Type d'appareil bureautique</h3>
                <div className="appareils-grid">
                  {typesAppareils.map(type => (
                    <button
                      key={type.id}
                      type="button"
                      className={`appareil-btn ${newDevice.type === type.id ? 'active' : ''}`}
                      onClick={() => setNewDevice({...newDevice, type: type.id})}
                    >
                      {type.icon} {type.nom}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="form-section">
                <h3>3. Informations de l'appareil</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Nom de l'appareil</label>
                    <input
                      type="text"
                      value={newDevice.name}
                      onChange={(e) => setNewDevice({...newDevice, name: e.target.value})}
                      placeholder="Ex: Imprimante Laser, Photocopieur..."
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
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Modèle</label>
                    <input
                      type="text"
                      value={newDevice.modele}
                      onChange={(e) => setNewDevice({...newDevice, modele: e.target.value})}
                      placeholder="Ex: LaserJet Pro, imageRUNNER..."
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Numéro de série</label>
                    <input
                      type="text"
                      value={newDevice.serialNumber}
                      onChange={(e) => setNewDevice({...newDevice, serialNumber: e.target.value})}
                      placeholder="Ex: CN12345678"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Niveau d'urgence</label>
                    <select
                      value={newDevice.urgence}
                      onChange={(e) => setNewDevice({...newDevice, urgence: e.target.value})}
                      className="urgence-select"
                    >
                      {niveauxUrgence.map(niveau => (
                        <option key={niveau.id} value={niveau.id}>
                          {niveau.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h3>4. Description du problème *</h3>
                <div className="form-group full-width">
                  <textarea
                    value={newDevice.problem}
                    onChange={(e) => setNewDevice({...newDevice, problem: e.target.value})}
                    placeholder="Décrivez le problème rencontré (bourrage papier, défaut d'impression, panne électrique, etc.)..."
                    rows="3"
                    required
                  />
                </div>
              </div>
              
              <div className="form-section">
                <h3>5. Accessoires fournis</h3>
                <div className="form-group full-width">
                  <textarea
                    value={newDevice.accessoires}
                    onChange={(e) => setNewDevice({...newDevice, accessoires: e.target.value})}
                    placeholder="Câbles, cartouches, toner, notice, clés, etc."
                    rows="2"
                  />
                </div>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="submit-btn">
                  📋 Enregistrer l'appareil
                </button>
                <button type="button" className="secondary-btn" onClick={() => setActiveTab('nouveau-client')}>
                  👤 Nouveau client d'abord
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Onglet: Liste Clients */}
        {activeTab === 'clients' && (
          <div className="tab-content">
            <h2 className="tab-title">📋 Clients ({filteredClients.length})</h2>
            
            <div className="clients-grid">
              {filteredClients.length === 0 ? (
                <div className="no-data">
                  <p>Aucun client trouvé.</p>
                  <button onClick={() => setActiveTab('nouveau-client')} className="action-btn">
                    👤 Créer un premier client
                  </button>
                </div>
              ) : (
                filteredClients.map(client => {
                  const clientDevices = devices.filter(d => d.userId === client.id);
                  return (
                    <div key={client.id} className="client-card">
                      <div className="client-header">
                        <div className="client-avatar">
                          {client.societe ? '🏢' : '👤'}
                        </div>
                        <div className="client-info">
                          <h3>
                            {client.prenom} {client.nom}
                            {client.societe && <span className="societe"> - {client.societe}</span>}
                          </h3>
                          <p>ID: {client.id}</p>
                        </div>
                      </div>
                      
                      <div className="client-details">
                        <p><span className="detail-label">📧 Email:</span> {client.email}</p>
                        <p><span className="detail-label">📞 Téléphone:</span> {client.telephone || 'Non renseigné'}</p>
                        <p><span className="detail-label">📍 Type:</span> {client.societe ? 'Entreprise' : 'Particulier'}</p>
                        <p><span className="detail-label">🔧 Appareils:</span> {clientDevices.length}</p>
                      </div>
                      
                      <div className="client-actions">
                        <button 
                          onClick={() => handleContactClient(client)}
                          className="action-btn contact-btn"
                          disabled={!client.telephone && !client.email}
                        >
                          {!client.telephone && !client.email ? '📭 Pas de contact' : '📞 Contacter'}
                        </button>
                        <button 
                          onClick={() => {
                            setNewDevice(prev => ({ ...prev, clientId: client.id }));
                            setActiveTab('nouvelle-reparation');
                            setSelectedClient(client);
                          }}
                          className="action-btn reparation-btn"
                        >
                          🖨️ Nouvel appareil
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Onglet: Appareils (Réparations) */}
        {activeTab === 'reparations' && (
          <div className="tab-content">
            <h2 className="tab-title">🔧 Appareils en réparation ({filteredDevices.length})</h2>
            
            {filteredDevices.length === 0 ? (
              <div className="no-data">
                <p>Aucun appareil en réparation.</p>
                <p>Les appareils déposés par les clients apparaîtront ici.</p>
                <button onClick={() => setActiveTab('nouvelle-reparation')} className="action-btn">
                  🖨️ Enregistrer un appareil
                </button>
              </div>
            ) : (
              <div className="reparations-grid">
                {filteredDevices.map(device => {
                  const client = clients.find(c => c.id === device.userId);
                  return (
                    <div key={device.id || device._id} className="reparation-card">
                      <div className="reparation-header">
                        <div className="appareil-icon">
                          {getAppareilIcon(device.type)}
                        </div>
                        <div className="reparation-info">
                          <h3>{device.name || `${device.marque} ${device.modele}`}</h3>
                          <p className="reparation-id">{device.etiquette || device.id || 'N/A'}</p>
                        </div>
                        <div className={`urgence-badge urgence-${getUrgenceColor(device.urgence || 'standard')}`}>
                          {niveauxUrgence.find(n => n.id === (device.urgence || 'standard'))?.nom.split(' ')[0]}
                        </div>
                      </div>
                      
                      <div className="reparation-details">
                        <p><strong>Client:</strong> {device.clientName}</p>
                        <p><strong>Type:</strong> {device.type}</p>
                        <p><strong>Date dépôt:</strong> {new Date(device.dateDepot).toLocaleDateString('fr-FR')}</p>
                        <p><strong>Statut:</strong> 
                          <span className={`status-badge status-${getStatutColor(device.status)}`}>
                            {getStatutLabel(device.status)}
                          </span>
                        </p>
                      </div>
                      
                      <div className="reparation-actions">
                        <button 
                          onClick={() => handlePrintLabel(device)}
                          className="action-btn"
                        >
                          🖨️ Étiquette
                        </button>
                        {client && (
                          <button 
                            onClick={() => handleContactClient(client, device)}
                            className="action-btn contact-btn"
                          >
                            📞 Client
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Onglet: Étiquettes */}
        {activeTab === 'etiquettes' && (
          <div className="tab-content">
            <h2 className="tab-title">🏷️ Étiquettes d'identification ({labelsToPrint.length})</h2>
            
            <div className="labels-controls">
              <button 
                onClick={handlePrintAllLabels}
                className="print-all-btn"
                disabled={labelsToPrint.length === 0}
              >
                🖨️ Imprimer toutes ({labelsToPrint.length})
              </button>
              
              <button 
                onClick={() => setLabelsToPrint([])}
                className="clear-btn"
              >
                🗑️ Vider
              </button>
            </div>
            
            <div className="labels-grid">
              {labelsToPrint.length === 0 ? (
                <div className="no-labels">
                  <p>🏷️ Aucune étiquette à imprimer</p>
                  <p>Enregistrez un nouvel appareil pour générer des étiquettes</p>
                  <button 
                    onClick={() => setActiveTab('nouvelle-reparation')}
                    className="goto-btn"
                  >
                    Enregistrer un appareil
                  </button>
                </div>
              ) : (
                labelsToPrint.map((device) => (
                  <div key={device.id || device._id} className="label-card printable">
                    <div className="label-header">
                      <div className="label-title">
                        <h3>RepAppBuro</h3>
                        <p className="label-id">{device.etiquette || device.id}</p>
                        <p className="label-appareil">{getAppareilIcon(device.type)} {device.marque} {device.modele}</p>
                      </div>
                    </div>
                    
                    <div className="label-content">
                      <p><strong>Client:</strong> {device.clientName}</p>
                      <p><strong>Type:</strong> {device.type}</p>
                      <p><strong>Date:</strong> {new Date(device.dateDepot).toLocaleDateString('fr-FR')}</p>
                      {device.serialNumber && <p><strong>Série:</strong> {device.serialNumber}</p>}
                      {device.problem && <p><strong>Problème:</strong> {device.problem.substring(0, 50)}...</p>}
                    </div>
                    
                    <div className="label-footer">
                      <p>⚠️ À conserver avec l'appareil</p>
                      <p>📞 Service client: 01 23 45 67 89</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <DashboardFooter />
    </div>
  );
};

export default DashboardRSC;
