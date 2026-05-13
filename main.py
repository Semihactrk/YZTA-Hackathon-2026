from fastapi import FastAPI, Depends, HTTPException
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, desc
from agents import get_agent_response, send_telegram_alert
import crud
import database
from database import Urun, Siparis, Kooperatif, Kullanici
from fastapi.middleware.cors import CORSMiddleware
from crud import get_logistics_performance_report
from contextlib import asynccontextmanager


# 1. LIFESPAN (STARTUP/SHUTDOWN) TANIMLAMASI
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Uygulama açılırken yapılacaklar
    print("Toprak Ana Sistemi Başlatılıyor...")
    yield
    # Uygulama kapanırken yapılacaklar
    print("Sistem Kapatılıyor...")


# 2. APP NESNESİNİN TEK SEFERDE OLUŞTURULMASI
app = FastAPI(lifespan=lifespan)

# 3. STATİK DOSYALAR VE CORS AYARLARI (TEK APP ÜZERİNE)
app.mount("/urun_foto", StaticFiles(directory="urun_foto"), name="urun_foto")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# 4. DEPENDENCY
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 5. MODELLER (Pydantic)
class ChatRequest(BaseModel):
    message: str


class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str


class ProductCreate(BaseModel):
    isim: str
    stok: int = 0
    birim_fiyat: float = 0.0
    kooperatif_id: Optional[int] = None


class OrderCreate(BaseModel):
    urun_id: int
    adet: int = 1
    musteri_adi: Optional[str] = None


# 6. ENDPOINTLER

@app.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    mevcut = db.query(Kullanici).filter(Kullanici.email == req.email).first()
    if mevcut:
        raise HTTPException(status_code=400, detail="Bu e-posta adresi zaten kayıtlı.")
    yeni_kullanici = Kullanici(isim=req.name, email=req.email, sifre=req.password)
    db.add(yeni_kullanici)
    db.commit()
    db.refresh(yeni_kullanici)
    return {"success": True, "message": "Kayıt başarılı"}


@app.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    kullanici = db.query(Kullanici).filter(Kullanici.email == req.email, Kullanici.sifre == req.password).first()
    if not kullanici:
        raise HTTPException(status_code=401, detail="Hatalı kullanıcı adı veya şifre")

    return {
        "success": True,
        "token": f"mock-token-{kullanici.id}",
        "user": {
            "id": kullanici.id,
            "name": kullanici.isim,
            "email": kullanici.email,
            "role": kullanici.rol
        }
    }


# 6.1 Ürünler (Products)
@app.get("/products")
def get_all_products(db: Session = Depends(get_db)):
    rows = db.query(Urun).options(joinedload(Urun.kooperatif)).all()
    return [
        {
            "id": u.id,
            "isim": u.isim,
            "stok": u.stok,
            "birim_fiyat": u.birim_fiyat,
            "kooperatif_id": u.kooperatif_id,
            "kooperatif_isim": u.kooperatif.isim if u.kooperatif else None,
        }
        for u in rows
    ]


@app.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    u = db.query(Urun).options(joinedload(Urun.kooperatif)).filter(Urun.id == product_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {
        "id": u.id,
        "isim": u.isim,
        "stok": u.stok,
        "birim_fiyat": u.birim_fiyat,
        "kooperatif_id": u.kooperatif_id,
        "kooperatif_isim": u.kooperatif.isim if u.kooperatif else None,
        "kooperatif_hikaye": u.kooperatif.hikaye if u.kooperatif else None,
        "kooperatif_lokasyon": u.kooperatif.lokasyon if u.kooperatif else None,
    }


@app.post("/products")
def create_product(body: ProductCreate, db: Session = Depends(get_db)):
    urun = Urun(isim=body.isim, stok=body.stok, birim_fiyat=body.birim_fiyat, kooperatif_id=body.kooperatif_id)
    db.add(urun)
    db.commit()
    db.refresh(urun)
    return {"id": urun.id, "isim": urun.isim}


@app.put("/products/{product_id}")
def update_product(product_id: int, body: ProductCreate, db: Session = Depends(get_db)):
    urun = db.query(Urun).filter(Urun.id == product_id).first()
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    urun.isim = body.isim
    urun.stok = body.stok
    urun.birim_fiyat = body.birim_fiyat
    urun.kooperatif_id = body.kooperatif_id
    db.commit()
    db.refresh(urun)
    return {"id": urun.id, "isim": urun.isim}


@app.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    urun = db.query(Urun).filter(Urun.id == product_id).first()
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    db.delete(urun)
    db.commit()
    return {"ok": True}


# 6.2 Siparişler (Orders)
@app.get("/orders")
def get_all_orders(db: Session = Depends(get_db)):
    rows = db.query(Siparis).options(joinedload(Siparis.urun)).order_by(desc(Siparis.id)).all()
    return [
        {
            "id": s.id,
            "urun_id": s.urun_id,
            "urun_adi": s.urun.isim if s.urun else None,
            "adet": s.adet,
            "durum": s.durum,
            "kargo_no": s.kargo_no,
            "siparis_tarihi": s.siparis_tarihi.isoformat() if s.siparis_tarihi else None,
            "toplam_fiyat": round(s.adet * s.urun.birim_fiyat, 2) if s.urun else None,
        }
        for s in rows
    ]


@app.post("/orders")
def create_order(body: OrderCreate, db: Session = Depends(get_db)):
    urun = db.query(Urun).filter(Urun.id == body.urun_id).first()
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    if urun.stok < body.adet:
        raise HTTPException(status_code=400, detail="Yetersiz stok")
    urun.stok -= body.adet
    siparis = Siparis(urun_id=body.urun_id, adet=body.adet, durum="Hazırlanıyor")
    db.add(siparis)
    db.commit()
    db.refresh(siparis)
    return {
        "siparis_id": siparis.id,
        "urun_adi": urun.isim,
        "adet": siparis.adet,
        "durum": siparis.durum,
        "toplam_fiyat": round(siparis.adet * urun.birim_fiyat, 2),
    }


# 6.3 Kooperatifler (Cooperatives)
@app.get("/cooperatives")
def get_cooperatives(db: Session = Depends(get_db)):
    return [
        {"id": k.id, "isim": k.isim, "lokasyon": k.lokasyon, "hikaye": k.hikaye}
        for k in db.query(Kooperatif).all()
    ]


# 6.4 Chat (AI Multi-Agent)
@app.post("/chat")
def chat_endpoint(request: ChatRequest):
    reply = get_agent_response(request.message)
    return {"reply": reply}


# 6.5 Analitik (Analytics)
@app.get("/analytics/top-selling")
def top_selling_products(db: Session = Depends(get_db)):
    results = (
        db.query(
            Urun.isim,
            func.sum(Siparis.adet).label("toplam_satis"),
            Urun.stok,
        )
        .join(Siparis, Urun.id == Siparis.urun_id)
        .group_by(Urun.id)
        .order_by(desc("toplam_satis"))
        .limit(5)
        .all()
    )
    return [
        {"urun_adi": isim, "toplam_satis": int(satis), "mevcut_stok": stok}
        for isim, satis, stok in results
    ]


@app.get("/analytics/stock-predictions")
def stock_predictions(db: Session = Depends(get_db)):
    return crud.predict_stock_depletion(db)


# 6.6 Uyarılar (Alerts)
@app.get("/alerts")
def get_system_alerts(db: Session = Depends(get_db)):
    kritik_urunler = db.query(Urun).filter(Urun.stok < 10).all()
    stok_alarmlari = [{"urun_adi": u.isim, "kalan_stok": u.stok} for u in kritik_urunler]

    geciken_siparisler = db.query(Siparis).options(joinedload(Siparis.urun)).filter(Siparis.durum == "Gecikti").all()
    kargo_alarmlari = [{"siparis_id": s.id, "urun_adi": s.urun.isim if s.urun else "?"} for s in geciken_siparisler]

    if len(stok_alarmlari) > 0:
        msg = f"⚠️ Dikkat! {len(stok_alarmlari)} ürün kritik stok seviyesinde! Hemen kontrol et."
        send_telegram_alert(msg)

    return {
        "stok_alarmlari": stok_alarmlari,
        "kargo_alarmlari": kargo_alarmlari,
        "toplam_risk_sayisi": len(stok_alarmlari) + len(kargo_alarmlari),
    }


# 6.7 Lojistik Rapor (Admin)
@app.get("/admin/logistics-report")
def read_logistics_report(db: Session = Depends(get_db)):
    report = get_logistics_performance_report(db)
    for firma in report:
        if "YÜKSEK RİSK" in firma["risk_durumu"]:
            mesaj = f"⚠️ LOJİSTİK RİSK UYARISI: {firma['kargo_firmasi']} firmasında gecikme oranı %{firma['gecikme_orani']} seviyesine çıktı!"
            send_telegram_alert(mesaj)
    return report


# 7. SERVER START
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
