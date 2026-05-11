from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import Urun, Siparis, Kooperatif

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
