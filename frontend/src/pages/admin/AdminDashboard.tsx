// Admin dashboard — aggregates metrics from existing endpoints
import { useEffect, useState } from "react";
import { getProducts, getOrders, getAlerts, type Product, type Order, type AlertsResponse } from "../../api/services";

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getOrders(), getAlerts()])
      .then(([p, o, a]) => { setProducts(p); setOrders(o); setAlerts(a); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const lowStockCount = products.filter((p) => p.stok < 10).length;
  const recentOrders = [...orders]
    .sort((a, b) => (b.siparis_tarihi ?? "").localeCompare(a.siparis_tarihi ?? ""))
    .slice(0, 5);

  const STATUS_BADGE: Record<string, string> = {
    "Hazırlanıyor": "badge-blue", "Kargoda": "badge-yellow",
    "Teslim Edildi": "badge-green", "Gecikti": "badge-red",
  };

  if (loading) return (
    <div className="flex-center" style={{ padding: "4rem" }}>
      <span className="loading-spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div>
      <div className="admin-header">
        <h1>Dashboard</h1>
        <p>Toprak Ana Kadın Kooperatifi — genel bakış</p>
      </div>

      {/* Metric Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Toplam Ürün</span>
          <span className="stat-value">{products.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Düşük Stok</span>
          <span className="stat-value" style={{ color: lowStockCount > 0 ? "var(--red)" : "var(--green)" }}>
            {lowStockCount}
          </span>
          <span className="stat-sub">stok &lt; 10 adet</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Toplam Sipariş</span>
          <span className="stat-value">{orders.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Risk Sayısı</span>
          <span className="stat-value" style={{ color: (alerts?.toplam_risk_sayisi ?? 0) > 0 ? "var(--yellow)" : "var(--green)" }}>
            {alerts?.toplam_risk_sayisi ?? 0}
          </span>
          <span className="stat-sub">uyarı aktif</span>
        </div>
      </div>

      <div className="two-col">
        {/* Recent Orders */}
        <div>
          <h2 className="section-title" style={{ fontSize: "1.1rem" }}>Son Siparişler</h2>
          {recentOrders.length === 0 ? (
            <div className="empty-state" style={{ padding: "1.5rem" }}>Sipariş yok</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Ürün</th><th>Adet</th><th>Durum</th></tr>
                </thead>
                <tbody>
                  {recentOrders.map((o: Order) => (
                    <tr key={o.id}>
                      <td style={{ color: "var(--text-3)" }}>{o.id}</td>
                      <td style={{ color: "var(--text)" }}>{o.urun_adi}</td>
                      <td>{o.adet}</td>
                      <td><span className={`badge ${STATUS_BADGE[o.durum] ?? "badge-gold"}`}>{o.durum}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Alerts summary */}
        <div>
          <h2 className="section-title" style={{ fontSize: "1.1rem" }}>🚨 Aktif Uyarılar</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(alerts?.stok_alarmlari ?? []).map((a, i) => (
              <div key={i} className="alert-item danger">
                <span className="alert-icon">📦</span>
                <span><strong>{a.urun_adi}</strong> — {a.kalan_stok} adet kaldı</span>
              </div>
            ))}
            {(alerts?.kargo_alarmlari ?? []).map((a, i) => (
              <div key={i} className="alert-item warning">
                <span className="alert-icon">🚚</span>
                <span>Sipariş <strong>#{a.siparis_id}</strong> — {a.urun_adi} gecikiyor</span>
              </div>
            ))}
            {(alerts?.toplam_risk_sayisi ?? 0) === 0 && (
              <div className="alert-item" style={{ borderLeft: "3px solid var(--green)" }}>
                <span>✅ Şu an aktif uyarı yok</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
