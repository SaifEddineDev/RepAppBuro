import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, handleApiError } from '../services/api';
import { appStorage } from '../utils/appStorage';

const AuthContext = createContext();
const DEMO_MODE = process.env.REACT_APP_DEMO_MODE === 'true';
const DEMO_ROLES = ['USER', 'RSC', 'TECHNICIEN', 'RESPONSABLE', 'ADMIN'];

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => appStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si un token existe
        const token = appStorage.getItem('token');
        const storedUser = appStorage.getItem('user');

        if (DEMO_MODE) {
          const demoUser = storedUser ? JSON.parse(storedUser) : null;
          if (token?.startsWith('demo:') && demoUser?.demo && DEMO_ROLES.includes(demoUser.role)) {
            setUser(demoUser);
            setToken(token);
          } else {
            appStorage.removeItem('token');
            appStorage.removeItem('user');
          }
          return;
        }
        
        if (token && storedUser) {
          try {
            // Vérifier le token avec le backend
            const response = await authService.verifyToken();
            
            if (response && response.user) {
              setUser(response.user);
              setToken(response.token || token);
              // Mettre à jour les données utilisateur dans localStorage
              authService.saveUserData(response.user, response.token || token);
            } else {
              // Token invalide, déconnexion
              logout();
            }
          } catch (error) {
            console.error('Erreur vérification token:', error);
            logout();
          }
        } else if (storedUser) {
          // Si pas de token mais un utilisateur stocké, le supprimer
          logout();
        }
      } catch (error) {
        console.error('Erreur initiale d\'authentification:', error);
        logout();
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Fonction de connexion
  const login = async (username, password, expectedRole) => {
    try {
      setLoading(true);
      const response = await authService.login(username, password);

      if (response && response.user && response.token) {
        if (expectedRole && response.user.role !== expectedRole) {
          throw new Error('Ce compte ne correspond pas au rôle sélectionné.');
        }
        authService.saveUserData(response.user, response.token);
        setUser(response.user);
        setToken(response.token);
        return response.user;
      }
      return false;
    } catch (error) {
      console.error('Erreur de connexion:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginDemo = async (role) => {
    if (DEMO_MODE) {
      if (!DEMO_ROLES.includes(role)) {
        throw new Error('Rôle de démonstration inconnu.');
      }

      const roleNames = {
        USER: ['Client', 'Démo'],
        RSC: ['Accueil', 'Démo'],
        TECHNICIEN: ['Technicien', 'Démo'],
        RESPONSABLE: ['Responsable', 'Démo'],
        ADMIN: ['Administrateur', 'Démo']
      };
      const [prenom, nom] = roleNames[role];
      const demoUser = {
        id: `demo-${role.toLowerCase()}`,
        username: `demo_${role.toLowerCase()}`,
        email: `demo.${role.toLowerCase()}@repappburo.test`,
        prenom,
        nom,
        role,
        actif: true,
        demo: true
      };
      const demoToken = `demo:${role}`;
      authService.saveUserData(demoUser, demoToken);
      setUser(demoUser);
      setToken(demoToken);
      return demoUser;
    }

    try {
      setLoading(true);
      const response = await authService.demoLogin(role);
      if (!response?.user || !response?.token || response.user.role !== role) {
        throw new Error('La connexion de démonstration est indisponible.');
      }
      authService.saveUserData(response.user, response.token);
      setUser(response.user);
      setToken(response.token);
      return response.user;
    } finally {
      setLoading(false);
    }
  };

  // Fonction d'inscription
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);

      if (response && response.user) {
        // Optionnel: connecter automatiquement après inscription
        // Si le backend retourne un token après inscription
        if (response.token) {
          authService.saveUserData(response.user, response.token);
          setUser(response.user);
          setToken(response.token);
        }
        return { success: true, user: response.user, authenticated: Boolean(response.token) };
      }
      return { success: false, message: response?.message || 'Erreur lors de l\'inscription' };
    } catch (error) {
      console.error('Erreur d\'inscription:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      setLoading(true);
      if (!DEMO_MODE || !user?.demo) {
        await authService.logout();
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Continuer même en cas d'erreur
    } finally {
      // Nettoyer le local storage et l'état
      appStorage.removeItem('token');
      appStorage.removeItem('user');
      setUser(null);
      setToken(null);
      setLoading(false);
      
      // Rediriger vers la page de connexion
      if (!window.location.hash.startsWith('#/login') && !window.location.hash.startsWith('#/register')) {
        window.location.hash = '/login';
      }
    }
  };

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = () => {
    return authService.isAuthenticated();
  };

  // Récupérer l'utilisateur courant
  const getCurrentUser = () => {
    return authService.getCurrentUser();
  };

  const value = {
    user,
    token,
    login,
    loginDemo,
    register,
    logout,
    loading,
    isAuthenticated,
    getCurrentUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
