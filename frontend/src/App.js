import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ClientManagement from './pages/ClientManagement';
import ReparationManagement from './pages/ReparationManagement';
import PieceManagement from './pages/PieceManagement';
import Register from './pages/register';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/clients" element={
            <PrivateRoute>
              <ClientManagement />
            </PrivateRoute>
          } />
          <Route path="/reparations" element={
            <PrivateRoute>
              <ReparationManagement />
            </PrivateRoute>
          } />
          <Route path="/pieces" element={
            <PrivateRoute>
              <PieceManagement />
            </PrivateRoute>
          } />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
