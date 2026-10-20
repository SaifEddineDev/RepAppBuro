const configuredApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const normalizedApiUrl = configuredApiUrl.replace(/\/+$/, '');
const API_URL = normalizedApiUrl.endsWith('/api') ? normalizedApiUrl : `${normalizedApiUrl}/api`;

// Fonction gÃ©nÃ©rique pour les requÃªtes API
export const apiRequest = async (endpoint, method = 'GET', body = null) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    credentials: 'include'
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    // Si la rÃ©ponse n'a pas de contenu (statut 204 par exemple)
    if (response.status === 204) {
      return { success: true };
    }
    
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Erreur API');
    }

    return data;
  } catch (error) {
    console.error('Erreur API:', error);
    throw error;
  }
};

// Services d'authentification
export const authService = {
  // Connexion
  login: async (username, password) => {
    return apiRequest('/auth/login', 'POST', { 
      username: username.trim(), 
      password 
    });
  },
  demoLogin: (role) => apiRequest('/auth/demo-login', 'POST', { role }),
  
  // Inscription
  register: async (userData) => {
    return apiRequest('/auth/register', 'POST', {
      username: userData.username.trim(),
      email: userData.email.trim(),
      password: userData.password
    });
  },
  
  // VÃ©rification du token
  verifyToken: () => apiRequest('/auth/verify', 'GET'),
  
  // DÃ©connexion
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return apiRequest('/auth/logout', 'POST');
  },
  
  // RÃ©cupÃ©ration du profil utilisateur
  getProfile: () => apiRequest('/auth/profile', 'GET'),
  
  // RÃ©cupÃ©rer l'utilisateur depuis le localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr);
    }
    return null;
  },
  
  // Sauvegarder l'utilisateur dans le localStorage
  saveUserData: (userData, token) => {
    if (token) {
      localStorage.setItem('token', token);
    }
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  },
  
  // VÃ©rifier si l'utilisateur est connectÃ©
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// Services utilisateur
export const userService = {
  // RÃ©cupÃ©rer tous les utilisateurs (admin seulement)
  getAllUsers: () => apiRequest('/users', 'GET'),
  
  // RÃ©cupÃ©rer un utilisateur par ID
  getUserById: (id) => apiRequest(`/users/${id}`, 'GET'),
  
  // Mettre Ã  jour un utilisateur
  updateUser: (id, userData) => apiRequest(`/users/${id}`, 'PUT', userData),
  
  // Supprimer un utilisateur
  deleteUser: (id) => apiRequest(`/users/${id}`, 'DELETE'),
  
  // Changer le mot de passe
  changePassword: (oldPassword, newPassword) => 
    apiRequest('/auth/change-password', 'POST', { oldPassword, newPassword }),
  
  // RÃ©initialiser le mot de passe (pour admin ou oubli de mot de passe)
  resetPassword: (email) => apiRequest('/auth/reset-password', 'POST', { email })
};

// Gestion des erreurs
export const handleApiError = (error, setError) => {
  if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
    setError('Erreur de connexion au serveur. Veuillez vÃ©rifier votre connexion internet.');
  } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    setError('Session expirÃ©e. Veuillez vous reconnecter.');
    // DÃ©connecter l'utilisateur
    authService.logout();
    window.location.href = '/login';
  } else if (error.message.includes('409') || error.message.includes('already exists')) {
    setError('Cet utilisateur ou email existe dÃ©jÃ .');
  } else if (error.message.includes('404') || error.message.includes('not found')) {
    setError('Utilisateur non trouvÃ©.');
  } else if (error.message.includes('400') || error.message.includes('Bad Request')) {
    setError('DonnÃ©es invalides. Veuillez vÃ©rifier les informations saisies.');
  } else {
    setError(error.message || 'Une erreur est survenue. Veuillez rÃ©essayer.');
  }
};

// Intercepteur pour ajouter automatiquement le token
let authInterceptor = null;

export const setupAuthInterceptor = () => {
  authInterceptor = async (endpoint, method, body) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return apiRequest(endpoint, method, body);
    }
    
    // VÃ©rifier si le token est expirÃ©
    try {
      const response = await fetch(`${API_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // Token invalide ou expirÃ©
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        throw new Error('Session expirÃ©e');
      }
      
      return apiRequest(endpoint, method, body);
    } catch (error) {
      throw error;
    }
  };
  
  return authInterceptor;
};

// Version sÃ©curisÃ©e des requÃªtes API
export const secureApiRequest = async (endpoint, method = 'GET', body = null) => {
  if (!authInterceptor) {
    setupAuthInterceptor();
  }
  return authInterceptor(endpoint, method, body);
};

export default {
  apiRequest,
  authService,
  userService,
  handleApiError,
  secureApiRequest,
  setupAuthInterceptor
};
