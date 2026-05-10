from fastapi import FastAPI
from agents import get_chat_response

# Uvicorn tam olarak bu 'app' ismini arıyor
app = FastAPI()

@app.get("/")
def read_root():
    return {"durum": "Toprak Ana API Çalışıyor"}

@app.post("/chat")
async def chat(message: str):
    response = get_chat_response(message)
    return {"cevap": response}