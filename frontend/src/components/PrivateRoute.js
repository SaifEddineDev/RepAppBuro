import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './PrivateRoute.css';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Afficher un loader pendant le chargement
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, rediriger vers la page de connexion
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Si des rôles sont spécifiés et que l'utilisateur n'a pas le bon rôle
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="unauthorized-container">
        <div className="unauthorized-content">
          <h2>Accès non autorisé</h2>
          <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
          <button onClick={() => window.history.back()}>Retour</button>
        </div>
      </div>
    );
  }

  // Si tout est bon, afficher le composant enfant
  return children;
};

export default PrivateRoute;