// src/components/Navbar.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/login');
  };

  return (
    <nav style={{ padding: '10px 20px', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {userRole === 'student' && (
          <>
            <Link to="/scan" style={{ color: '#fff', textDecoration: 'none' }}>Scan QR</Link>
            <Link to="/history" style={{ color: '#fff', textDecoration: 'none' }}>My History</Link>
          </>
        )}
        {(userRole === 'admin' || userRole === 'staff') && (
          <>
            <Link to="/reports" style={{ color: '#fff', textDecoration: 'none' }}>Reports</Link>
            <Link to="/generate-qr" style={{ color: '#fff', textDecoration: 'none' }}>Generate QR</Link>
          </>
        )}
      </div>
      <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #fff', color: '#fff', padding: '8px 12px', cursor: 'pointer', borderRadius: '4px' }}>
        Logout
      </button>
    </nav>
  );
};

export default Navbar;