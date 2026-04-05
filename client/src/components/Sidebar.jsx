import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavItem = ({ to, icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
  >
    <span>{icon}</span>
    {label}
  </NavLink>
);

export default function Sidebar({ className = '' }) {
  const { user, logout, isAdmin, isAnalyst } = useAuth();

  const initials = user?.name
    ?.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2) || '?';

  const roleBadgeColor = {
    admin: 'var(--accent)',
    analyst: 'var(--amber)',
    viewer: 'var(--text-muted)',
  }[user?.role] || 'var(--text-muted)';

  return (
    <aside className={`sidebar ${className}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">Z</div>
        <div className="sidebar-logo-text">Zorv<span>yn</span></div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Overview</div>
        <NavItem to="/dashboard" icon="📊" label="Dashboard" />

        {isAnalyst && (
          <>
            <div className="nav-section-label">Finance</div>
            <NavItem to="/transactions" icon="💳" label="Transactions" />
          </>
        )}

        {isAdmin && (
          <>
            <div className="nav-section-label">Admin</div>
            <NavItem to="/users" icon="👥" label="Users" />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name}</div>
            <div className="sidebar-user-role" style={{ color: roleBadgeColor }}>
              {user?.role}
            </div>
          </div>
        </div>
        <button className="logout-btn" onClick={logout}>
          <span>↩</span> Logout
        </button>
      </div>
    </aside>
  );
}
