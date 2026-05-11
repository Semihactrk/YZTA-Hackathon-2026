// Typed service functions – reusable across any component.
import { api } from "./client";

// ── Types ──────────────────────────────────────────────────────────────────
export interface Product {
  id: number;
  isim: string;
  stok: number;
  birim_fiyat: number;
  kooperatif_id: number | null;
  kooperatif_isim: string | null;
  // only present on single-product fetch:
  kooperatif_hikaye?: string;
  kooperatif_lokasyon?: string;
}

export interface Order {
  id: number;
  urun_id: number;
  urun_adi: string | null;
  adet: number;
  durum: string;
  kargo_no: string | null;
  siparis_tarihi: string | null;
  toplam_fiyat: number | null;
}

export interface AlertsResponse {
  stok_alarmlari: { urun_adi: string; kalan_stok: number }[];
  kargo_alarmlari: { siparis_id: number; urun_adi: string }[];
  toplam_risk_sayisi: number;
}

export interface TopSeller {
  urun_adi: string;
  toplam_satis: number;
  mevcut_stok: number;
}

export interface StockPrediction {
  urun_adi: string;
  mevcut_stok: number;
  gunluk_satis_hizi: number;
  kalan_gun_tahmini: number;
  durum: string;
}

export interface Cooperative {
  id: number;
  isim: string;
  lokasyon: string;
  hikaye: string;
}

// ── Products ───────────────────────────────────────────────────────────────
export const getProducts = () => api.get<Product[]>("/products");
export const getProduct = (id: number) => api.get<Product>(`/products/${id}`);
export const createProduct = (body: Omit<Product, "id" | "kooperatif_isim">) =>
  api.post<{ id: number; isim: string }>("/products", body);
export const updateProduct = (id: number, body: Omit<Product, "id" | "kooperatif_isim">) =>
  api.put<{ id: number; isim: string }>(`/products/${id}`, body);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

// ── Orders ─────────────────────────────────────────────────────────────────
export const getOrders = () => api.get<Order[]>("/orders");
export const createOrder = (body: {
  urun_id: number;
  adet: number;
  musteri_adi?: string;
}) => api.post<{ siparis_id: number; urun_adi: string; adet: number; durum: string; toplam_fiyat: number }>("/orders", body);

// ── Alerts & Analytics ─────────────────────────────────────────────────────
export const getAlerts = () => api.get<AlertsResponse>("/alerts");
export const getTopSelling = () => api.get<TopSeller[]>("/analytics/top-selling");
export const getStockPredictions = () => api.get<StockPrediction[]>("/analytics/stock-predictions");
export const getCooperatives = () => api.get<Cooperative[]>("/cooperatives");

// ── Chat ───────────────────────────────────────────────────────────────────
export const sendChat = (message: string) =>
  api.post<{ reply: string }>("/chat", { message });
