import requests
import os
from dotenv import load_dotenv
from database import SessionLocal, Urun, Kooperatif

load_dotenv() # .env dosyasını yükler
API_KEY = os.getenv("GEMINI_API_KEY") # Anahtarı güvenli şekilde çeker


def urunleri_sorgula():
    db = SessionLocal()
    try:
        urunler = db.query(Urun).all()
        return "\n".join([f"- {u.isim}: {u.birim_fiyat} TL (Stok: {u.stok})" for u in urunler])
    except Exception as e:
        return "Ürünler şu an listelenemiyor."
    finally:
        db.close()


def kooperatif_bilgisi_getir():
    db = SessionLocal()
    try:
        koops = db.query(Kooperatif).all()
        return "\n".join([f"- {k.isim}: {k.hikaye}" for k in koops])
    except Exception as e:
        return "Kooperatif bilgisi alınamadı."
    finally:
        db.close()


def get_chat_response(user_input):
    db_urunler = urunleri_sorgula()
    db_kooperatifler = kooperatif_bilgisi_getir()

    # 3.1 Flash-Lite: Kuralcı ve hızlı versiyon
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={API_KEY}"

    prompt = f"""
    Sen Hataylı kadın kooperatiflerini temsil eden 'Toprak Ana' asistanısın. 

    ÖNEMLİ KURAL: 
    Eğer bir ürünün stoğu 10'dan az ise (mesela Nar Ekşisi), cevabında MUTLAKA "Stoklarımız tükenmek üzere, acele edin!" uyarısını yap.

    VERİLER:
    {db_kooperatifler}
    {db_urunler}

    Soru: {user_input}
    """

    try:
        response = requests.post(url, json={"contents": [{"parts": [{"text": prompt}]}]})
        return response.json()["candidates"][0]["content"]["parts"][0]["text"]
    except:
        return "Bağlantı hatası oluştu."