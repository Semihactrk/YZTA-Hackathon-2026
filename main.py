from fastapi import FastAPI, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from agents import get_agent_response
import crud
import database

app = FastAPI()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)