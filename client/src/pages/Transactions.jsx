import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'salary','freelance','investment','rental','other_income',
  'food','transport','utilities','healthcare','entertainment','shopping','education','rent','other_expense',
];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

function TransactionModal({ tx, onClose, onSaved }) {
  const { user } = useAuth();
  const isEdit = !!tx?._id;
  const [form, setForm] = useState({
    title: tx?.title || '',
    amount: tx?.amount || '',
    type: tx?.type || 'income',
    category: tx?.category || 'salary',
    date: tx?.date ? tx.date.slice(0, 10) : new Date().toISOString().slice(0, 10),
    notes: tx?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit) {
        await api.patch(`/transactions/${tx._id}`, form);
      } else {
        await api.post('/transactions', form);
      }
      onSaved();
    } catch (err) {
      const errs = err.response?.data?.errors;
      setError(errs ? errs.map((e) => e.message).join(', ') : err.response?.data?.message || 'Error saving transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Transaction' : 'New Transaction'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input id="tx-title" className="form-input" value={form.title} onChange={(e) => set('title', e.target.value)} required maxLength={100} placeholder="e.g. Monthly Salary" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Amount (₹)</label>
              <input id="tx-amount" type="number" min="0.01" step="0.01" className="form-input" value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input id="tx-date" type="date" className="form-input" value={form.date} onChange={(e) => set('date', e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} style={{ cursor: 'pointer' }} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Type</label>
              <select id="tx-type" className="form-select" value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select id="tx-category" className="form-select" value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea id="tx-notes" className="form-textarea" value={form.notes} onChange={(e) => set('notes', e.target.value)} maxLength={500} placeholder="Optional description…" />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { isAnalyst, isAdmin } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ type: '', category: '', startDate: '', endDate: '' });
  const [modal, setModal] = useState(null); // null | 'create' | transaction object

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) };
      const { data } = await api.get('/transactions', { params });
      setTransactions(data.transactions);
      setTotal(data.total);
      setPages(data.pages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions.');
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleDelete = async (id) => {
    if (!window.confirm('Soft-delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed.');
    }
  };

  const setFilter = (k, v) => { setFilters((f) => ({ ...f, [k]: v })); setPage(1); };

  return (
    <div className="page animate-in">
      {modal && (
        <TransactionModal
          tx={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetch(); }}
        />
      )}

      <div className="page-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1>Transactions</h1>
          <p>{total} total records</p>
        </div>
        {isAdmin && (
          <button id="btn-new-tx" className="btn btn-primary" onClick={() => setModal('create')}>
            + New Transaction
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="toolbar">
        <select className="form-select" style={{ width:130 }} value={filters.type} onChange={(e) => setFilter('type', e.target.value)}>
          <option value="">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="form-select" style={{ width:160 }} value={filters.category} onChange={(e) => setFilter('category', e.target.value)}>
          <option value="">All Categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g,' ')}</option>)}
        </select>
        <input type="date" className="form-input" style={{ width:145, cursor: 'pointer' }} value={filters.startDate} onChange={(e) => setFilter('startDate', e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
        <input type="date" className="form-input" style={{ width:145, cursor: 'pointer' }} value={filters.endDate} onChange={(e) => setFilter('endDate', e.target.value)} onClick={(e) => e.target.showPicker && e.target.showPicker()} />
        {(filters.type || filters.category || filters.startDate || filters.endDate) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({ type:'', category:'', startDate:'', endDate:'' }); setPage(1); }}>
            Clear filters
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        {loading ? (
          <div className="empty"><p style={{ color:'var(--text-muted)' }}>Loading…</p></div>
        ) : transactions.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">💳</div>
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th><th>Type</th><th>Category</th>
                  <th>Amount</th><th>Date</th><th>Created By</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx._id}>
                    <td style={{ fontWeight:500 }}>{tx.title}</td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ color:'var(--text-secondary)' }}>{tx.category?.replace(/_/g,' ')}</td>
                    <td style={{ fontWeight:600, color: tx.type==='income'?'var(--green)':'var(--red)' }}>
                      {tx.type==='income'?'+':'-'}{fmt(tx.amount)}
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>
                      {new Date(tx.date).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ color:'var(--text-secondary)' }}>{tx.createdBy?.name || '—'}</td>
                    {isAdmin && (
                      <td>
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(tx)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(tx._id)}>Del</button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
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
