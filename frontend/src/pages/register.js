import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.');
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
        setSuccess('Compte créé avec succès. Redirection vers la connexion…');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(result.message || 'Impossible de créer le compte. Veuillez réessayer.');
      }
    } catch (err) {
      setError(err.message || 'Une erreur est survenue lors de la création du compte.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page register-page">
      <div className="login-orb login-orb-one" aria-hidden="true" />
      <div className="login-orb login-orb-two" aria-hidden="true" />

      <div className="login-shell register-shell">
        <section className="login-story register-story" aria-label="Présentation de RepAppBuro">
          <div className="login-brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none"><path d="M18.7 5.3a8.1 8.1 0 0 0-9.6 10.2L4.4 20.2a3 3 0 0 0 4.2 4.2l4.7-4.7a8.1 8.1 0 0 0 10.2-9.6l-4.8 4.8-4.2-4.2 4.2-4.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="brand-name">RepApp<span>Buro</span></span>
          </div>

          <div className="story-copy register-story-copy">
            <span className="story-kicker"><span /> Votre atelier, mieux organisé</span>
            <h1>Tout votre atelier,<br /><em>au même</em> endroit.</h1>
            <p>Créez votre espace RepAppBuro pour suivre les réparations, retrouver vos clients et faire avancer votre équipe.</p>
          </div>

          <div className="register-features">
            <div className="register-feature">
              <span className="feature-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /><path d="M8 9h8M8 12h5M8 15h7" /></svg></span>
              <span><strong>Un atelier sous contrôle</strong><small>Suivez chaque réparation simplement.</small></span>
              <span className="feature-check" aria-hidden="true">✓</span>
            </div>
            <div className="register-feature">
              <span className="feature-icon feature-icon-blue" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3" /><path d="M3.5 19c.4-3 2.3-4.5 5.5-4.5 1.5 0 2.7.4 3.7 1.1M16 11v6m-3-3h6" /></svg></span>
              <span><strong>Une équipe bien coordonnée</strong><small>Gardez les clients et les tâches à portée de main.</small></span>
              <span className="feature-check" aria-hidden="true">✓</span>
            </div>
          </div>

          <div className="story-footer"><span>✳</span> Un atelier bien organisé commence ici.</div>
        </section>

        <section className="login-panel register-panel" aria-labelledby="register-title">
          <div className="mobile-brand login-brand">
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 32 32" fill="none"><path d="M18.7 5.3a8.1 8.1 0 0 0-9.6 10.2L4.4 20.2a3 3 0 0 0 4.2 4.2l4.7-4.7a8.1 8.1 0 0 0 10.2-9.6l-4.8 4.8-4.2-4.2 4.2-4.2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </span>
            <span className="brand-name">RepApp<span>Buro</span></span>
          </div>

          <div className="login-form-heading">
            <span className="form-eyebrow">COMMENCEZ EN QUELQUES INSTANTS</span>
            <h2 id="register-title">Créer votre compte</h2>
            <p>Rejoignez votre espace de gestion d’atelier.</p>
          </div>

          <form className="login-form register-form" onSubmit={handleSubmit}>
            {error && <div className="login-error" role="alert">{error}</div>}
            {success && <div className="register-success" role="status">{success}</div>}

            <div className="login-field">
              <label htmlFor="register-username">Nom d’utilisateur</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.2 3.2-5 7-5s6.5 1.8 7 5" /></svg>
                <input id="register-username" name="username" type="text" value={formData.username} onChange={handleChange} placeholder="Choisissez un nom d’utilisateur" autoComplete="username" autoCapitalize="none" required disabled={isLoading} />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="register-email">Adresse e-mail</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="14" rx="2" /><path d="m4.5 7 7.5 5.5L19.5 7" /></svg>
                <input id="register-email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="vous@exemple.com" autoComplete="email" required disabled={isLoading} />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="register-password">Mot de passe</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <input id="register-password" name="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={handleChange} placeholder="Au moins 6 caractères" autoComplete="new-password" minLength={6} required disabled={isLoading} />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  aria-controls="register-password"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.4 9.5 7-.4 1.1-1.2 2.3-2.3 3.4M6.2 6.2C3.9 7.7 2.8 9.8 2.5 12c.5 1.3 1.4 2.7 2.8 3.9a9.9 9.9 0 0 0 6.7 2.6c.8 0 1.6-.1 2.3-.3" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                  )}
                </button>
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="register-confirm-password">Confirmer le mot de passe</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 9.5C7.8 18.8 5 15.5 5 11V6l7-3Z" /><path d="m9 12 2 2 4-4" /></svg>
                <input id="register-confirm-password" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} onChange={handleChange} placeholder="Saisissez-le une seconde fois" autoComplete="new-password" minLength={6} required disabled={isLoading} />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'}
                  aria-controls="register-confirm-password"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5 0 8.5 4.4 9.5 7-.4 1.1-1.2 2.3-2.3 3.4M6.2 6.2C3.9 7.7 2.8 9.8 2.5 12c.5 1.3 1.4 2.7 2.8 3.9a9.9 9.9 0 0 0 6.7 2.6c.8 0 1.6-.1 2.3-.3" /></svg>
                  ) : (
                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" /><circle cx="12" cy="12" r="2.5" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button className="login-submit" type="submit" disabled={isLoading}>
              {isLoading ? <><span className="login-spinner" /> Création en cours…</> : <>Créer mon compte <span aria-hidden="true">→</span></>}
            </button>
          </form>

          <div className="login-register register-login-link">
            <span>Vous avez déjà un compte ?</span>
            <button type="button" onClick={() => navigate('/login')} disabled={isLoading}>Se connecter <span aria-hidden="true">↗</span></button>
          </div>
          <p className="login-security"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5 16 5v4.2c0 4-2.5 6.8-6 8.3-3.5-1.5-6-4.3-6-8.3V5l6-2.5Z" /><path d="m7.5 9.8 1.7 1.7 3.4-3.6" /></svg> Vos informations restent protégées</p>
        </section>
      </div>
    </main>
  );
};

export default Register;
