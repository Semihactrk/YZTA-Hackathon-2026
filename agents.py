import os
from dotenv import load_dotenv
from google import genai
from google.genai import types
import database
import crud
from vector_db import vector_store
import requests


def send_telegram_alert(message: str):
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN")
    chat_id = os.getenv("TELEGRAM_CHAT_ID")

    if not bot_token or not chat_id:
        print("Telegram API anahtarları eksik!")
        return {"hata": "API anahtarları eksik"}  # Tutarlı dönüş için

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {"chat_id": chat_id, "text": message}

    try:
        response = requests.post(url, json=payload)
        return response.json()  
    except Exception as e:
        print(f"Telegram hatası: {e}")
        return {"hata": str(e)}

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# db baglantili araclar
def check_product_stock_tool(item_name: str) -> dict:
    db = database.SessionLocal()
    try:
        return crud.get_product_stock(item_name, db)
    finally:
        db.close()

def check_order_status_tool(order_id: int) -> dict:
    db = database.SessionLocal()
    try:
        return crud.check_order_status(order_id, db)
    finally:
        db.close()

def predict_stock_depletion_tool() -> list:
    db = database.SessionLocal()
    try:
        return crud.predict_stock_depletion(db)
    finally:
        db.close()

def get_producer_story_tool(query: str) -> dict:
    """
    Kullanıcı üretici kadınların, kooperatiflerin hikayelerini veya geçmişini sorduğunda bu aracı kullanarak Vector DB (Bilgi Bankası) üzerinde semantik arama yap.
    """
    try:
        results = vector_store.search(query, top_k=1)
        if isinstance(results, str):
            return {"hata": results}
        return results[0] if results else {"mesaj": "Hikaye bulunamadı."}
    except Exception as e:
        return {"hata": str(e)}

# satis ajani - sadece urun/stok
sales_instruction = """
Sen Toprak Ana Kadın Kooperatifi'nin 'Satış ve Ürün' Uzmanısın, ayrıca üreticilerin hikayelerini de bilirsin.
Görevlerin:
1. Ürün bilgisi veya stok sorulursa 'check_product_stock_tool' kullan.
2. Üretici kadınların veya kooperatiflerin hikayeleri sorulursa 'get_producer_story_tool' kullanıp onlara ilham verici hikayelerini anlat.
3. Stok 10'un altındaysa mutlaka 'KRİTİK STOK' uyarısı yap.
4. Sipariş veya kargo ile ilgilenme.
"""
sales_agent = client.chats.create(
    model="gemini-3.1-flash-lite",
    config=types.GenerateContentConfig(
        system_instruction=sales_instruction,
        tools=[check_product_stock_tool, get_producer_story_tool],
    )
)

# operasyon ajanı - gecikme ve analiz uzmanı
ops_instruction = """
Sen Toprak Ana Kadın Kooperatifi'nin 'Operasyon ve Analitik' Uzmanısın.
ÖNCELİKLİ GÖREVİN:
1. Sipariş durumu sorulursa 'check_order_status_tool' kullan[cite: 2, 22].
2. EĞER sipariş durumu 'Gecikti' ise:
   - Çok içten ve nazik bir dille özür dile.
   - Telafi olarak müşteriye özel 'KOOP10' kupon kodunu tanımlandığını belirt[cite: 2, 35].
   - Gecikme nedenini (operasyonel yoğunluk vb.) belirterek güven tazele.
3. Analitik Sorgular: Stok tahmini veya satış hızı sorulursa 'predict_stock_depletion_tool' kullan[cite: 2, 26].
   - 7 günden az kalan ürünler için mutlaka 'ACİL ÜRETİM' uyarısı yap.
"""
ops_agent = client.chats.create(
    model="gemini-3.1-flash-lite",
    config=types.GenerateContentConfig(
        system_instruction=ops_instruction,
        tools=[check_order_status_tool, predict_stock_depletion_tool],
    )
)


def get_agent_response(user_input: str) -> str:
    orchestrator_prompt = f"""
    Gelen mesaja gore sadece SATIS veya OPERASYON yaz.

    KRITIK KURALLAR:
    - urun var mi, fiyat, anlik stok durumu -> SATIS
    - hikaye, kadin ureticiler, kooperatif kim, anlat -> SATIS
    - kargo, siparis durumu, KOOP10 kuponu -> OPERASYON
    - TAHMIN, ANALIZ, URETIM PLANI, NE ZAMAN BITER -> OPERASYON

    Mesaj: {user_input}
    """

    # 1. Önce karar veriliyor
    routing_decision = client.models.generate_content(
        model="gemini-3.1-flash-lite",
        contents=orchestrator_prompt,
    ).text.strip().upper()

    print(f"--> yonlendirme: {routing_decision}")

    # 2. Karara göre ajana gidiliyor ve fonksiyon burada bitiyor
    if "OPERASYON" in routing_decision:
        yanit = ops_agent.send_message(user_input).text
    else:
        yanit = sales_agent.send_message(user_input).text
        
    # Logu veritabanına kaydet
    db = database.SessionLocal()
    try:
        crud.create_agent_log(
            kullanici_mesaji=user_input,
            yonlendirme_karari=routing_decision,
            ajan_yaniti=yanit,
            db=db
        )
    except Exception as e:
        print(f"Log kaydedilemedi: {e}")
    finally:
        db.close()
        
    return yanit
