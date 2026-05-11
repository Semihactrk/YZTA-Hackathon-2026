// Product detail page — calls GET /products/:id
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getProduct, type Product } from "../api/services";
import { useCart } from "../context/CartContext";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const { add } = useCart();

  useEffect(() => {
    if (!id) return;
    getProduct(Number(id))
      .then(setProduct)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = () => {
    if (!product) return;
    add(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) return (
    <div className="flex-center" style={{ minHeight: "60vh" }}>
      <span className="loading-spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  if (!product) return (
    <div className="flex-center" style={{ minHeight: "60vh" }}>
      <div className="empty-state">Ürün bulunamadı. <Link to="/">Kataloğa dön</Link></div>
    </div>
  );

  return (
    <div className="container page">
      <Link to="/" style={{ color: "var(--text-3)", fontSize: "0.85rem", marginBottom: "1.5rem", display: "inline-block" }}>
        ← Tüm Ürünler
      </Link>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "2.5rem", alignItems: "start" }}>
        {/* Thumb */}
        <div style={{
          background: "var(--bg-2)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          aspectRatio: "1",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "7rem",
        }}>
          🌾
        </div>
        {/* Info */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-head)", fontSize: "2rem", lineHeight: 1.2 }}>{product.isim}</h1>
            {product.kooperatif_isim && (
              <p style={{ color: "var(--text-3)", marginTop: "0.35rem" }}>📍 {product.kooperatif_isim} • {product.kooperatif_lokasyon}</p>
            )}
          </div>

          <div style={{ fontSize: "2.2rem", fontWeight: 700, color: "var(--accent)" }}>
            ₺{product.birim_fiyat.toFixed(2)}
          </div>

          <div>
            {product.stok < 10 ? (
              <span className="badge badge-red">⚠ Kritik Stok: {product.stok} adet</span>
            ) : (
              <span className="badge badge-green">✓ Stokta: {product.stok} adet</span>
            )}
          </div>

          {product.kooperatif_hikaye && (
            <div className="card">
              <p style={{ fontSize: "0.78rem", color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.5rem" }}>
                Üretici Hikayesi
              </p>
              <p style={{ color: "var(--text-2)", fontSize: "0.9rem", lineHeight: 1.7 }}>{product.kooperatif_hikaye}</p>
            </div>
          )}

          <button
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.8rem", fontSize: "1rem" }}
            onClick={handleAdd}
            disabled={product.stok === 0}
          >
            {added ? "✓ Eklendi!" : product.stok === 0 ? "Tükendi" : "+ Sepete Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
