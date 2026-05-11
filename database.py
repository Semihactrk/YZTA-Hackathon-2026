from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
from datetime import datetime, timedelta, timezone

DATABASE_URL = "sqlite:///./toprak_ana.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class Kooperatif(Base):
    __tablename__ = "kooperatifler"

    id = Column(Integer, primary_key=True, index=True)
    isim = Column(String, index=True)
    hikaye = Column(Text)
    lokasyon = Column(String)

    urunler = relationship("Urun", back_populates="kooperatif")

class Urun(Base):
    __tablename__ = "urunler"

    id = Column(Integer, primary_key=True, index=True)
    isim = Column(String, index=True)
    stok = Column(Integer, default=0)
    birim_fiyat = Column(Float, default=0.0)
    kooperatif_id = Column(Integer, ForeignKey("kooperatifler.id"))

    kooperatif = relationship("Kooperatif", back_populates="urunler")
    siparisler = relationship("Siparis", back_populates="urun")

class Siparis(Base):
    __tablename__ = "siparisler"

    id = Column(Integer, primary_key=True, index=True)
    urun_id = Column(Integer, ForeignKey("urunler.id"))
    adet = Column(Integer, default=1)
    durum = Column(String, default="Hazırlanıyor")  # Örn: Hazırlanıyor, Kargoda, Teslim Edildi
    kargo_no = Column(String, nullable=True)
    siparis_tarihi = Column(DateTime, default=func.now())

    urun = relationship("Urun", back_populates="siparisler")

def seed_data():
    db = SessionLocal()
    # Veritabanında zaten veri varsa ekleme yapma
    if db.query(Kooperatif).first():
        db.close()
        return

    # Kooperatifleri Ekle
    koop1 = Kooperatif(isim="Defne Kadın Kooperatifi", hikaye="Deprem sonrası kadınların bir araya gelerek kurduğu, el emeği sabun ve dokuma ürünleri üreten dayanışma kooperatifi.", lokasyon="Defne, Hatay")
    koop2 = Kooperatif(isim="Samandağ Tarım ve Lezzet", hikaye="Samandağ'ın bereketli topraklarından sofralara uzanan geleneksel lezzetleri üreten kadınların hikayesi.", lokasyon="Samandağ, Hatay")
    koop3 = Kooperatif(isim="Antakya Tarihi Üretim", hikaye="Kültürel mirasımızı yaşatmak için asırlık tariflerle üretim yapan Hatay gönüllüsü kadınlar.", lokasyon="Antakya, Hatay")
    
    db.add_all([koop1, koop2, koop3])
    db.commit()

    # Ürünleri Ekle (Hatay'a Özgü En Az 20 Ürün)
    urunler = [
        # Defne Kadın Kooperatifi
        Urun(isim="Geleneksel Defne Sabunu", stok=150, birim_fiyat=75.0, kooperatif_id=koop1.id),
        Urun(isim="El Dokuması İpek Şal", stok=30, birim_fiyat=450.0, kooperatif_id=koop1.id),
        Urun(isim="Zahter (Kekik) Karışımı", stok=200, birim_fiyat=85.0, kooperatif_id=koop1.id),
        Urun(isim="Sürk Peyniri (Çökelek)", stok=50, birim_fiyat=120.0, kooperatif_id=koop1.id),
        Urun(isim="Hatay Kömbe Baharatı", stok=100, birim_fiyat=60.0, kooperatif_id=koop1.id),
        Urun(isim="El İşlemesi Bez Çanta", stok=45, birim_fiyat=150.0, kooperatif_id=koop1.id),
        
        # Samandağ Tarım ve Lezzet
        Urun(isim="Acı Samandağ Biberi", stok=300, birim_fiyat=45.0, kooperatif_id=koop2.id),
        Urun(isim="Hakiki Nar Ekşisi (500ml)", stok=8, birim_fiyat=250.0, kooperatif_id=koop2.id), # Stok bilerek düşük (Uyarı senaryosu için)
        Urun(isim="Halhalı Zeytin", stok=120, birim_fiyat=160.0, kooperatif_id=koop2.id),
        Urun(isim="Soğuk Sıkım Zeytinyağı (1L)", stok=80, birim_fiyat=350.0, kooperatif_id=koop2.id),
        Urun(isim="Biber Salçası (Tatlı)", stok=150, birim_fiyat=180.0, kooperatif_id=koop2.id),
        Urun(isim="Biber Salçası (Acı)", stok=130, birim_fiyat=180.0, kooperatif_id=koop2.id),
        Urun(isim="Domates Salçası", stok=140, birim_fiyat=150.0, kooperatif_id=koop2.id),
        Urun(isim="Tuzlu Yoğurt", stok=60, birim_fiyat=140.0, kooperatif_id=koop2.id),
        
        # Antakya Tarihi Üretim
        Urun(isim="Cevizli Biber (Muhammara)", stok=90, birim_fiyat=110.0, kooperatif_id=koop3.id),
        Urun(isim="Çıtır Kabak Tatlısı (1kg)", stok=40, birim_fiyat=220.0, kooperatif_id=koop3.id),
        Urun(isim="Ceviz Reçeli", stok=50, birim_fiyat=190.0, kooperatif_id=koop3.id),
        Urun(isim="Turunç Reçeli", stok=70, birim_fiyat=140.0, kooperatif_id=koop3.id),
        Urun(isim="Karadut Şurubu", stok=110, birim_fiyat=130.0, kooperatif_id=koop3.id),
        Urun(isim="Künefe Peyniri", stok=25, birim_fiyat=200.0, kooperatif_id=koop3.id),
    ]

    db.add_all(urunler)
    db.commit()

    # Siparişleri Ekle (Analitik tahminler ve en çok satanlar testi için)
    simdi = datetime.now(timezone.utc)
    siparisler = [
        # Nar ekşisi (Acil stok bitişi uyarısı tetiklensin diye stok az, satış yüksek)
        Siparis(urun_id=urunler[7].id, adet=40, durum="Teslim Edildi", kargo_no="TR123456", siparis_tarihi=simdi - timedelta(days=12)),
        Siparis(urun_id=urunler[7].id, adet=32, durum="Kargoda", kargo_no="TR123457", siparis_tarihi=simdi - timedelta(days=5)),
        
        # Samandağ Biberi (En çok satanlara girmesi için)
        Siparis(urun_id=urunler[6].id, adet=150, durum="Teslim Edildi", siparis_tarihi=simdi - timedelta(days=20)),
        Siparis(urun_id=urunler[6].id, adet=120, durum="Teslim Edildi", siparis_tarihi=simdi - timedelta(days=2)),
        
        # Defne Sabunu
        Siparis(urun_id=urunler[0].id, adet=80, durum="Teslim Edildi", siparis_tarihi=simdi - timedelta(days=15)),
        
        # İpek Şal
        Siparis(urun_id=urunler[1].id, adet=10, durum="Hazırlanıyor", siparis_tarihi=simdi - timedelta(days=1)),
        
        # Sürk Peyniri
        Siparis(urun_id=urunler[3].id, adet=25, durum="Gecikti", siparis_tarihi=simdi - timedelta(days=10)),
    ]
    
    db.add_all(siparisler)
    db.commit()
    db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    seed_data()

if __name__ == "__main__":
    init_db()
    print("Veritabanı oluşturuldu ve başlangıç verileri eklendi!")
