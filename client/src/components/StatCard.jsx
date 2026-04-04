export default function StatCard({ label, value, sub, icon, color = 'var(--accent)', iconBg }) {
  return (
    <div className="stat-card animate-in">
      <div
        className="stat-card-icon"
        style={{ background: iconBg || color + '22', fontSize: 20 }}
      >
        {icon}
      </div>
      <div className="stat-card-label">{label}</div>
      <div className="stat-card-value" style={{ color }}>{value}</div>
      {sub && <div className="stat-card-sub">{sub}</div>}
    </div>
  );
}
