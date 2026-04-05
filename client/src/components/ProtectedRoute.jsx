import { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="layout">
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)} />
      )}
      <Sidebar className={mobileOpen ? 'mobile-open' : ''} />
      <div className="main-content">
        <div className="topbar-mobile">
          <div className="sidebar-logo-text" style={{ fontSize: '18px' }}>Zorv<span style={{ color: 'var(--accent)' }}>yn</span></div>
          <button className="hamburger-btn" onClick={() => setMobileOpen(true)}>☰</button>
        </div>
        {children}
      </div>
    </div>
  );
}
