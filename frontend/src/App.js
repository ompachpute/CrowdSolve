import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AppNavbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';
import Login from './pages/Login';
import Register from './pages/Register';
import CitizenDashboard from './pages/CitizenDashboard';
import TeamDashboard from './pages/TeamDashboard';
import IndustryDashboard from './pages/IndustryDashboard';
import GovernmentDashboard from './pages/GovernmentDashboard';

const App = () => {
  const { isAuthenticated, user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getDefaultRoute = () => {
    if (!isAuthenticated) return '/login';
    switch (user?.role) {
      case 'CITIZEN':
        return '/citizen';
      case 'TEAM':
        return '/team';
      case 'INDUSTRY_NGO':
        return '/industry';
      case 'GOVERNMENT':
        return '/government';
      default:
        return '/login';
    }
  };

  return (
    <div className="App">
      <AppNavbar toggleTheme={toggleTheme} currentTheme={theme} />
      <div className="main-content">
        <Routes>
          <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} replace /> : <Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/citizen" element={
            <ProtectedRoute allowedRoles={['CITIZEN']}>
              <CitizenDashboard />
            </ProtectedRoute>
          } />
          <Route path="/team" element={
            <ProtectedRoute allowedRoles={['TEAM']}>
              <TeamDashboard />
            </ProtectedRoute>
          } />
          <Route path="/industry" element={
            <ProtectedRoute allowedRoles={['INDUSTRY_NGO']}>
              <IndustryDashboard />
            </ProtectedRoute>
          } />
          <Route path="/government" element={
            <ProtectedRoute allowedRoles={['GOVERNMENT']}>
              <GovernmentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default App;
