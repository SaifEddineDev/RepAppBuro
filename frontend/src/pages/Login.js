import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const success = await login(username, password);
      if (success) {
        // Redirection vers la page d'accueil ou tableau de bord
        navigate('/dashboard');
      } else {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      }
    } catch (err) {
      // Gestion des erreurs spécifiques de l'API
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError('Erreur de connexion au serveur. Vérifiez votre connexion internet.');
      } else if (err.message.includes('401')) {
        setError('Identifiants incorrects. Veuillez réessayer.');
      } else if (err.message.includes('404')) {
        setError('Utilisateur non trouvé.');
      } else {
        setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Éléments décoratifs */}
      <div className="login-decoration decoration-1"></div>
      <div className="login-decoration decoration-2"></div>
      
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-header">
          <h1 className="login-title">RepAppBuro</h1>
          <p className="login-subtitle">Tableau de bord administratif</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">Nom d'utilisateur</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="input-field"
            placeholder="Entrez votre nom d'utilisateur"
            required
            disabled={isLoading}
            autoComplete="username"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Mot de passe</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="Entrez votre mot de passe"
            required
            disabled={isLoading}
            autoComplete="current-password"
          />
        </div>
        
        <button 
          type="submit" 
          className={`login-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
        
        {/* Section pour créer un compte - TOUJOURS visible */}
        <div className="test-login-link">
          <p>Vous n'avez pas de compte ?</p>
          <button 
            type="button"
            className="test-mode-btn"
            onClick={() => navigate('/register')}
            disabled={isLoading}
          >
            Créer un compte →
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;