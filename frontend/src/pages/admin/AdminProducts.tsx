// Admin products page — full CRUD: create, edit, delete products
import { useEffect, useState } from "react";
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getCooperatives, type Product, type Cooperative
} from "../../api/services";

interface FormState {
  isim: string;
  stok: string;
  birim_fiyat: string;
  kooperatif_id: string;
}

const EMPTY_FORM: FormState = { isim: "", stok: "", birim_fiyat: "", kooperatif_id: "" };

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [coops, setCoops] = useState<Cooperative[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([getProducts(), getCooperatives()])
      .then(([p, c]) => { setProducts(p); setCoops(c); })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditTarget(p);
    setForm({
      isim: p.isim,
      stok: String(p.stok),
      birim_fiyat: String(p.birim_fiyat),
      kooperatif_id: p.kooperatif_id != null ? String(p.kooperatif_id) : "",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.isim.trim()) { setError("Ürün adı zorunlu"); return; }
    setSaving(true);
    setError("");
    try {
      const body = {
        isim: form.isim.trim(),
        stok: parseInt(form.stok) || 0,
        birim_fiyat: parseFloat(form.birim_fiyat) || 0,
        kooperatif_id: form.kooperatif_id ? parseInt(form.kooperatif_id) : null,
      };
      if (editTarget) {
        await updateProduct(editTarget.id, body);
      } else {
        await createProduct(body);
      }
      setShowModal(false);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Hata");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p: Product) => {
    if (!confirm(`"${p.isim}" ürününü silmek istediğinize emin misiniz?`)) return;
    try {
      await deleteProduct(p.id);
      load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Silinemedi");
    }
  };

  return (
    <div>
      <div className="admin-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h1>Ürün Yönetimi</h1>
          <p>Ürün ekle, düzenle veya sil.</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate}>+ Yeni Ürün</button>
      </div>

      {loading ? (
        <div className="flex-center" style={{ padding: "4rem" }}>
          <span className="loading-spinner" style={{ width: 36, height: 36 }} />
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Ürün Adı</th>
                <th>Kooperatif</th>
                <th>Stok</th>
                <th>Fiyat</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p: Product) => (
                <tr key={p.id}>
                  <td style={{ color: "var(--text-3)" }}>{p.id}</td>
                  <td style={{ color: "var(--text)", fontWeight: 500 }}>{p.isim}</td>
                  <td style={{ color: "var(--text-3)" }}>{p.kooperatif_isim ?? "—"}</td>
                  <td>
                    {p.stok < 10 ? (
                      <span className="badge badge-red">⚠ {p.stok}</span>
                    ) : p.stok < 30 ? (
                      <span className="badge badge-yellow">{p.stok}</span>
                    ) : (
                      <span className="badge badge-green">{p.stok}</span>
                    )}
                  </td>
                  <td style={{ color: "var(--accent)" }}>₺{p.birim_fiyat.toFixed(2)}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏ Düzenle</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p)}>🗑 Sil</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="modal-title">{editTarget ? "Ürünü Düzenle" : "Yeni Ürün"}</h2>
            {error && <div className="error-msg" style={{ marginBottom: "1rem" }}>{error}</div>}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div className="form-group">
                <label className="form-label">Ürün Adı *</label>
                <input value={form.isim} onChange={(e) => setForm({ ...form, isim: e.target.value })} placeholder="Ürün adı" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Stok Adedi</label>
                  <input type="number" min={0} value={form.stok} onChange={(e) => setForm({ ...form, stok: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Birim Fiyat (₺)</label>
                  <input type="number" min={0} step={0.01} value={form.birim_fiyat} onChange={(e) => setForm({ ...form, birim_fiyat: e.target.value })} placeholder="0.00" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Kooperatif</label>
                <select value={form.kooperatif_id} onChange={(e) => setForm({ ...form, kooperatif_id: e.target.value })}>
                  <option value="">— Seçiniz —</option>
                  {coops.map((c) => <option key={c.id} value={c.id}>{c.isim}</option>)}
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? <span className="loading-spinner" style={{ width: 16, height: 16 }} /> : "Kaydet"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
