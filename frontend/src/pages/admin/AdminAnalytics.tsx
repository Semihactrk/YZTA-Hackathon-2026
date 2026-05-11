// Admin analytics page — uses existing /analytics/top-selling and /analytics/stock-predictions
import { useEffect, useState } from "react";
import { getTopSelling, getStockPredictions, type TopSeller, type StockPrediction } from "../../api/services";

export default function AdminAnalytics() {
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [predictions, setPredictions] = useState<StockPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTopSelling(), getStockPredictions()])
      .then(([ts, sp]) => {
        // top-selling might return an object on empty DB
        setTopSellers(Array.isArray(ts) ? ts : []);
        setPredictions(Array.isArray(sp) ? sp : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex-center" style={{ padding: "4rem" }}>
      <span className="loading-spinner" style={{ width: 36, height: 36 }} />
    </div>
  );

  return (
    <div>
      <div className="admin-header">
        <h1>📈 Analitik</h1>
        <p>Satış verileri ve stok tahmin raporları.</p>
      </div>

      {/* Top sellers */}
      <h2 className="section-title" style={{ fontSize: "1.1rem" }}>🏆 En Çok Satanlar (Top 5)</h2>
      {topSellers.length === 0 ? (
        <div className="empty-state" style={{ padding: "1.5rem" }}>Henüz yeterli veri yok.</div>
      ) : (
        <div className="table-wrap" style={{ marginBottom: "2rem" }}>
          <table>
            <thead>
              <tr><th>Ürün</th><th>Toplam Satış</th><th>Mevcut Stok</th></tr>
            </thead>
            <tbody>
              {topSellers.map((t: TopSeller, i: number) => (
                <tr key={i}>
                  <td style={{ color: "var(--text)", fontWeight: 500 }}>
                    {i === 0 ? "🥇 " : i === 1 ? "🥈 " : i === 2 ? "🥉 " : `${i + 1}. `}
                    {t.urun_adi}
                  </td>
                  <td style={{ color: "var(--accent)", fontWeight: 600 }}>{t.toplam_satis} adet</td>
                  <td>
                    {t.mevcut_stok < 10 ? (
                      <span className="badge badge-red">⚠ {t.mevcut_stok}</span>
                    ) : (
                      <span className="badge badge-green">{t.mevcut_stok}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stock predictions */}
      <h2 className="section-title" style={{ fontSize: "1.1rem" }}>🔮 Stok Bitiş Tahminleri</h2>
      <p style={{ color: "var(--text-2)", fontSize: "0.85rem", marginBottom: "1rem" }}>
        Son 30 günlük satış hızına göre hesaplandı.
      </p>
      {predictions.length === 0 ? (
        <div className="empty-state" style={{ padding: "1.5rem" }}>Henüz yeterli veri yok.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Ürün</th>
                <th>Mevcut Stok</th>
                <th>Günlük Satış Hızı</th>
                <th>Kalan Gün Tahmini</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p: StockPrediction, i: number) => (
                <tr key={i}>
                  <td style={{ color: "var(--text)", fontWeight: 500 }}>{p.urun_adi}</td>
                  <td>{p.mevcut_stok}</td>
                  <td style={{ color: "var(--text-2)" }}>{p.gunluk_satis_hizi} adet/gün</td>
                  <td style={{ fontWeight: 600, color: p.kalan_gun_tahmini <= 7 ? "var(--red)" : "var(--text)" }}>
                    {p.kalan_gun_tahmini} gün
                  </td>
                  <td>
                    {p.durum.includes("Kritik") ? (
                      <span className="badge badge-red">🚨 {p.durum}</span>
                    ) : (
                      <span className="badge badge-green">{p.durum}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
