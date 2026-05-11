import { NavLink, Outlet, Link } from "react-router-dom";

const links = [
  { to: "/admin", label: "Dashboard", icon: "📊", end: true },
  { to: "/admin/products", label: "Ürünler", icon: "📦", end: false },
  { to: "/admin/orders", label: "Siparişler", icon: "🗂", end: false },
  { to: "/admin/alerts", label: "Uyarılar", icon: "🚨", end: false },
  { to: "/admin/analytics", label: "Analitik", icon: "📈", end: false },
];

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          🌿 Toprak Ana
          <span>Admin Panel</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              <span className="icon">{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ marginTop: "auto", padding: "1rem 1.25rem", borderTop: "1px solid var(--border)" }}>
          <Link to="/" style={{ fontSize: "0.8rem", color: "var(--text-3)" }}>← Müşteri Mağazası</Link>
        </div>
      </aside>
      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  );
}
