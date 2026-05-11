import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart, type CartItem } from "../context/CartContext";
import { createOrder } from "../api/services";
import { saveMyOrderIds } from "./OrdersPage";

interface FormData {
  adSoyad: string;
  telefon: string;
  adres: string;
  sehir: string;
  postaKodu: string;
}

const EMPTY: FormData = {
  adSoyad: "",
  telefon: "",
  adres: "",
  sehir: "",
  postaKodu: "",
};

type Step = "form" | "success";

export default function CheckoutPage() {
  const { items, total, clear } = useCart();
  const [form, setForm] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [orderIds, setOrderIds] = useState<number[]>([]);

  // Sepet boşsa mağazaya yönlendir
  if (items.length === 0 && step === "form") {
    return (
      <div className="flex-center" style={{ minHeight: "80vh", flexDirection: "column", gap: "1rem" }}>
        <div style={{ fontSize: "3rem" }}>🧺</div>
        <p style={{ color: "var(--text-2)" }}>Sepetiniz boş.</p>
        <Link to="/" className="btn btn-primary">Alışverişe Devam Et</Link>
      </div>
    );
  }

  const validate = (): boolean => {
    const e: Partial<FormData> = {};
    if (!form.adSoyad.trim()) e.adSoyad = "Ad soyad zorunlu";
    if (!form.telefon.trim()) e.telefon = "Telefon zorunlu";
    else if (!/^[0-9\s\+\-]{7,15}$/.test(form.telefon)) e.telefon = "Geçerli bir telefon girin";
    if (!form.adres.trim()) e.adres = "Adres zorunlu";
    if (!form.sehir.trim()) e.sehir = "Şehir zorunlu";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const field = (key: keyof FormData) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      setErrors((er) => ({ ...er, [key]: undefined }));
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setApiError("");
    try {
      const placed: number[] = [];
      for (const item of items) {
        const res = await createOrder({
          urun_id: item.id,
          adet: item.qty,
          musteri_adi: `${form.adSoyad} | ${form.telefon} | ${form.adres}, ${form.sehir} ${form.postaKodu}`,
        });
        placed.push(res.siparis_id);
      }
      // Sipariş ID'lerini localStorage'a kaydet (müşteri sipariş takibi için)
      saveMyOrderIds(placed);
      setOrderIds(placed);
      clear();
      setStep("success");
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : "Bir hata oluştu, tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  // ── Başarı ekranı ────────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="container page flex-center" style={{ flexDirection: "column", gap: "1.5rem", textAlign: "center", minHeight: "70vh" }}>
        <div style={{ fontSize: "4rem" }}>🎉</div>
        <h1 style={{ fontFamily: "var(--font-head)", color: "var(--text)" }}>Siparişiniz Alındı!</h1>
        <p style={{ color: "var(--text-2)", maxWidth: 420 }}>
          Teşekkürler <strong style={{ color: "var(--accent)" }}>{form.adSoyad}</strong>!{" "}
          Siparişiniz hazırlanmaya başlandı.{" "}
          {orderIds.length > 0 && (
            <span>Sipariş numaranız: <strong style={{ color: "var(--accent)" }}>#{orderIds.join(", #")}</strong></span>
          )}
        </p>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link to="/orders" className="btn btn-primary">📦 Siparişlerimi Görüntüle</Link>
          <Link to="/" className="btn btn-ghost">Alışverişe Devam Et</Link>
        </div>
      </div>
    );
  }

  // ── Form ekranı ──────────────────────────────────────────────────────────
  return (
    <div className="container page" style={{ maxWidth: 900 }}>
      {/* Geri butonu */}
      <Link
        to="/"
        style={{ color: "var(--text-3)", fontSize: "0.85rem", marginBottom: "2rem", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
      >
        ← Alışverişe Dön
      </Link>

      <h1 style={{ fontFamily: "var(--font-head)", fontSize: "2rem", marginBottom: "0.4rem" }}>
        Sipariş Bilgileri
      </h1>
      <p style={{ color: "var(--text-2)", marginBottom: "2.5rem" }}>
        Teslimat bilgilerini girerek siparişinizi tamamlayın.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "2rem", alignItems: "start" }}>

        {/* ── Sol: Form ─────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>

          {/* Kişisel Bilgiler */}
          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--text)" }}>
              👤 Kişisel Bilgiler
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Ad Soyad *</label>
                <input
                  {...field("adSoyad")}
                  placeholder="Örn: Ayşe Kaya"
                  style={{ borderColor: errors.adSoyad ? "var(--red)" : undefined }}
                />
                {errors.adSoyad && <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.adSoyad}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Telefon Numarası *</label>
                <input
                  {...field("telefon")}
                  type="tel"
                  placeholder="Örn: 0532 123 45 67"
                  style={{ borderColor: errors.telefon ? "var(--red)" : undefined }}
                />
                {errors.telefon && <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.telefon}</span>}
              </div>
            </div>
          </div>

          {/* Teslimat Adresi */}
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--text)" }}>
              📍 Teslimat Adresi
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Açık Adres *</label>
                <textarea
                  value={form.adres}
                  onChange={(e) => { setForm((f) => ({ ...f, adres: e.target.value })); setErrors((er) => ({ ...er, adres: undefined })); }}
                  placeholder="Mahalle, cadde, sokak, bina no, daire no..."
                  rows={3}
                  style={{
                    resize: "vertical",
                    borderColor: errors.adres ? "var(--red)" : undefined,
                    background: "var(--bg-3)",
                    border: "1px solid var(--border)",
                    color: "var(--text)",
                    borderRadius: "var(--radius-sm)",
                    padding: "0.55rem 0.85rem",
                    fontFamily: "inherit",
                    fontSize: "0.92rem",
                    width: "100%",
                  }}
                />
                {errors.adres && <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.adres}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Şehir *</label>
                  <input
                    {...field("sehir")}
                    placeholder="Örn: Hatay"
                    style={{ borderColor: errors.sehir ? "var(--red)" : undefined }}
                  />
                  {errors.sehir && <span style={{ color: "var(--red)", fontSize: "0.78rem" }}>{errors.sehir}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Posta Kodu</label>
                  <input
                    {...field("postaKodu")}
                    placeholder="Örn: 31000"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* API Hatası */}
          {apiError && <div className="error-msg" style={{ marginBottom: "1rem" }}>{apiError}</div>}

          {/* Gönder */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", padding: "0.9rem", fontSize: "1rem" }}
            disabled={loading}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}>
                <span className="loading-spinner" style={{ width: 18, height: 18 }} />
                Sipariş veriliyor…
              </span>
            ) : (
              "✓ Siparişi Onayla"
            )}
          </button>
        </form>

        {/* ── Sağ: Sipariş özeti ───────────────────────────────────────── */}
        <div>
          <div className="card" style={{ position: "sticky", top: 80 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1.25rem", color: "var(--text)" }}>
              🛒 Sipariş Özeti
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "1rem" }}>
              {items.map((item: CartItem) => (
                <div
                  key={item.id}
                  style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <div>
                    <div style={{ fontSize: "0.88rem", color: "var(--text)", fontWeight: 500 }}>{item.isim}</div>
                    <div style={{ fontSize: "0.78rem", color: "var(--text-3)" }}>{item.qty} adet × ₺{item.birim_fiyat.toFixed(2)}</div>
                  </div>
                  <span style={{ color: "var(--accent)", fontWeight: 600, fontSize: "0.9rem" }}>
                    ₺{(item.birim_fiyat * item.qty).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Kargo satırı */}
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "0.6rem 0", borderTop: "1px solid var(--border)",
                fontSize: "0.85rem", color: "var(--text-2)",
              }}
            >
              <span>🚚 Kargo</span>
              <span className="badge badge-green">Ücretsiz</span>
            </div>

            {/* Toplam */}
            <div
              style={{
                display: "flex", justifyContent: "space-between",
                padding: "0.8rem 0 0",
                borderTop: "1px solid var(--border-2)",
                fontWeight: 700, fontSize: "1.1rem",
              }}
            >
              <span>Toplam</span>
              <span style={{ color: "var(--accent)" }}>₺{total.toFixed(2)}</span>
            </div>

            {/* Güven ikonları */}
            <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {["🔒 Güvenli ödeme", "🌿 El emeği ürünler", "♻ Doğal & organik"].map((t) => (
                <div key={t} style={{ fontSize: "0.78rem", color: "var(--text-3)", display: "flex", alignItems: "center", gap: "0.35rem" }}>{t}</div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
