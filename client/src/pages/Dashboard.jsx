import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const PIE_COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#10b981'];

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.fill, fontSize: 13, fontWeight: 600 }}>
          {p.name}: {fmt(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary]   = useState(null);
  const [trends, setTrends]     = useState([]);
  const [cats, setCats]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summRes, trendRes, catRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/trends?period=monthly'),
          api.get('/dashboard/category-totals'),
        ]);
        setSummary(summRes.data);
        setTrends(trendRes.data.trends);
        setCats(catRes.data.categoryTotals);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const barData = trends.map((t) => ({
    name: MONTH_NAMES[(t.period?.month || 1) - 1],
    Income:  t.income  || 0,
    Expense: t.expense || 0,
  }));

  const pieData = cats.slice(0, 8).map((c) => ({
    name: c._id.replace(/_/g, ' '),
    value: Math.round(c.total),
  }));

  if (loading) return (
    <div className="page" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:300 }}>
      <p style={{ color:'var(--text-muted)' }}>Loading dashboard…</p>
    </div>
  );

  return (
    <div className="page animate-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Financial overview for {new Date().getFullYear()}</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {summary && (
        <div className="stat-grid">
          <StatCard
            label="Total Income"
            value={fmt(summary.summary.totalIncome)}
            icon="📈"
            color="var(--green)"
            sub="All recorded income"
          />
          <StatCard
            label="Total Expenses"
            value={fmt(summary.summary.totalExpenses)}
            icon="📉"
            color="var(--red)"
            sub="All recorded expenses"
          />
          <StatCard
            label="Net Balance"
            value={fmt(summary.summary.netBalance)}
            icon="💰"
            color={summary.summary.netBalance >= 0 ? 'var(--green)' : 'var(--red)'}
            sub="Income − Expenses"
          />
          <StatCard
            label="Savings Rate"
            value={`${summary.summary.savingsRate}%`}
            icon="🎯"
            color="var(--accent)"
            sub="Of total income saved"
          />
        </div>
      )}

      <div className="chart-grid">
        <div className="chart-card">
          <div className="chart-card-title">Monthly Income vs Expenses</div>
          {barData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill:'var(--text-muted)', fontSize:11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="Income"  fill="#22c55e" radius={[4,4,0,0]} maxBarSize={28} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4,4,0,0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty"><p>No trend data yet.</p></div>}
        </div>

        <div className="chart-card">
          <div className="chart-card-title">Spending by Category</div>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                  dataKey="value" paddingAngle={3}>
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => fmt(v)} contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11, color:'var(--text-secondary)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty"><p>No category data yet.</p></div>}
        </div>
      </div>

      {summary?.recentActivity?.length > 0 && (
        <div className="card">
          <div style={{ fontWeight:600, marginBottom:14, fontSize:13 }}>Recent Activity</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Title</th><th>Type</th><th>Category</th><th>Amount</th><th>Date</th><th>By</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentActivity.map((tx) => (
                  <tr key={tx._id}>
                    <td>{tx.title}</td>
                    <td>
                      <span className={`badge ${tx.type === 'income' ? 'badge-green' : 'badge-red'}`}>
                        {tx.type}
                      </span>
                    </td>
                    <td style={{ color:'var(--text-secondary)' }}>{tx.category?.replace(/_/g,' ')}</td>
                    <td style={{ fontWeight:600, color: tx.type==='income'?'var(--green)':'var(--red)' }}>
                      {tx.type === 'income' ? '+' : '-'}{fmt(tx.amount)}
                    </td>
                    <td style={{ color:'var(--text-muted)' }}>
                      {new Date(tx.date).toLocaleDateString('en-IN')}
                    </td>
                    <td style={{ color:'var(--text-secondary)' }}>{tx.createdBy?.name || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
