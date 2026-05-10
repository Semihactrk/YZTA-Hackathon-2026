from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

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
    db.close()

def init_db():
    Base.metadata.create_all(bind=engine)
    seed_data()

if __name__ == "__main__":
    init_db()
    print("Veritabanı oluşturuldu ve başlangıç verileri eklendi!")


def get_product_stock(urun_adi: str):
    """Verilen ürünün stok miktarını döndürür."""
    db = SessionLocal()
    urun = db.query(Urun).filter(Urun.isim.contains(urun_adi)).first()
    db.close()
    if urun:
        return f"{urun.isim} stoğu: {urun.stok} adet. Birim fiyat: {urun.birim_fiyat} TL."
    return "Ürün bulunamadı."

def get_order_status(siparis_id: int):
    """Siparişin durumunu ve kargo bilgisini döndürür."""
    db = SessionLocal()
    siparis = db.query(Siparis).filter(Siparis.id == siparis_id).first()
    db.close()
    if siparis:
        kargo = siparis.kargo_no if siparis.kargo_no else "Henüz atanmadı"
        return f"Sipariş Durumu: {siparis.durum}. Kargo No: {kargo}"
    return "Sipariş bulunamadı."
