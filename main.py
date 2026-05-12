from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from agents import get_agent_response
import crud
import database
from database import Urun, Siparis
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS Ayarları:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Her yerden gelen isteğe izin ver
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST vb. tüm metodlara izin ver
    allow_headers=["*"],  # Tüm headerlara izin ver
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class ChatRequest(BaseModel):
    message: str

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
    """Taha'nın dashboard'da kırmızı uyarıları göstereceği endpoint"""
    # 1. Kritik Stoklu Ürünler (Stok < 10)
    kritik_urunler = db.query(Urun).filter(Urun.stok < 10).all()
    stok_alarmlari = [{"urun_adi": u.isim, "kalan_stok": u.stok} for u in kritik_urunler]

    # 2. Geciken Siparişler
    geciken_siparisler = db.query(Siparis).filter(Siparis.durum == "Gecikti").all()
    kargo_alarmlari = [{"siparis_id": s.id, "urun_adi": s.urun.isim} for s in geciken_siparisler]

    return {
        "stok_alarmlari": stok_alarmlari,
        "kargo_alarmlari": kargo_alarmlari,
        "toplam_risk_sayisi": len(stok_alarmlari) + len(kargo_alarmlari)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)