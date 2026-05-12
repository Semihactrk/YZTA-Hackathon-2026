from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from agents import get_agent_response
import crud
import database
from database import Urun, Siparis
from fastapi.middleware.cors import CORSMiddleware
import requests
from crud import get_logistics_performance_report
from agents import send_telegram_alert


def send_telegram_alert(message: str):
    api_token = "8883330952:AAFlrrPKR_EgvOL54vfcDhN3OJLP2be5t3A"
    chat_id = "7058214912"

    url = f"https://api.telegram.org/bot{api_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": f"🚀 **Toprak Ana Uyarısı:**\n\n{message}",
        "parse_mode": "Markdown"
    }

    try:
        response = requests.post(url, json=payload)
        return response.json()
    except Exception as e:
        print(f"Telegram hatası: {e}")

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


@app.get("/admin/logistics-report")
def read_logistics_report(db: Session = Depends(get_db)):
    report = get_logistics_performance_report(db)

    # Stratejik Plan: Kritik risk varsa Telegram'dan yöneticiye fırlat
    for firma in report:
        if "YÜKSEK RİSK" in firma["risk_durumu"]:
            mesaj = f"⚠️ LOJİSTİK RİSK UYARISI: {firma['kargo_firmasi']} firmasında gecikme oranı %{firma['gecikme_orani']} seviyesine çıktı!"
            send_telegram_alert(mesaj)  # Plana sadık kalarak bildirimi gönderiyoruz

    return report
@app.get("/alerts")
def get_system_alerts(db: Session = Depends(get_db)):

    kritik_urunler = db.query(Urun).filter(Urun.stok < 10).all()
    stok_alarmlari = [{"urun_adi": u.isim, "kalan_stok": u.stok} for u in kritik_urunler]

    geciken_siparisler = db.query(Siparis).filter(Siparis.durum == "Gecikti").all()
    kargo_alarmlari = [{"siparis_id": s.id, "urun_adi": s.urun.isim} for s in geciken_siparisler]

    # 2. Telegram Bildirimi
    if len(stok_alarmlari) > 0:
        msg = f"⚠️ Dikkat! {len(stok_alarmlari)} ürün kritik stok seviyesinde! Hemen kontrol et."
        send_telegram_alert(msg)

    return {
        "stok_alarmlari": stok_alarmlari,
        "kargo_alarmlari": kargo_alarmlari,
        "toplam_risk_sayisi": len(stok_alarmlari) + len(kargo_alarmlari)
    }
# 5. SERVER START
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

