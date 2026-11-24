import React from 'react';
import './DashboardOverview.css';

const DashboardOverview = ({ roleLabel, description, metrics, links, onNavigate }) => (
  <section className="role-overview" aria-labelledby="role-overview-title">
    <div className="role-overview-heading">
      <span>{roleLabel}</span>
      <h2 id="role-overview-title">Vue d’ensemble</h2>
      <p>{description}</p>
    </div>
    <div className="role-overview-metrics">
      {metrics.map((metric) => (
        <article className="role-overview-metric" key={metric.label}>
          <span>{metric.label}</span>
          <strong>{metric.value}</strong>
          {metric.detail && <small>{metric.detail}</small>}
        </article>
      ))}
    </div>
    <div className="role-overview-links">
      <h3>Accès rapides</h3>
      <div>
        {links.map((link) => (
          <button type="button" key={link.id} onClick={() => onNavigate(link.id)}>
            <span>{link.label}</span>
            <span aria-hidden="true">›</span>
          </button>
        ))}
      </div>
    </div>
  </section>
);

export default DashboardOverview;
