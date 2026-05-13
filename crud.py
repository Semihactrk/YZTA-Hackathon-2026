from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from database import Urun, Siparis, Kooperatif, AjanLog 


# --- AJAN VE GÜVENLİK (HERMES) ---
def create_agent_log(kullanici_mesaji: str, yonlendirme_karari: str, ajan_yaniti: str, db: Session):
    """Hermes Öz-Denetim kapsamında ajan kararlarını loglar."""
    yeni_log = AjanLog(
        kullanici_mesaji=kullanici_mesaji,
        yonlendirme_karari=yonlendirme_karari,
        ajan_yaniti=ajan_yaniti
    )
    db.add(yeni_log)
    db.commit()
    db.refresh(yeni_log)
    return yeni_log


# --- TEMEL VERİ İŞLEMLERİ (CHATBOT ARAÇLARI) ---
def get_product_stock(item_name: str, db: Session):
    """Ürün ismine göre stok çeker."""
    urun = db.query(Urun).filter(Urun.isim.ilike(f"%{item_name}%")).first()
    if urun:
        return {"urun_adi": urun.isim, "stok": urun.stok, "stok_durumu": "Kritik" if urun.stok < 10 else "Yeterli"}
    return {"hata": f"[{item_name}] isimli ürün bulunamadı."}


def check_order_status(order_id: int, db: Session):
    """Sipariş durumunu sorgular."""
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


# --- BİLGİ BANKASI VE ANALİTİK ---
def search_coop_story(query: str, db: Session):
    """ RAG görevinden gelen üretici hikayelerini sorgular."""
    kooperatifler = db.query(Kooperatif).filter(Kooperatif.hikaye.ilike(f"%{query}%")).all()
    sonuclar = []
    for koop in kooperatifler:
        sonuclar.append({
            "kooperatif_isim": koop.isim,
            "lokasyon": koop.lokasyon,
            "hikaye": koop.hikaye
        })
    return sonuclar if sonuclar else [{"hata": "Bu konseptte bir kooperatif hikayesi bulunamadı."}]


def predict_stock_depletion(db: Session, days_history: int = 30):
    """Satış hızına göre stok bitiş tahmini yapar."""
    sonuclar = db.query(
        Urun.isim,
        Urun.stok,
        func.sum(Siparis.adet).label('toplam_satis')
    ).join(Siparis, Urun.id == Siparis.urun_id).group_by(Urun.id).all()

    tahminler = []
    for isim, stok, satis in sonuclar:
        if not satis: continue
        gunluk_hiz = satis / days_history
        kalan_gun = int(stok / gunluk_hiz) if gunluk_hiz > 0 else 999
        tahminler.append({
            "urun_adi": isim,
            "mevcut_stok": stok,
            "kalan_gun_tahmini": kalan_gun,
            "durum": "Kritik (Acil Üretim)" if kalan_gun <= 7 else "Normal"
        })
    tahminler.sort(key=lambda x: x["kalan_gun_tahmini"])
    return tahminler


# --- STRATEJİK GÖREV: LOJİSTİK ANALİZ ---
def get_logistics_performance_report(db: Session):
    """Kargo performans analizi ve risk raporlama."""
    siparisler = db.query(Siparis).all()
    stats = {}

    for s in siparisler:
        firma = s.kargo_firmasi if hasattr(s, 'kargo_firmasi') and s.kargo_firmasi else "Belirtilmemiş"
        if firma not in stats:
            stats[firma] = {"toplam": 0, "gecikme": 0}

        stats[firma]["toplam"] += 1
        if s.durum == "Gecikti":
            stats[firma]["gecikme"] += 1

    report = []
    for firma, veri in stats.items():
        oran = (veri["gecikme"] / veri["toplam"]) * 100 if veri["toplam"] > 0 else 0
        risk = "YÜKSEK RİSK" if oran > 10 else "STABİL"
        report.append({
            "kargo_firmasi": firma,
            "gecikme_orani": f"%{oran:.1f}",
            "risk_durumu": risk,
            "analiz": f"{firma} firması için operasyonel risk: {risk}."
        })
    return report
