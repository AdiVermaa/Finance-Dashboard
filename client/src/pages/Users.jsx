import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

function EditUserModal({ user: targetUser, onClose, onSaved }) {
  const { user: me } = useAuth();
  const [form, setForm] = useState({ name: targetUser.name, role: targetUser.role, status: targetUser.status });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.patch(`/users/${targetUser._id}`, form);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>Edit User</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Name</label>
            <input id="u-name" className="form-input" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <select id="u-role" className="form-select" value={form.role} onChange={(e) => setForm({...form, role: e.target.value})} disabled={targetUser._id === me._id}>
                <option value="viewer">Viewer</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
              </select>
              {targetUser._id === me._id && <div className="form-error">Cannot change your own role.</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select id="u-status" className="form-select" value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ROLE_BADGE = { admin: 'badge-blue', analyst: 'badge-amber', viewer: 'badge-muted' };

export default function Users() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [filters, setFilters] = useState({ role: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editTarget, setEditTarget] = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const { data } = await api.get('/users', { params });
      setUsers(data.users);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  return (
    <div className="page animate-in">
      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); fetch(); }}
        />
      )}

      <div className="page-header">
        <h1>User Management</h1>
        <p>{total} total users — admin access only</p>
      </div>

      <div className="toolbar">
        <select className="form-select" style={{ width:140 }} value={filters.role} onChange={(e) => setFilter('role', e.target.value)}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="analyst">Analyst</option>
          <option value="viewer">Viewer</option>
        </select>
        <select className="form-select" style={{ width:140 }} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(filters.role || filters.status) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ role:'', status:'' }); setPage(1); }}>Clear</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="empty"><p style={{ color:'var(--text-muted)' }}>Loading…</p></div>
        ) : users.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">👥</div>
            <p>No users found.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th><th>Last Login</th><th>Joined</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td style={{ fontWeight:500 }}>
                      {u.name} {u._id === me._id && <span style={{ fontSize:10, color:'var(--accent)', fontWeight:700 }}>(you)</span>}
                    </td>
                    <td style={{ color:'var(--text-secondary)' }}>{u.email}</td>
                    <td><span className={`badge ${ROLE_BADGE[u.role]}`}>{u.role}</span></td>
                    <td>
                      <span className={`badge ${u.status === 'active' ? 'badge-green' : 'badge-muted'}`}>
                        {u.status}
                      </span>
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditTarget(u)}>Edit</button>
                        {u._id !== me._id && (
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u._id, u.name)}>Delete</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {pages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost btn-sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
          <span>Page {page} of {pages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
