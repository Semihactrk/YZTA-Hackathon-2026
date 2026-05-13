// Müşteri ürün kataloğu
// Düzeltmeler:
//  1. Türkçe arama: toLocaleLowerCase("tr-TR") kullanılıyor (İ→i, Ş→ş vb.)
//  2. Stok sayısı gizlendi — müşteri sadece "Tükendi" / "Mevcut" görür
//  3. Stok=0 ürünlerin kartına tıklanamaz (pointer-events:none + overlay)
//  4. Arama sonuçlarında kooperatifler de listeleniyor
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getProducts, getCooperatives, type Product, type Cooperative } from "../api/services";
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

function ProductThumb({ id, name }: { id: number; name: string }) {
  return (
    <div className="product-thumb" style={{ overflow: "hidden", padding: 0 }}>
      <img
        src={`/urun_foto/${id}.png`}
        alt={name}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
        onError={(e) => {
          const img = e.currentTarget;
          img.style.display = "none";
          const parent = img.parentElement!;
          parent.style.fontSize = "3.5rem";
          parent.style.display = "flex";
          parent.style.alignItems = "center";
          parent.style.justifyContent = "center";
          parent.textContent = productEmoji(name);
        }}
      />
    </div>
  );
}

export default function StorePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cooperatives, setCooperatives] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { add } = useCart();

  useEffect(() => {
    Promise.all([getProducts(), getCooperatives()])
      .then(([prods, coops]) => {
        setProducts(prods);
        setCooperatives(coops);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const q = trLower(search);

  // Türkçe büyük/küçük harf duyarlı arama
  const filteredProducts = products.filter((p) =>
    trLower(p.isim).includes(q) ||
    trLower(p.kooperatif_isim ?? "").includes(q)
  );

  // Kooperatif araması — sadece arama kutusu doluyken göster
  const filteredCoops = search.trim()
    ? cooperatives.filter((c) =>
      trLower(c.isim).includes(q) ||
      trLower(c.lokasyon).includes(q) ||
      trLower(c.hikaye).includes(q)
    )
    : [];

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
        ) : (
          <>
            {/* ── Kooperatif Sonuçları ─────────────────────────────── */}
            {filteredCoops.length > 0 && (
              <div style={{ marginBottom: "2rem" }}>
                <h2 style={{
                  fontSize: "1.15rem",
                  fontWeight: 700,
                  marginBottom: "1rem",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}>
                  🏘️ Kooperatifler
                </h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                  gap: "1rem",
                }}>
                  {filteredCoops.map((c) => (
                    <div
                      key={c.id}
                      className="glass-card"
                      style={{
                        padding: "1.25rem",
                        borderRadius: "var(--radius)",
                        background: "var(--card)",
                        border: "1px solid var(--border)",
                        transition: "transform 0.2s, box-shadow 0.2s",
                        cursor: "default",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                      }}
                    >
                      <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏡</div>
                      <div style={{ fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.25rem" }}>
                        {c.isim}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "0.5rem" }}>
                        📍 {c.lokasyon}
                      </div>
                      <div style={{
                        fontSize: "0.85rem",
                        lineHeight: 1.5,
                        color: "var(--text-secondary, #b0b0b0)",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}>
                        {c.hikaye}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Ürün Sonuçları ───────────────────────────────────── */}
            {filteredProducts.length === 0 && filteredCoops.length === 0 ? (
              <div className="empty-state">Sonuç bulunamadı.</div>
            ) : (
              <>
                {search.trim() && filteredProducts.length > 0 && (
                  <h2 style={{
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    marginBottom: "1rem",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}>
                    🛒 Ürünler
                  </h2>
                )}
                <div className="product-grid">
                  {filteredProducts.map((p) => {
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
                            <ProductThumb id={p.id} name={p.isim} />
                            <div className="product-info">
                              <div className="product-name">{p.isim}</div>
                              {p.kooperatif_isim && <div className="product-coop">📍 {p.kooperatif_isim}</div>}
                              <div className="product-price">₺{p.birim_fiyat.toFixed(2)}</div>
                            </div>
                          </>
                        ) : (
                          <Link to={`/products/${p.id}`} style={{ display: "contents", color: "inherit" }}>
                            <ProductThumb id={p.id} name={p.isim} />
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
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}