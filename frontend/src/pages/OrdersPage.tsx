// Müşteri sipariş sayfası — giriş yapılmış kullanıcının siparişleri gösterilir.
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getOrders, type Order } from "../api/services";
import { useAuth } from "../context/AuthContext";

const STATUS_BADGE: Record<string, string> = {
  "Hazırlanıyor": "badge-blue",
  "Kargoda": "badge-yellow",
  "Teslim Edildi": "badge-green",
  "Gecikti": "badge-red",
};

const STATUS_ICON: Record<string, string> = {
  "Hazırlanıyor": "⏳",
  "Kargoda": "🚚",
  "Teslim Edildi": "✅",
  "Gecikti": "⚠️",
};

function orderKey(userId?: number) {
  return userId ? `orders_user_${userId}` : "my_order_ids";
}

/** Kullanıcıya ait sipariş ID'lerini localStorage'dan oku */
export function getMyOrderIds(userId?: number): number[] {
  try {
    return JSON.parse(localStorage.getItem(orderKey(userId)) ?? "[]");
  } catch {
    return [];
  }
}

/** Yeni sipariş ID'lerini kullanıcıya ait anahtara ekle */
export function saveMyOrderIds(ids: number[], userId?: number) {
  const existing = getMyOrderIds(userId);
  const merged = Array.from(new Set([...existing, ...ids]));
  localStorage.setItem(orderKey(userId), JSON.stringify(merged));
}

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const myIds = getMyOrderIds(user?.id);

  useEffect(() => {
    if (myIds.length === 0) {
      setLoading(false);
      return;
    }
    getOrders()
      .then((all) => setOrders(all.filter((o) => myIds.includes(o.id))))
      .catch(console.error)
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <p className="section-sub">Verdiğiniz siparişlerin durumunu buradan takip edebilirsiniz.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {orders.map((o: Order) => (
          <div key={o.id} className="card" style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}>
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "var(--bg-3)",
              border: "1px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1.4rem", flexShrink: 0,
            }}>
              {STATUS_ICON[o.durum] ?? "📦"}
            </div>

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

            <div style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1.05rem" }}>
              {o.toplam_fiyat != null ? `₺${o.toplam_fiyat.toFixed(2)}` : "—"}
            </div>

            <span className={`badge ${STATUS_BADGE[o.durum] ?? "badge-gold"}`}>
              {o.durum}
            </span>

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