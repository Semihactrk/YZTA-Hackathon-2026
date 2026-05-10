import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import database

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

instruction = """
Sen Toprak Ana Kadın Kooperatifi'nin Akıllı Asistanısın.
Görevlerin:
1. Ürün bilgisi/stok sorulursa 'get_product_stock' fonksiyonunu kullan. Stok 10'un altındaysa 'KRİTİK STOK' uyarısı yap.
2. Sipariş durumu sorulursa 'get_order_status' fonksiyonunu kullan. Durum 'Gecikti' ise özür dile ve 'KOOP10' kuponunu sun.
"""

chat = client.chats.create(
    model="gemini-3.1-flash-lite",
    config=types.GenerateContentConfig(
        system_instruction=instruction,
        tools=[database.get_product_stock, database.get_order_status],
    )
)

def get_agent_response(user_input):
    response = chat.send_message(user_input)
    return response.text