import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import database
import crud

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Gemini için veritabanı bağlantılı wrapper fonksiyonlar
def check_product_stock_tool(item_name: str) -> dict:
    """Verilen ürün ismine göre stok bilgisini kontrol eder."""
    db = database.SessionLocal()
    try:
        return crud.get_product_stock(item_name, db)
    finally:
        db.close()

def check_order_status_tool(order_id: int) -> dict:
    """Sipariş ID'sine göre kargo ve sipariş durumunu kontrol eder."""
    db = database.SessionLocal()
    try:
        return crud.check_order_status(order_id, db)
    finally:
        db.close()

def predict_stock_depletion_tool() -> list:
    """Satış hızına (velocity) dayalı olarak stokların kaç gün içinde tükeneceğini tahmin eder."""
    db = database.SessionLocal()
    try:
        return crud.predict_stock_depletion(db)
    finally:
        db.close()

instruction = """
Sen Toprak Ana Kadın Kooperatifi'nin Akıllı Asistanısın.
Görevlerin:
1. Ürün bilgisi/stok sorulursa 'check_product_stock_tool' fonksiyonunu kullan. Stok 10'un altındaysa 'KRİTİK STOK' uyarısı yap.
2. Sipariş durumu sorulursa 'check_order_status_tool' fonksiyonunu kullan. Durum 'Gecikti' ise özür dile ve 'KOOP10' kuponunu sun.
3. Hangi stogun ne zaman biteceği, stok tahmini veya satış hızı sorulursa 'predict_stock_depletion_tool' fonksiyonunu kullan. 7 günden az kalan ürünler için 'ACİL ÜRETİM' uyarısı yap.
"""

chat = client.chats.create(
    model="gemini-2.5-flash", # Updated to a valid model name
    config=types.GenerateContentConfig(
        system_instruction=instruction,
        tools=[check_product_stock_tool, check_order_status_tool, predict_stock_depletion_tool],
    )
)

def get_agent_response(user_input):
    response = chat.send_message(user_input)
    return response.text