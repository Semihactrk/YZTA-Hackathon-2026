from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from agents import get_agent_response
import crud
import database
from database import Urun, Siparis
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# 1. CORS AYARLARI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. DEPENDENCY
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 3. MODELLER (Pydantic)
class ChatRequest(BaseModel):
    message: str

# 4. ENDPOINTLER

@app.get("/products")
async def get_all_products(db: Session = Depends(get_db)):
    return db.query(Urun).all()

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    reply = get_agent_response(request.message)
    return {"reply": reply}

@app.get("/analytics/top-selling")
def top_selling_products(db: Session = Depends(get_db)):
    return crud.get_top_5_selling_products(db)

@app.get("/analytics/stock-predictions")
def stock_predictions(db: Session = Depends(get_db)):
    return crud.predict_stock_depletion(db)

@app.get("/alerts")
def get_system_alerts(db: Session = Depends(get_db)):
    kritik_urunler = db.query(Urun).filter(Urun.stok < 10).all()
    stok_alarmlari = [{"urun_adi": u.isim, "kalan_stok": u.stok} for u in kritik_urunler]

    geciken_siparisler = db.query(Siparis).filter(Siparis.durum == "Gecikti").all()
    kargo_alarmlari = [{"siparis_id": s.id, "urun_adi": s.urun.isim} for s in geciken_siparisler]

    return {
        "stok_alarmlari": stok_alarmlari,
        "kargo_alarmlari": kargo_alarmlari,
        "toplam_risk_sayisi": len(stok_alarmlari) + len(kargo_alarmlari)
    }

# 5. SERVER START
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

