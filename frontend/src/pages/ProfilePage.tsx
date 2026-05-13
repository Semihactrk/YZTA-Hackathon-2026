import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getOrders, type Order } from "../api/services";
import { getMyOrderIds } from "./OrdersPage";

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

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
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

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    return (
        <div className="container page" style={{ maxWidth: 800 }}>
            {/* Profil kartı */}
            <div
                className="card"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    marginBottom: "2rem",
                    flexWrap: "wrap",
                }}
            >
                <div
                    style={{
                        width: 64, height: 64, borderRadius: "50%",
                        background: "var(--accent-glow)",
                        border: "2px solid var(--accent)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "1.6rem", flexShrink: 0,
                    }}
                >
                    👤
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "1.15rem", color: "var(--text)", marginBottom: "0.2rem" }}>
                        {user?.name}
                    </div>
                    <div style={{ color: "var(--text-3)", fontSize: "0.88rem" }}>{user?.email}</div>
                </div>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: "0.85rem" }}>
                    Çıkış Yap
                </button>
            </div>

            {/* Siparişlerim */}
            <h2 style={{ fontFamily: "var(--font-head)", fontSize: "1.4rem", marginBottom: "1.25rem", color: "var(--text)" }}>
                📦 Siparişlerim
            </h2>

            {loading ? (
                <div className="flex-center" style={{ padding: "3rem" }}>
                    <span className="loading-spinner" style={{ width: 32, height: 32 }} />
                </div>
            ) : myIds.length === 0 || orders.length === 0 ? (
                <div
                    className="card flex-center"
                    style={{ flexDirection: "column", gap: "1rem", padding: "3rem", textAlign: "center" }}
                >
                    <div style={{ fontSize: "2.5rem" }}>📭</div>
                    <p style={{ color: "var(--text-2)" }}>Henüz siparişiniz yok.</p>
                    <Link to="/" className="btn btn-primary">Alışverişe Başla</Link>
                </div>
            ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    {orders.map((o) => (
                        <div
                            key={o.id}
                            className="card"
                            style={{ display: "flex", alignItems: "center", gap: "1.25rem", flexWrap: "wrap" }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: "50%",
                                background: "var(--bg-3)", border: "1px solid var(--border)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "1.3rem", flexShrink: 0,
                            }}>
                                {STATUS_ICON[o.durum] ?? "📦"}
                            </div>
                            <div style={{ flex: 1, minWidth: 160 }}>
                                <div style={{ fontWeight: 600, color: "var(--text)", marginBottom: "0.2rem" }}>{o.urun_adi}</div>
                                <div style={{ fontSize: "0.82rem", color: "var(--text-3)" }}>
                                    Sipariş #{o.id} &bull; {o.adet} adet
                                    {o.siparis_tarihi && (
                                        <> &bull; {new Date(o.siparis_tarihi).toLocaleDateString("tr-TR")}</>
                                    )}
                                </div>
                            </div>
                            <div style={{ color: "var(--accent)", fontWeight: 700 }}>
                                {o.toplam_fiyat != null ? `₺${o.toplam_fiyat.toFixed(2)}` : "—"}
                            </div>
                            <span className={`badge ${STATUS_BADGE[o.durum] ?? "badge-gold"}`}>{o.durum}</span>
                            {o.kargo_no && (
                                <div style={{ fontSize: "0.78rem", color: "var(--text-3)", minWidth: 80 }}>
                                    🚚 {o.kargo_no}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}