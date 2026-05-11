// Sepet drawer — sadece ürün listesi + özet + checkout sayfasına yönlendirme
import { useNavigate } from "react-router-dom";
import { useCart, type CartItem } from "../context/CartContext";

const EMOJI_MAP: Record<string, string> = {
  sabun: "🧼", şal: "🧣", zahter: "🌿", kekik: "🌿",
  peynir: "🧀", baharat: "🫙", çanta: "👜",
  biber: "🌶", nar: "🍇", zeytin: "🫒", zeytinyağı: "🫒",
  salça: "🥫", yoğurt: "🥛", ceviz: "🌰", kabak: "🥧",
  reçel: "🍯", şurup: "🍶", künefe: "🧀", ipek: "🧣",
  sabunu: "🧼", zeytini: "🫒",
};

const trLower = (s: string) => s.toLocaleLowerCase("tr-TR");

function productEmoji(name: string): string {
  const lower = trLower(name);
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(trLower(key))) return emoji;
  }
  return "🌾";
}

interface CartDrawerProps {
  onClose: () => void;
}

export default function CartDrawer({ onClose }: CartDrawerProps) {
  const { items, remove, setQty, total } = useCart();
  const navigate = useNavigate();

  const goToCheckout = () => {
    onClose();
    navigate("/checkout");
  };

  return (
    <>
      <div className="overlay-bg" onClick={onClose} />
      <div className="cart-drawer">
        {/* Header */}
        <div className="cart-drawer-header">
          <span style={{ fontWeight: 600, fontFamily: "var(--font-head)" }}>🛒 Sepetim</span>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", color: "var(--text-2)", fontSize: "1.2rem", cursor: "pointer" }}
          >✕</button>
        </div>

        {/* Body */}
        <div className="cart-drawer-body">
          {items.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: "2.5rem" }}>🧺</div>
              <p style={{ marginTop: "0.75rem" }}>Sepetiniz boş</p>
            </div>
          ) : (
            items.map((item: CartItem) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-thumb">{productEmoji(item.isim)}</div>
                <div className="cart-item-info">
                  <div className="cart-item-name">{item.isim}</div>
                  <div className="cart-item-price">
                    ₺{item.birim_fiyat.toFixed(2)} × {item.qty}
                    &nbsp;=&nbsp;
                    <span style={{ color: "var(--accent)", fontWeight: 600 }}>
                      ₺{(item.birim_fiyat * item.qty).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <button className="cart-qty-btn" onClick={() => setQty(item.id, item.qty - 1)}>−</button>
                  <span style={{ minWidth: 20, textAlign: "center", fontSize: "0.87rem" }}>{item.qty}</span>
                  <button className="cart-qty-btn" onClick={() => setQty(item.id, item.qty + 1)}>+</button>
                  <button className="cart-qty-btn" onClick={() => remove(item.id)} style={{ marginLeft: 4 }}>🗑</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="cart-drawer-footer">
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
              <span className="cart-total">Toplam</span>
              <span className="cart-total" style={{ color: "var(--accent)" }}>₺{total.toFixed(2)}</span>
            </div>
            <button className="btn btn-primary" style={{ width: "100%" }} onClick={goToCheckout}>
              Siparişi Tamamla →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
