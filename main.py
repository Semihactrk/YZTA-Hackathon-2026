from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from agents import get_agent_response
import crud
import database
from database import Urun, Siparis, init_db

app = FastAPI(title="Toprak Ana API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatRequest(BaseModel):
    message: str

class ProductCreate(BaseModel):
    isim: str
    stok: int
    birim_fiyat: float
    kooperatif_id: Optional[int] = None

class OrderCreate(BaseModel):
    urun_id: int
    adet: int = 1
    musteri_adi: Optional[str] = None  # stored in kargo_no for MVP simplicity

# ---------------------------------------------------------------------------
# EXISTING endpoints – untouched
# ---------------------------------------------------------------------------
@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    reply = get_agent_response(request.message)
    return {"reply": reply}

@app.get("/analytics/top-selling")
def top_selling_products(db: Session = Depends(get_db)):
    """Geçmiş verilere bakarak en çok satan 5 ürünü listeler."""
    return crud.get_top_5_selling_products(db)

@app.get("/analytics/stock-predictions")
def stock_predictions(db: Session = Depends(get_db)):
    """Satış hızına dayalı stok bitiş tahmini yapar."""
    return crud.predict_stock_depletion(db)

@app.get("/alerts")
def get_system_alerts(db: Session = Depends(get_db)):
    """Critical stock and delayed-order alerts for the admin dashboard."""
    kritik_urunler = db.query(Urun).filter(Urun.stok < 10).all()
    stok_alarmlari = [{"urun_adi": u.isim, "kalan_stok": u.stok} for u in kritik_urunler]

    geciken_siparisler = db.query(Siparis).filter(Siparis.durum == "Gecikti").all()
    kargo_alarmlari = [{"siparis_id": s.id, "urun_adi": s.urun.isim} for s in geciken_siparisler]

    return {
        "stok_alarmlari": stok_alarmlari,
        "kargo_alarmlari": kargo_alarmlari,
        "toplam_risk_sayisi": len(stok_alarmlari) + len(kargo_alarmlari),
    }

# ---------------------------------------------------------------------------
# NEW – minimal product endpoints (admin + customer catalog)
# ---------------------------------------------------------------------------
@app.get("/products")
def list_products(db: Session = Depends(get_db)):
    """Return all products with cooperative info."""
    products = db.query(Urun).all()
    return [
        {
            "id": p.id,
            "isim": p.isim,
            "stok": p.stok,
            "birim_fiyat": p.birim_fiyat,
            "kooperatif_id": p.kooperatif_id,
            "kooperatif_isim": p.kooperatif.isim if p.kooperatif else None,
        }
        for p in products
    ]

@app.get("/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Urun).filter(Urun.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    return {
        "id": p.id,
        "isim": p.isim,
        "stok": p.stok,
        "birim_fiyat": p.birim_fiyat,
        "kooperatif_id": p.kooperatif_id,
        "kooperatif_isim": p.kooperatif.isim if p.kooperatif else None,
        "kooperatif_hikaye": p.kooperatif.hikaye if p.kooperatif else None,
        "kooperatif_lokasyon": p.kooperatif.lokasyon if p.kooperatif else None,
    }

@app.post("/products", status_code=201)
def create_product(body: ProductCreate, db: Session = Depends(get_db)):
    urun = Urun(**body.model_dump())
    db.add(urun)
    db.commit()
    db.refresh(urun)
    return {"id": urun.id, "isim": urun.isim}

@app.put("/products/{product_id}")
def update_product(product_id: int, body: ProductCreate, db: Session = Depends(get_db)):
    p = db.query(Urun).filter(Urun.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    for k, v in body.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return {"id": p.id, "isim": p.isim}

@app.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Urun).filter(Urun.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    db.delete(p)
    db.commit()

@app.get("/orders")
def list_orders(db: Session = Depends(get_db)):
    """Return all orders for the admin panel."""
    orders = db.query(Siparis).all()
    return [
        {
            "id": o.id,
            "urun_id": o.urun_id,
            "urun_adi": o.urun.isim if o.urun else None,
            "adet": o.adet,
            "durum": o.durum,
            "kargo_no": o.kargo_no,
            "siparis_tarihi": o.siparis_tarihi.isoformat() if o.siparis_tarihi else None,
            "toplam_fiyat": (o.adet * o.urun.birim_fiyat) if o.urun else None,
        }
        for o in orders
    ]

@app.post("/orders", status_code=201)
def create_order(body: OrderCreate, db: Session = Depends(get_db)):
    """Place an order (customer checkout). Decrements stock automatically."""
    urun = db.query(Urun).filter(Urun.id == body.urun_id).first()
    if not urun:
        raise HTTPException(status_code=404, detail="Ürün bulunamadı")
    if urun.stok < body.adet:
        raise HTTPException(status_code=400, detail="Yetersiz stok")
    urun.stok -= body.adet

    siparis = Siparis(
        urun_id=body.urun_id,
        adet=body.adet,
        durum="Hazırlanıyor",
        kargo_no=body.musteri_adi,  
    )
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
@app.get("/cooperatives")
def list_cooperatives(db: Session = Depends(get_db)):
    from database import Kooperatif
    coops = db.query(Kooperatif).all()
    return [{"id": c.id, "isim": c.isim, "lokasyon": c.lokasyon, "hikaye": c.hikaye} for c in coops]

@app.on_event("startup")
def on_startup():
    init_db()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)