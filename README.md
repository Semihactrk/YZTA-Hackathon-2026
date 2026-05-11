# 🌿 Toprak Ana — Yapay Zeka Destekli Kooperatif Pazaryeri

Hatay'daki kadın kooperatiflerinin el emeği ürünlerini dijital dünyaya taşıyan, yapay zeka destekli e-ticaret platformu.

**YZTA Hackathon 2026** projesi olarak geliştirilmiştir.

---

## 🎯 Proje Özeti

Toprak Ana, deprem sonrası Hatay'da kurulan kadın kooperatiflerinin ürünlerini (defne sabunu, nar ekşisi, zeytinyağı vb.) online olarak satışa sunan bir MVP'dir. Platform; müşteri kataloğu, sepet/sipariş sistemi, admin paneli ve **Gemini tabanlı çoklu yapay zeka ajanları** (Satış + Operasyon) ile desteklenen bir chatbot içerir.

### Temel Özellikler

- 🛒 **Müşteri Mağazası** — Ürün kataloğu, detay sayfası, sepet ve sipariş takibi
- 🤖 **AI Chatbot** — Gemini multi-agent sistemi (Satış Ajanı + Operasyon Ajanı)
- 📊 **Admin Paneli** — Ürün CRUD, sipariş yönetimi, stok uyarıları, satış analitiği
- 📈 **Stok Tahmin Motoru** — Satış hızına dayalı stok bitiş tahmini
- 🔍 **Türkçe Duyarlı Arama** — `toLocaleLowerCase("tr-TR")` ile İ/i, Ş/ş uyumlu

---

## 🏗 Teknoloji Yığını

| Katman | Teknoloji |
|--------|-----------|
| **Backend** | Python, FastAPI, SQLAlchemy, SQLite |
| **AI** | Google Gemini API (gemini-3.1-flash-lite), Multi-Agent Orchestration |
| **Frontend** | React 18, TypeScript, Vite, React Router v6 |
| **Styling** | Vanilla CSS (glassmorphism, dark theme, micro-animations) |

---

## 📁 Proje Yapısı

```
YZTA-Hackathon-2026/
├── main.py            # FastAPI uygulaması (tüm API endpoint'leri)
├── agents.py          # Gemini multi-agent sistemi (Satış + Operasyon ajanları)
├── crud.py            # Veritabanı sorgu fonksiyonları
├── database.py        # SQLAlchemy modelleri + seed verileri
├── .env               # API anahtarı (Git'e dahil edilmez)
├── .gitignore
└── frontend/
    ├── index.html
    ├── package.json
    └── src/
        ├── api/
        │   ├── client.ts       # Merkezi fetch client
        │   └── services.ts     # Tipli API fonksiyonları
        ├── context/
        │   └── CartContext.tsx  # Sepet state yönetimi
        ├── components/
        │   ├── Chatbot.tsx     # AI sohbet widget'ı
        │   ├── CartDrawer.tsx  # Sepet çekmecesi
        │   └── StoreNavbar.tsx # Navigasyon barı
        └── pages/
            ├── StorePage.tsx         # Ürün kataloğu
            ├── ProductDetailPage.tsx # Ürün detayı
            ├── CheckoutPage.tsx      # Sipariş tamamlama
            ├── OrdersPage.tsx        # Sipariş takibi
            └── admin/
                ├── AdminLayout.tsx    # Admin panel iskeleti
                ├── AdminDashboard.tsx # Genel bakış
                ├── AdminProducts.tsx  # Ürün CRUD
                ├── AdminOrders.tsx    # Sipariş listesi
                ├── AdminAlerts.tsx    # Stok/kargo uyarıları
                └── AdminAnalytics.tsx # Satış analitiği
```

---

## 🚀 Kurulum

### Gereksinimler

- Python 3.10+
- Node.js 18+
- Google Gemini API anahtarı

### 1. Backend

```bash
# Proje dizinine git
cd YZTA-Hackathon-2026

# Sanal ortam oluştur ve aktifleştir
python -m venv venv
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Bağımlılıkları kur
pip install fastapi uvicorn sqlalchemy python-dotenv google-genai

# .env dosyası oluştur
echo GEMINI_API_KEY=buraya_api_anahtarinizi_yazin > .env

# Sunucuyu başlat (ilk çalıştırmada DB otomatik oluşur ve örnek veriler eklenir)
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

| Servis | URL |
|--------|-----|
| Backend API | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Frontend | http://localhost:5173 |

---

## 🤖 AI Multi-Agent Mimarisi

Chatbot, gelen mesajı bir **orkestratör** (routing) ajanı ile analiz eder ve doğru uzman ajana yönlendirir:

```
Kullanıcı Mesajı
      │
      ▼
┌─────────────┐
│ Orkestratör  │ → "SATIŞ" veya "OPERASYON" kararı
└──────┬──────┘
       │
  ┌────┴────┐
  ▼         ▼
┌──────┐ ┌──────────┐
│Satış │ │Operasyon │
│Ajanı │ │Ajanı     │
└──────┘ └──────────┘
  │           │
  │  Tools:   │  Tools:
  │  • Stok   │  • Sipariş durumu
  │  sorgu    │  • Stok tahmini
  └───────────┘
```

- **Satış Ajanı**: Ürün bilgisi, fiyat, anlık stok durumu
- **Operasyon Ajanı**: Sipariş takibi, geciken kargolar için KOOP10 kupon kodu, stok bitiş tahminleri

---

## 📡 API Endpoint'leri

| Metod | Yol | Açıklama |
|-------|-----|----------|
| `POST` | `/chat` | AI chatbot (multi-agent) |
| `GET` | `/products` | Tüm ürünleri listele |
| `GET` | `/products/{id}` | Ürün detayı |
| `POST` | `/products` | Yeni ürün ekle (admin) |
| `PUT` | `/products/{id}` | Ürün güncelle (admin) |
| `DELETE` | `/products/{id}` | Ürün sil (admin) |
| `GET` | `/orders` | Tüm siparişler |
| `POST` | `/orders` | Sipariş oluştur (müşteri) |
| `GET` | `/cooperatives` | Kooperatif listesi |
| `GET` | `/alerts` | Stok ve kargo uyarıları |
| `GET` | `/analytics/top-selling` | En çok satan 5 ürün |
| `GET` | `/analytics/stock-predictions` | Stok bitiş tahminleri |

---

## 🧪 Test

```bash
# Ürünleri listele
curl http://localhost:8000/products

# AI Chatbot — Satış Ajanı
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Defne sabunu stokta var mı?"}'

# AI Chatbot — Operasyon Ajanı (gecikmiş sipariş → KOOP10 kuponu)
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "5 numaralı sipariş nerede?"}'

# Stok uyarıları
curl http://localhost:8000/alerts
```

---

## 👥 Ekip

YZTA Hackathon 2026 katılımcıları tarafından geliştirilmiştir.
