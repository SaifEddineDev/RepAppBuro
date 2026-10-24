import React from 'react';
import BrandLockup from '../components/BrandLockup';
import './DemoRoleDashboard.css';

const roleContent = {
  USER: {
    title: 'Espace client',
    subtitle: 'Suivez vos demandes et retrouvez vos appareils.',
    stats: [['Mes appareils', '2'], ['En réparation', '1'], ['Prêts à récupérer', '1']],
    section: 'Mes réparations',
    rows: [['Imprimante HP LaserJet', 'Diagnostic en cours', 'En cours'], ['Scanner Epson DS-410', 'Réparation terminée', 'Prêt']]
  },
  RSC: {
    title: 'Espace accueil',
    subtitle: 'Centralisez les demandes clients et les dépôts d’appareils.',
    stats: [['Clients suivis', '24'], ['Dépôts aujourd’hui', '6'], ['À diagnostiquer', '3']],
    section: 'Activité de l’accueil',
    rows: [['Nouveau dépôt', 'Imprimante — Mme Martin', 'À traiter'], ['Appel client', 'Suivi réparation — M. Benali', 'Planifié']]
  },
  TECHNICIEN: {
    title: 'Espace technicien',
    subtitle: 'Consultez les appareils confiés et suivez les interventions.',
    stats: [['Interventions', '8'], ['En cours', '3'], ['Terminées cette semaine', '5']],
    section: 'Interventions à suivre',
    rows: [['Imprimante Brother MFC', 'Remplacement du rouleau', 'En cours'], ['Photocopieur Canon', 'Contrôle qualité', 'Prioritaire']]
  },
  RESPONSABLE: {
    title: 'Espace responsable',
    subtitle: 'Gardez une vue claire sur l’équipe et l’activité de l’atelier.',
    stats: [['Réparations actives', '18'], ['Clients', '126'], ['Interventions en retard', '2']],
    section: 'Vue de l’atelier',
    rows: [['Équipe technique', '4 interventions en cours', 'En activité'], ['Stock de pièces', '2 références à surveiller', 'À vérifier']]
  },
  ADMIN: {
    title: 'Espace administrateur',
    subtitle: 'Gérez les comptes et les paramètres de votre atelier.',
    stats: [['Comptes utilisateurs', '12'], ['Rôles actifs', '5'], ['État du système', 'OK']],
    section: 'Administration',
    rows: [['Gestion des comptes', 'Utilisateurs et permissions', 'Disponible'], ['Configuration atelier', 'Préférences de démonstration', 'Disponible']]
  }
};

const DemoRoleDashboard = ({ user, onLogout }) => {
  const content = roleContent[user.role] || roleContent.USER;

  return (
    <main className="demo-dashboard">
      <header className="demo-dashboard-header">
        <BrandLockup className="demo-dashboard-brand" />
        <div className="demo-dashboard-account">
          <span className="demo-dashboard-avatar">{user.prenom?.[0] || 'D'}</span>
          <span className="demo-dashboard-user">{user.prenom} {user.nom}</span>
          <button type="button" onClick={onLogout}>Quitter la démo</button>
        </div>
      </header>

      <section className="demo-dashboard-content">
        <div className="demo-dashboard-intro">
          <span className="demo-dashboard-eyebrow">DÉMONSTRATION · {user.role}</span>
          <h1>{content.title}</h1>
          <p>{content.subtitle}</p>
        </div>

        <div className="demo-dashboard-stats">
          {content.stats.map(([label, value]) => (
            <article className="demo-stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <section className="demo-dashboard-section">
          <div className="demo-section-heading">
            <div><span>APERÇU</span><h2>{content.section}</h2></div>
            <span className="demo-sample-badge">Données d’exemple</span>
          </div>
          <div className="demo-sample-list">
            {content.rows.map(([title, detail, status]) => (
              <article className="demo-sample-row" key={title}>
                <span className="demo-sample-icon" aria-hidden="true">✦</span>
                <div className="demo-sample-copy"><strong>{title}</strong><span>{detail}</span></div>
                <span className="demo-sample-status">{status}</span>
              </article>
            ))}
          </div>
        </section>
        <p className="demo-dashboard-note">Cet espace de démonstration utilise des données locales. Aucune donnée de compte réel n’est consultée ni modifiée.</p>
      </section>
    </main>
  );
};

export default DemoRoleDashboard;
