// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ScanPage from './pages/ScanPage';
import GenerateQrPage from './pages/GenerateQrPage';

const PrivateRoute = ({ children, requiredRole }) => {
  const isAuthenticated = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && requiredRole !== userRole) {
    // You could show a 403 or redirect to a more appropriate page
    return <Navigate to="/scan" replace />; 
  }

  return children;
};

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/scan" element={
          <PrivateRoute requiredRole="student">
            <ScanPage />
          </PrivateRoute>
        } />

        <Route path="/generate-qr" element={
          <PrivateRoute requiredRole="admin">
            <GenerateQrPage />
          </PrivateRoute>
        } />
        
        {/* Redirect from root to login page */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;