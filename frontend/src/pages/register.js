import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      });
      
      if (result.success) {
        setSuccess('Inscription réussie ! Redirection vers la page de connexion...');
        
        // Redirection après 2 secondes
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setError(result.message || 'Erreur lors de l\'inscription');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de l\'inscription');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Éléments décoratifs */}
      <div className="register-decoration decoration-1"></div>
      <div className="register-decoration decoration-2"></div>
      
      <form className="register-card" onSubmit={handleSubmit}>
        <div className="register-header">
          <h1 className="register-title">Créer un compte</h1>
          <p className="register-subtitle">Rejoignez RepAppBuro</p>
        </div>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
        
        <div className="form-group">
          <label className="form-label">Nom d'utilisateur *</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="input-field"
            placeholder="Choisissez un nom d'utilisateur"
            required
            disabled={isLoading}
            autoComplete="username"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Adresse email *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="input-field"
            placeholder="votre@email.com"
            required
            disabled={isLoading}
            autoComplete="email"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Mot de passe *</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="input-field"
            placeholder="Au moins 6 caractères"
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Confirmer le mot de passe *</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="input-field"
            placeholder="Répétez votre mot de passe"
            required
            disabled={isLoading}
            autoComplete="new-password"
          />
        </div>
        
        <button 
          type="submit" 
          className={`register-button ${isLoading ? 'loading' : ''}`}
          disabled={isLoading}
        >
          {isLoading ? 'Inscription en cours...' : 'S\'inscrire'}
        </button>
        
        <div className="login-link">
          <p>Vous avez déjà un compte ?</p>
          <button 
            type="button"
            className="login-mode-btn"
            onClick={() => navigate('/login')}
            disabled={isLoading}
          >
            Se connecter →
          </button>
        </div>
      </form>
    </div>
  );
};

export default Register;