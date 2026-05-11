// Admin orders page — uses existing GET /orders endpoint
import { useEffect, useState } from "react";
import { getOrders, type Order } from "../../api/services";

const STATUS_BADGE: Record<string, string> = {
  "Hazırlanıyor": "badge-blue",
  "Kargoda": "badge-yellow",
  "Teslim Edildi": "badge-green",
  "Gecikti": "badge-red",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getOrders()
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statuses = ["all", "Hazırlanıyor", "Kargoda", "Teslim Edildi", "Gecikti"];
  const displayed = filter === "all" ? orders : orders.filter((o) => o.durum === filter);
  const totalRevenue = orders.reduce((s, o) => s + (o.toplam_fiyat ?? 0), 0);

  return (
    <div>
      <div className="admin-header">
        <h1>Siparişler</h1>
        <p>Tüm siparişleri görüntüle ve filtrele.</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
        <div className="stat-card">
          <span className="stat-label">Toplam Sipariş</span>
          <span className="stat-value">{orders.length}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Toplam Gelir</span>
          <span className="stat-value" style={{ fontSize: "1.6rem" }}>₺{totalRevenue.toFixed(0)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Geciken</span>
          <span className="stat-value" style={{ color: "var(--red)" }}>
            {orders.filter((o) => o.durum === "Gecikti").length}
          </span>
        </div>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {statuses.map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "Tümü" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: "4rem" }}>
          <span className="loading-spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ürün</th>
                <th>Adet</th>
                <th>Toplam</th>
                <th>Durum</th>
                <th>Kargo No / Müşteri</th>
                <th>Tarih</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((o: Order) => (
                <tr key={o.id}>
                  <td style={{ color: "var(--text-3)" }}>{o.id}</td>
                  <td style={{ color: "var(--text)", fontWeight: 500 }}>{o.urun_adi}</td>
                  <td>{o.adet}</td>
                  <td style={{ color: "var(--accent)" }}>
                    {o.toplam_fiyat != null ? `₺${o.toplam_fiyat.toFixed(2)}` : "—"}
                  </td>
                  <td>
                    <span className={`badge ${STATUS_BADGE[o.durum] ?? "badge-gold"}`}>{o.durum}</span>
                  </td>
                  <td style={{ color: "var(--text-3)", fontSize: "0.82rem" }}>{o.kargo_no ?? "—"}</td>
                  <td style={{ color: "var(--text-3)", fontSize: "0.8rem" }}>
                    {o.siparis_tarihi ? new Date(o.siparis_tarihi).toLocaleDateString("tr-TR") : "—"}
                  </td>
                </tr>
              ))}
              {displayed.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--text-3)", padding: "2rem" }}>Kayıt yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
