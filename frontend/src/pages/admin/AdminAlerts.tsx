// Admin alerts page — uses existing GET /alerts endpoint
import { useEffect, useState } from "react";
import { getAlerts, type AlertsResponse } from "../../api/services";

export default function AdminAlerts() {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAlerts()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const refresh = () => {
    setLoading(true);
    getAlerts().then(setData).catch(console.error).finally(() => setLoading(false));
  };

  return (
    <div>
      <div className="admin-header" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <h1>🚨 Sistem Uyarıları</h1>
          <p>Kritik stok ve geciken sipariş uyarıları — mevcut <code>/alerts</code> endpoint'inden.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={refresh}>↻ Yenile</button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: "4rem" }}>
          <span className="loading-spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : (
        <>
          {/* Risk summary card */}
          <div className="stat-card" style={{ marginBottom: "2rem", maxWidth: 280 }}>
            <span className="stat-label">Toplam Risk Sayısı</span>
            <span className="stat-value" style={{ color: (data?.toplam_risk_sayisi ?? 0) > 0 ? "var(--red)" : "var(--green)" }}>
              {data?.toplam_risk_sayisi ?? 0}
            </span>
          </div>

          {/* Stock alerts */}
          <h2 className="section-title" style={{ fontSize: "1.1rem" }}>📦 Kritik Stok Uyarıları</h2>
          {(data?.stok_alarmlari ?? []).length === 0 ? (
            <div className="alert-item" style={{ borderLeft: "3px solid var(--green)", marginBottom: "1.5rem" }}>
              ✅ Kritik stoklu ürün yok
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginBottom: "1.5rem" }}>
              {data!.stok_alarmlari.map((a, i) => (
                <div key={i} className="alert-item danger">
                  <span className="alert-icon">🔴</span>
                  <div>
                    <strong style={{ color: "var(--text)" }}>{a.urun_adi}</strong>
                    <span style={{ color: "var(--red)", marginLeft: "0.5rem" }}>— {a.kalan_stok} adet kaldı</span>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginTop: "0.15rem" }}>
                      KOOP10 kupon kodu ile müşteri bilgilendirmesi yapılabilir.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cargo / delayed alerts */}
          <h2 className="section-title" style={{ fontSize: "1.1rem" }}>🚚 Geciken Kargo Uyarıları</h2>
          {(data?.kargo_alarmlari ?? []).length === 0 ? (
            <div className="alert-item" style={{ borderLeft: "3px solid var(--green)" }}>
              ✅ Geciken sipariş yok
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {data!.kargo_alarmlari.map((a, i) => (
                <div key={i} className="alert-item warning">
                  <span className="alert-icon">🟡</span>
                  <div>
                    <strong style={{ color: "var(--text)" }}>Sipariş #{a.siparis_id}</strong>
                    <span style={{ color: "var(--yellow)", marginLeft: "0.5rem" }}>— {a.urun_adi} gecikiyor</span>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-3)", marginTop: "0.15rem" }}>
                      AI ajanı otomatik olarak özür mesajı ve <strong>KOOP10</strong> kupon kodu oluşturdu.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
