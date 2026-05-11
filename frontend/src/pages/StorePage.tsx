// Müşteri ürün kataloğu
// Düzeltmeler:
//  1. Türkçe arama: toLocaleLowerCase("tr-TR") kullanılıyor (İ→i, Ş→ş vb.)
//  2. Stok sayısı gizlendi — müşteri sadece "Tükendi" / "Mevcut" görür
//  3. Stok=0 ürünlerin kartına tıklanamaz (pointer-events:none + overlay)
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, type Product } from "../api/services";
import { useCart } from "../context/CartContext";

const EMOJI_MAP: Record<string, string> = {
  sabun: "🧼", şal: "🧣", zahter: "🌿", kekik: "🌿",
  peynir: "🧀", baharat: "🫙", çanta: "👜",
  biber: "🌶", nar: "🍇", zeytin: "🫒", zeytinyağı: "🫒",
  salça: "🥫", yoğurt: "🥛", ceviz: "🌰", kabak: "🥧",
  reçel: "🍯", şurup: "🍶", künefe: "🧀", ipek: "🧣",
  sabunu: "🧼", zeytini: "🫒",
};

// Türkçe karakterlere duyarlı küçük harf dönüşümü
const trLower = (s: string) => s.toLocaleLowerCase("tr-TR");

function productEmoji(name: string): string {
  const lower = trLower(name);
  for (const [key, emoji] of Object.entries(EMOJI_MAP)) {
    if (lower.includes(trLower(key))) return emoji;
  }
  return "🌾";
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { add } = useCart();

  useEffect(() => {
    getProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Türkçe büyük/küçük harf duyarlı arama
  const filtered = products.filter((p) => {
    const q = trLower(search);
    return (
      trLower(p.isim).includes(q) ||
      trLower(p.kooperatif_isim ?? "").includes(q)
    );
  });

  return (
    <div>
      <div className="hero">
        <h1>Anadolu'nun <span>En Güzel</span><br />Lezzetleri Burada</h1>
        <p>Hatay'ın bereketli topraklarından gelen el emeği ürünler, doğrudan üretici kadınlardan.</p>
        <div style={{ marginTop: "1.5rem", maxWidth: 400, marginInline: "auto" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Ürün veya kooperatif ara…"
            style={{ width: "100%", fontSize: "0.95rem", padding: "0.7rem 1rem" }}
          />
        </div>
      </div>

      <div className="container" style={{ paddingBottom: "3rem" }}>
        {loading ? (
          <div className="flex-center" style={{ padding: "4rem" }}>
            <span className="loading-spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">Ürün bulunamadı.</div>
        ) : (
          <div className="product-grid">
            {filtered.map((p) => {
              const outOfStock = p.stok === 0;
              return (
                <div
                  key={p.id}
                  className="product-card"
                  style={{ opacity: outOfStock ? 0.55 : 1, position: "relative" }}
                >
                  {/* Tıklanabilir alan — stok 0 ise devre dışı */}
                  {outOfStock ? (
                    // Stok 0: Link yok, sadece görsel
                    <>
                      <div className="product-thumb">{productEmoji(p.isim)}</div>
                      <div className="product-info">
                        <div className="product-name">{p.isim}</div>
                        {p.kooperatif_isim && <div className="product-coop">📍 {p.kooperatif_isim}</div>}
                        <div className="product-price">₺{p.birim_fiyat.toFixed(2)}</div>
                      </div>
                    </>
                  ) : (
                    <Link to={`/products/${p.id}`} style={{ display: "contents", color: "inherit" }}>
                      <div className="product-thumb">{productEmoji(p.isim)}</div>
                      <div className="product-info">
                        <div className="product-name">{p.isim}</div>
                        {p.kooperatif_isim && <div className="product-coop">📍 {p.kooperatif_isim}</div>}
                        <div className="product-price">₺{p.birim_fiyat.toFixed(2)}</div>
                      </div>
                    </Link>
                  )}

                  {/* Sepet butonu */}
                  <div className="product-actions">
                    <button
                      className="btn btn-primary"
                      style={{ width: "100%" }}
                      onClick={() => add(p)}
                      disabled={outOfStock}
                    >
                      {outOfStock ? "Tükendi" : "+ Sepete Ekle"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
