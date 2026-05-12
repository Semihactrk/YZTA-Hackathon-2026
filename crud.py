from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import Urun, Siparis, Kooperatif, AjanLog

def create_agent_log(kullanici_mesaji: str, yonlendirme_karari: str, ajan_yaniti: str, db: Session):
    yeni_log = AjanLog(
        kullanici_mesaji=kullanici_mesaji,
        yonlendirme_karari=yonlendirme_karari,
        ajan_yaniti=ajan_yaniti
    )
    db.add(yeni_log)
    db.commit()
    db.refresh(yeni_log)
    return yeni_log

def get_product_stock(item_name: str, db: Session):
    """
    Verilen ürün ismine göre veritabanından stok bilgisini çeker.
    Gemini tarafından "tool" olarak çağrılacak.
    """
    # LIKE ile esnek arama yapıyoruz, büyük/küçük harf duyarlılığı olmadan
    urun = db.query(Urun).filter(Urun.isim.ilike(f"%{item_name}%")).first()
    if urun:
        return {"urun_adi": urun.isim, "stok": urun.stok, "stok_durumu": "Kritik" if urun.stok < 10 else "Yeterli"}
    return {"hata": f"[{item_name}] isimli ürün bulunamadı."}

def check_order_status(order_id: int, db: Session):
    """
    Verilen sipariş ID'sine göre siparişin ve kargonun durumunu döndürür.
    Gemini tarafından "tool" olarak çağrılacak.
    """
    siparis = db.query(Siparis).filter(Siparis.id == order_id).first()
    if siparis:
        return {
            "siparis_id": siparis.id,
            "urun_adi": siparis.urun.isim,
            "adet": siparis.adet,
            "durum": siparis.durum,
            "kargo_no": siparis.kargo_no
        }
    return {"hata": f"[{order_id}] numaralı sipariş bulunamadı."}

def search_coop_story(query: str, db: Session):
    """
    Kooperatiflerin hikayelerinde metin tabanlı arama yapar (RAG için).
    Kullanıcının sorusuna en uygun kooperatif hikayesini bulmak için kullanılır.
    """
    # Basit bir metin araması (SQLite LIKE kullanarak)
    kooperatifler = db.query(Kooperatif).filter(Kooperatif.hikaye.ilike(f"%{query}%")).all()
    
    sonuclar = []
    for koop in kooperatifler:
        sonuclar.append({
            "kooperatif_isim": koop.isim,
            "lokasyon": koop.lokasyon,
            "hikaye": koop.hikaye
        })
    
    return sonuclar if sonuclar else [{"hata": "Bu konseptte bir kooperatif hikayesi bulunamadı."}]

def get_top_5_selling_products(db: Session):
    """
    Geçmiş sipariş verilerine bakarak en çok satan 5 ürünü listeler.
    Ürünleri toplam sipariş adedine göre gruplar ve sıralar.
    """
    # Siparis tablosunda urun_id'ye göre grupla ve adetlerin toplamını al
    sonuclar = db.query(
        Urun.isim, 
        Urun.stok,
        func.sum(Siparis.adet).label('toplam_satis')
    ).join(Siparis, Urun.id == Siparis.urun_id) \
     .group_by(Urun.id) \
     .order_by(desc('toplam_satis')) \
     .limit(5).all()
     
    if not sonuclar:
         return {"mesaj": "Henüz kayıtlı sipariş bulunmamaktadır."}
         
    return [{"urun_adi": isim, "toplam_satis": satis, "mevcut_stok": stok} for isim, stok, satis in sonuclar]

def generate_whatsapp_template(urun_adi: str, mevcut_stok: int, hedef_stok: int = 100):
    """
    Üretici kadınlara WhatsApp üzerinden gönderilecek stok bildirim şablonunu oluşturur.
    """
    eksik_miktar = hedef_stok - mevcut_stok
    if eksik_miktar <= 0:
        return "Stoklarımız hedef seviyede, üretime tam gaz devam, elinize sağlık!"
        
    sablon = (
        f"🌸 Merhaba Emekçi Kadınlarımız,\n\n"
        f"Halkımızın '{urun_adi}' ürünümüze olan ilgisi çok yoğun! Ancak stoklarımızda sadece {mevcut_stok} adet kalmış durumda.\n"
        f"Siparişleri karşılayabilmemiz için {eksik_miktar} tane daha üretime ihtiyacımız var.\n\n"
        f"Ellerinize sağlık, bereketli üretimler dileriz! 🙏"
    )
    return sablon

def predict_stock_depletion(db: Session, days_history: int = 30):
    """
    Satış hızına dayalı stok bitiş tahmini yapar.
    (Siparişlerin son 'days_history' günde yapıldığını varsayarak günlük hızı bulur)
    """
    # Her ürün için toplam satışı ve mevcut stoğu çekiyoruz
    sonuclar = db.query(
        Urun.isim,
        Urun.stok,
        func.sum(Siparis.adet).label('toplam_satis')
    ).join(Siparis, Urun.id == Siparis.urun_id) \
     .group_by(Urun.id).all()
    
    tahminler = []
    for isim, stok, satis in sonuclar:
        if satis is None or satis == 0:
            continue
        
        # Günlük ortalama satış hızı
        gunluk_hiz = satis / days_history
        
        # Stok kaç gün yeter?
        kalan_gun = int(stok / gunluk_hiz) if gunluk_hiz > 0 else 999
        
        durum = "Kritik (Acil Üretim)" if kalan_gun <= 7 else "Normal"
        
        tahminler.append({
            "urun_adi": isim,
            "mevcut_stok": stok,
            "gunluk_satis_hizi": round(gunluk_hiz, 2),
            "kalan_gun_tahmini": kalan_gun,
            "durum": durum
        })
        
    # Kalan güne göre aciliyet sırasına diz (en çabuk bitecekler en üstte)
    tahminler.sort(key=lambda x: x["kalan_gun_tahmini"])
    return tahminler

