import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService, handleApiError } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier si un token existe
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            // Vérifier le token avec le backend
            const response = await authService.verifyToken();
            
            if (response && response.user) {
              setUser(response.user);
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
        }
        return { success: true, user: response.user };
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
      // Appeler le backend pour déconnexion propre
      await authService.logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Continuer même en cas d'erreur
    } finally {
      // Nettoyer le local storage et l'état
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setLoading(false);
      
      // Rediriger vers la page de connexion
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
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
    login,
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
