# 🌿 Toprak Ana — Yapay Zeka Destekli Kooperatif Pazaryeri

> **YZTA Hackathon 2026** için geliştirilmiş, yapay zeka destekli, çok-ajanlı kadın kooperatifi pazaryeri uygulaması.

---

## 📖 Proje Hakkında

**Toprak Ana**, Hatay'daki kadın kooperatiflerinin el emeği, geleneksel ve yerel ürünlerini dijital ortamda satmasını sağlayan tam entegre bir e-ticaret platformudur. Proje; Google Gemini tabanlı **çok-ajanlı yapay zeka mimarisi**, **vektörel bilgi bankası (RAG)**, **gerçek zamanlı Telegram uyarıları** ve **rol tabanlı erişim kontrolü** (RBAC) ile donatılmış modern bir full-stack uygulamadır.

### 🎯 Hedef

Deprem sonrası ekonomik güçlüklerle mücadele eden Hatay'daki kadın üreticilerin ürünlerini tüketicilere doğrudan ulaştırmak; aynı zamanda kooperatif yöneticilerine akıllı stok, sipariş ve lojistik analitik araçlar sunmak.

---

## 🏗️ Sistem Mimarisi

```
┌─────────────────────────────────────────────────────────┐
│                   FRONTEND (React + Vite)                │
│  Mağaza · Ürün Detay · Sepet · Ödeme · Siparişler       │
│  Admin Panel: Dashboard · Ürünler · Siparişler ·         │
│              Analitik · Uyarılar                         │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP / REST API
┌────────────────────▼────────────────────────────────────┐
│                  BACKEND (FastAPI)                        │
│  /products  /orders  /cooperatives  /chat                │
│  /analytics  /alerts  /admin/logistics-report            │
│  /login  /register                                       │
└──────┬───────────────────────────────────┬──────────────┘
       │                                   │
┌──────▼──────────┐              ┌─────────▼──────────────┐
│  SQLite DB      │              │   Gemini AI Engine      │
│  (SQLAlchemy)   │              │                         │
│  · Kullanıcılar │              │  Orchestrator Agent     │
│  · Ürünler      │              │  ┌──────────────────┐  │
│  · Siparişler   │              │  │  Satış Ajanı     │  │
│  · Kooperatifler│              │  │  Operasyon Ajanı │  │
│  · Ajan Logları │              │  └──────────────────┘  │
└─────────────────┘              │                         │
                                 │  Vector DB (RAG)        │
                                 │  Gemini Embeddings +    │
                                 │  Cosine Similarity      │
                                 └─────────────────────────┘
                                           │
                                 ┌─────────▼──────────────┐
                                 │   Telegram Bot API      │
                                 │   (Kritik Uyarılar)     │
                                 └─────────────────────────┘
```

---

## 🤖 Çok-Ajanlı Yapay Zeka Mimarisi

Projenin kalbi, Google Gemini tabanlı üç katmanlı bir ajan sistemine dayanmaktadır:

| Bileşen | Görev | Model |
|---|---|---|
| **Orchestrator** | Kullanıcı mesajını analiz eder, hangi ajanın devreye gireceğine karar verir | `gemini-3.1-flash-lite` |
| **Satış Ajanı** | Ürün stok sorgulama, fiyat bilgisi, üretici hikayeleri | `gemini-3.1-flash-lite` |
| **Operasyon Ajanı** | Sipariş durum takibi, stok bitim tahmini, gecikme yönetimi | `gemini-3.1-flash-lite` |
| **Vector DB (RAG)** | Kooperatif hikayelerini vektörel olarak depolar ve semantik arama yapar | `gemini-embedding-001` |

### Ajan Yönlendirme Mantığı

```
Kullanıcı Mesajı
      │
      ▼
 [Orchestrator]
      │
      ├── "ürün", "stok", "fiyat", "hikaye"  ──► [Satış Ajanı]
      │                                            └─ check_product_stock_tool
      │                                            └─ get_producer_story_tool (RAG)
      │
      └── "sipariş", "kargo", "tahmin", "analiz" ─► [Operasyon Ajanı]
                                                      └─ check_order_status_tool
                                                      └─ predict_stock_depletion_tool
```

Tüm ajan etkileşimleri veritabanında `ajan_loglari` tablosuna kaydedilir.

---

## 🗂️ Proje Yapısı

```
YZTA-Hackathon-2026/
├── 🐍 main.py              # FastAPI uygulaması — tüm REST endpoint'leri
├── 🤖 agents.py            # Çok-ajanlı Gemini AI sistemi
├── 🗄️ database.py          # SQLAlchemy modelleri ve seed verisi
├── ⚙️ crud.py              # Veritabanı işlemleri (CRUD + analitik)
├── 🔍 vector_db.py         # RAG — Gemini Embeddings + Cosine Similarity
├── 📦 toprak_ana.db        # SQLite veritabanı
├── 🖼️ urun_foto/           # Ürün görselleri (statik dosyalar)
├── .env                    # API anahtarları (git'e eklenmez)
│
└── frontend/               # React + Vite + TypeScript
    └── src/
        ├── App.tsx          # Router ve route tanımları
        ├── index.css        # Global stil sistemi
        ├── api/             # Backend API istemci katmanı
        ├── context/
        │   └── AuthContext.tsx    # Kimlik doğrulama context'i
        ├── components/
        │   ├── StoreNavbar.tsx    # Navigasyon çubuğu
        │   ├── CartDrawer.tsx     # Alışveriş sepeti yan paneli
        │   ├── Chatbot.tsx        # AI sohbet arayüzü
        │   ├── ProtectedRoute.tsx # Kimlik doğrulama koruması
        │   └── AdminRoute.tsx     # Admin yetki koruması
        └── pages/
            ├── StorePage.tsx         # Ana mağaza (ürün kataloğu)
            ├── ProductDetailPage.tsx # Ürün detay sayfası
            ├── CheckoutPage.tsx      # Ödeme ve sipariş tamamlama
            ├── OrdersPage.tsx        # Kullanıcı siparişleri
            ├── LoginPage.tsx         # Giriş sayfası
            ├── RegisterPage.tsx      # Kayıt sayfası
            ├── ProfilePage.tsx       # Kullanıcı profili
            └── admin/
                ├── AdminLayout.tsx   # Admin panel çerçevesi
                ├── AdminDashboard.tsx # Özet istatistikler
                ├── AdminProducts.tsx  # Ürün yönetimi (CRUD)
                ├── AdminOrders.tsx    # Sipariş yönetimi
                ├── AdminAnalytics.tsx # Satış analitiği
                └── AdminAlerts.tsx    # Stok & lojistik uyarılar
```

---

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- **Python** 3.10+
- **Node.js** 18+ ve npm
- **Google Gemini API** anahtarı
- **Telegram Bot** token ve chat ID (opsiyonel, uyarılar için)

### 1. Ortam Değişkenleri

Proje kök dizininde `.env` dosyası oluşturun:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

### 2. Backend Kurulumu

```bash
# Bağımlılıkları yükle
pip install fastapi uvicorn sqlalchemy python-dotenv google-genai scikit-learn numpy requests

# Sunucuyu başlat (veritabanı otomatik oluşturulur ve seed verisi eklenir)
python main.py
```

Backend `http://localhost:8000` adresinde çalışmaya başlar.
İnteraktif API dokümantasyonu: `http://localhost:8000/docs`

### 3. Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` adresinde çalışmaya başlar.

---

## 👤 Kullanıcı Rolleri ve Test Hesapları

| Rol | E-posta | Şifre | Erişim |
|---|---|---|---|
| **Admin** | `admin@admin.com` | `1234` | Tüm admin paneli, ürün CRUD, analitik, uyarılar |
| **Müşteri** | Kayıt ol | Belirlediğin şifre | Mağaza, sepet, sipariş |

### Admin Panel Özellikleri

- 📊 **Dashboard**: Toplam ürün, sipariş sayısı ve özet istatistikler
- 📦 **Ürün Yönetimi**: Ekleme, düzenleme, silme (kooperatif bağlantısı ile)
- 🛒 **Sipariş Yönetimi**: Tüm siparişlerin görüntülenmesi
- 📈 **Analitik**: En çok satan ürünler, stok bitim tahminleri
- 🚨 **Uyarılar**: Kritik stok seviyeleri, gecikmiş siparişler + Telegram bildirimleri

---

## 🌐 API Endpoint Referansı

### Kimlik Doğrulama
| Method | Endpoint | Açıklama |
|---|---|---|
| `POST` | `/register` | Yeni kullanıcı kaydı |
| `POST` | `/login` | Giriş ve token alma |

### Ürünler
| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/products` | Tüm ürünleri listele |
| `GET` | `/products/{id}` | Ürün detayını getir |
| `POST` | `/products` | Yeni ürün ekle (Admin) |
| `PUT` | `/products/{id}` | Ürün güncelle (Admin) |
| `DELETE` | `/products/{id}` | Ürün sil (Admin) |

### Siparişler
| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/orders` | Tüm siparişler (Admin) |
| `POST` | `/orders` | Yeni sipariş oluştur |

### Kooperatifler & AI
| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/cooperatives` | Tüm kooperatifleri listele |
| `POST` | `/chat` | AI chatbot ile konuş |

### Analitik & Yönetim
| Method | Endpoint | Açıklama |
|---|---|---|
| `GET` | `/analytics/top-selling` | En çok satan 5 ürün |
| `GET` | `/analytics/stock-predictions` | Stok bitim tahminleri |
| `GET` | `/alerts` | Stok & kargo uyarıları |
| `GET` | `/admin/logistics-report` | Lojistik performans raporu |

---

## 🛢️ Veritabanı Modelleri

```
Kullanıcılar          Kooperatifler
─────────────         ──────────────
id (PK)               id (PK)
isim                  isim
email (unique)        hikaye
sifre                 lokasyon
rol (admin/customer)      │
                          │ 1:N
                          ▼
                      Ürünler
                      ──────────────
                      id (PK)
                      isim
                      stok
                      birim_fiyat
                      kooperatif_id (FK)
                          │
                          │ 1:N (cascade delete)
                          ▼
                      Siparişler
                      ──────────────
                      id (PK)
                      urun_id (FK)
                      kullanici_id
                      adet
                      toplam_fiyat
                      durum
                      kargo_no
                      siparis_tarihi

                      Ajan Logları
                      ──────────────
                      id (PK)
                      kullanici_mesaji
                      yonlendirme_karari
                      ajan_yaniti
                      tarih
```

### Seed Verisi

Uygulama ilk çalıştığında otomatik olarak yüklenir:
- **3 Kooperatif**: Defne Kadın Kooperatifi, Samandağ Tarım ve Lezzet, Antakya Tarihi Üretim
- **20 Yerel Ürün**: Defne sabunu, el dokuması şal, zahter, sürk peyniri, nar ekşisi ve daha fazlası
- **Demo Siparişler**: Analitik paneli ve stok uyarılarını test etmek için hazır siparişler
- **Admin Hesabı**: `admin@admin.com / 1234`

---

## 🛒 Kullanıcı Akışı

```
Ziyaretçi
   │
   ├── Kayıt / Giriş
   │
   ▼
Mağaza Sayfası (Ürün Kataloğu)
   │
   ├── Ürün Ara (TR karakter desteği)
   ├── Kooperatife Göre Filtrele
   ├── Ürün Detayına Git
   │     └── Kooperatif hikayesi görüntüle
   │
   ├── Sepete Ekle → Sepet Drawer
   │
   └── Ödeme Sayfası
         └── Sipariş Oluştur → Sipariş Takibi
```

---

## 📡 Telegram Uyarı Sistemi

Aşağıdaki durumlarda otomatik Telegram bildirimi gönderilir:

- ⚠️ **Kritik Stok**: `GET /alerts` çağrısında 10 birim altındaki ürünler tespit edilirse
- 🚛 **Lojistik Risk**: `GET /admin/logistics-report` çağrısında gecikme oranı %10'u aşan kargo firmalarında
- 📦 **Gecikmiş Sipariş**: Operasyon ajanı gecikmiş siparişleri işlediğinde müşteriye `KOOP10` kupon kodu sunulur

---

## 🧰 Teknoloji Yığını

### Backend
| Teknoloji | Amaç |
|---|---|
| **FastAPI** | REST API çerçevesi |
| **SQLAlchemy** | ORM ve veritabanı yönetimi |
| **SQLite** | Yerel veritabanı |
| **Google Gemini** | LLM (çok-ajanlı sohbet) |
| **Gemini Embeddings** | Vektörel RAG sistemi |
| **scikit-learn** | Cosine similarity hesabı |
| **python-dotenv** | Ortam değişkeni yönetimi |
| **requests** | Telegram Bot API entegrasyonu |

### Frontend
| Teknoloji | Amaç |
|---|---|
| **React 18** | UI kütüphanesi |
| **TypeScript** | Tip güvenliği |
| **Vite** | Build aracı ve dev sunucusu |
| **React Router v6** | İstemci taraflı yönlendirme |
| **Vanilla CSS** | Stil sistemi |

---

## 🔒 Güvenlik Notları

> Bu proje bir hackathon prototipidir. Üretim ortamı için aşağıdaki iyileştirmeler önerilir:

- Şifrelerin düz metin yerine **bcrypt** ile hash'lenmesi
- Mock token yerine gerçek **JWT** tabanlı kimlik doğrulama
- API endpoint'lerinde token doğrulama middleware'i
- Ortam değişkenlerinin güvenli yönetimi

---

## 📸 Uygulama Ekran Görüntüleri

| Mağaza | Admin Dashboard |
|---|---|
| Ürün kataloğu, arama, kooperatif filtresi | Özet istatistikler, stok uyarıları |

| AI Chatbot | Analitik |
|---|---|
| Satış & Operasyon ajan yönlendirmesi | En çok satanlar, stok tahminleri |

---

## 🤝 Katkıda Bulunanlar

Bu proje **YZTA Hackathon 2026** kapsamında geliştirilmiştir.

---
<div align="center">
  <sub>Made with ❤️ and ☕ — by 307. Takım </sub>
</div>
