// Müşteri sipariş sayfası — sadece BU cihazda verilen siparişler gösterilir.
// ID'ler checkout sonrasında localStorage'a kaydedilir.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders, type Order } from "../api/services";

const STATUS_BADGE: Record<string, string> = {
  "Hazırlanıyor": "badge-blue",
  "Kargoda":      "badge-yellow",
  "Teslim Edildi":"badge-green",
  "Gecikti":      "badge-red",
};

const STATUS_ICON: Record<string, string> = {
  "Hazırlanıyor": "⏳",
  "Kargoda":      "🚚",
  "Teslim Edildi":"✅",
  "Gecikti":      "⚠️",
};

/** localStorage'dan bu cihaza ait sipariş ID'lerini oku */
export function getMyOrderIds(): number[] {
  try {
    return JSON.parse(localStorage.getItem("my_order_ids") ?? "[]");
  } catch {
    return [];
  }
}

/** Yeni sipariş ID'lerini localStorage'a ekle */
export function saveMyOrderIds(ids: number[]) {
  const existing = getMyOrderIds();
  const merged = Array.from(new Set([...existing, ...ids]));
  localStorage.setItem("my_order_ids", JSON.stringify(merged));
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const myIds = getMyOrderIds();

  useEffect(() => {
    if (myIds.length === 0) {
      setLoading(false);
      return;
    }
    getOrders()
      .then((all) => setOrders(all.filter((o) => myIds.includes(o.id))))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex-center" style={{ padding: "4rem" }}>
        <span className="loading-spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  if (myIds.length === 0 || orders.length === 0) {
    return (
      <div className="container page flex-center" style={{ flexDirection: "column", gap: "1rem", minHeight: "60vh" }}>
        <div style={{ fontSize: "3rem" }}>📭</div>
        <p style={{ color: "var(--text-2)" }}>Henüz siparişiniz bulunmuyor.</p>
        <Link to="/" className="btn btn-primary">Alışverişe Başla</Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="section-title">📦 Siparişlerim</h1>
      <p className="section-sub">Bu cihazdan verdiğiniz siparişlerin durumunu buradan takip edebilirsiniz.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {orders.map((o: Order) => (
          <div key={o.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            {/* Durum ikonu */}
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", flexShrink: 0,
            }}>
              {STATUS_ICON[o.durum] ?? "📦"}
            </div>

            {/* Bilgiler */}
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.2rem" }}>
                {o.urun_adi}
              </div>
              <div style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>
                Sipariş #{o.id} &bull; {o.adet} adet
                {o.siparis_tarihi && (
                  <> &bull; {new Date(o.siparis_tarihi).toLocaleDateString("tr-TR")}</>
                )}
              </div>
            </div>

            {/* Fiyat */}
            <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.05rem" }}>
              {o.toplam_fiyat != null ? `₺${o.toplam_fiyat.toFixed(2)}` : "—"}
            </div>

            {/* Durum badge */}
            <span className={`badge ${STATUS_BADGE[o.durum] ?? "badge-gold"}`}>
              {o.durum}
            </span>

            {/* Kargo no */}
            {o.kargo_no && (
              <div style={{ fontSize: "0.78rem", color: "var(--text-3)", minWidth: 80 }}>
                🚚 {o.kargo_no}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
