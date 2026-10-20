import React, { useState } from 'react';
import BrandMark from '../components/BrandMark';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(username, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError("Nom d'utilisateur ou mot de passe incorrect.");
      }
    } catch (err) {
      if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) {
        setError('Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.');
      } else if (err.message.includes('401')) {
        setError('Identifiants incorrects. Vérifiez vos informations.');
      } else if (err.message.includes('404')) {
        setError('Aucun compte ne correspond à ces informations.');
      } else {
        setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" aria-hidden="true" />
      <div className="login-orb login-orb-two" aria-hidden="true" />

      <div className="login-shell">
        <section className="login-story" aria-label="Présentation de RepAppBuro">
          <div className="login-brand">
            <BrandMark />
            <span className="brand-name">RepApp<span>Buro</span></span>
          </div>

          <div className="story-copy">
            <span className="story-kicker"><span /> Gestion d’atelier, simplement</span>
            <h1>Votre atelier,<br /><em>en parfait</em> état.</h1>
            <p>Retrouvez vos réparations, vos clients et votre équipe au même endroit. Tout est prêt pour reprendre le fil.</p>
          </div>

          <div className="dashboard-preview" aria-hidden="true">
            <div className="preview-topbar">
              <div className="preview-dots"><i /><i /><i /></div>
              <span>Vue d’ensemble</span>
              <span className="preview-live"><i /> EN DIRECT</span>
            </div>
            <div className="preview-body">
              <div className="preview-heading">
                <div><span>ESPACE DE TRAVAIL</span><strong>Bonjour, Saif 👋</strong></div>
                <div className="preview-avatar">S</div>
              </div>
              <div className="preview-metrics">
                <div className="metric-card"><span>En cours</span><strong>24</strong><i className="metric-bars"><b /><b /><b /><b /><b /><b /><b /></i></div>
                <div className="metric-card"><span>Terminées</span><strong>18 <small>+12%</small></strong><i className="metric-line" /></div>
              </div>
              <div className="preview-list-title"><span>Réparations récentes</span><span>Cette semaine&nbsp; ↗</span></div>
              <div className="preview-row"><i className="device-icon phone-icon">◫</i><span><b>iPhone 13 Pro</b><small>Écran · Nadia B.</small></span><em className="status status-progress">En cours</em></div>
              <div className="preview-row"><i className="device-icon laptop-icon">▱</i><span><b>MacBook Air M2</b><small>Batterie · Karim L.</small></span><em className="status status-ready">Prêt</em></div>
            </div>
          </div>

          <div className="story-footer"><span>✳</span> Un atelier bien organisé commence ici.</div>
        </section>

        <section className="login-panel" aria-labelledby="login-title">
          <div className="mobile-brand login-brand">
            <BrandMark />
            <span className="brand-name">RepApp<span>Buro</span></span>
          </div>

          <div className="login-form-heading">
            <span className="form-eyebrow">VOTRE ESPACE DE TRAVAIL</span>
            <h2 id="login-title">Ravi de vous revoir</h2>
            <p>Connectez-vous pour accéder à votre atelier.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error" role="alert">{error}</div>}

            <div className="login-field">
              <label htmlFor="login-username">Nom d’utilisateur</label>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.2 3.2-5 7-5s6.5 1.8 7 5" /></svg>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Votre nom d’utilisateur"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  disabled={isLoading}
                  aria-invalid={Boolean(error)}
                />
              </div>
            </div>

            <div className="login-field">
              <div className="password-label-row">
                <label htmlFor="login-password">Mot de passe</label>
              </div>
              <div className="login-input-wrap">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Saisissez votre mot de passe"
                  autoComplete="current-password"
                  required
                  disabled={isLoading}
                  aria-invalid={Boolean(error)}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
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

            <button className="login-submit" type="submit" disabled={isLoading}>
              {isLoading ? <><span className="login-spinner" /> Connexion en cours…</> : <>Se connecter <span aria-hidden="true">→</span></>}
            </button>
          </form>

          <div className="login-register">
            <span>Vous découvrez RepAppBuro ?</span>
            <button type="button" onClick={() => navigate('/register')} disabled={isLoading}>Créer un compte <span aria-hidden="true">↗</span></button>
          </div>

          <p className="login-security"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M10 2.5 16 5v4.2c0 4-2.5 6.8-6 8.3-3.5-1.5-6-4.3-6-8.3V5l6-2.5Z" /><path d="m7.5 9.8 1.7 1.7 3.4-3.6" /></svg> Connexion sécurisée à votre espace atelier</p>
        </section>
      </div>
    </main>
  );
};

export default Login;