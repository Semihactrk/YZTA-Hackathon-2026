import os
import numpy as np
from google import genai
from sklearn.metrics.pairwise import cosine_similarity
from database import SessionLocal, Kooperatif
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

class SimpleVectorDB:
    def __init__(self):
        self.embeddings = None
        self.documents = []
        self.metadata = []
        self.initialized = False

    def initialize(self):
        """Veritabanındaki kooperatif hikayelerini çekip hafızada vektör boyutuna çevirir"""
        db = SessionLocal()
        kooperatifler = db.query(Kooperatif).all()
        db.close()

        if not kooperatifler:
            return

        self.documents = [k.hikaye for k in kooperatifler]
        self.metadata = [{"id": k.id, "isim": k.isim, "lokasyon": k.lokasyon} for k in kooperatifler]

        try:
            response = client.models.embed_content(
                model="gemini-embedding-001",
                contents=self.documents
            )
            # Gemini embeddings formatını parse edip numpy array'e dönüştürüyoruz
            embeddings_list = [emb.values for emb in response.embeddings]
            self.embeddings = np.array(embeddings_list)
            self.initialized = True
            print("INFO:     Vector DB basariyla initialize edildi.")
        except Exception as e:
            print(f"ERROR:    Vector DB baslatma hatasi: {e}")

    def search(self, query: str, top_k: int = 1):
        """Verilen metne göre vektörel semantik arama yapar"""
        if not self.initialized:
            self.initialize()
        
        if not self.initialized or self.embeddings is None:
            return "Bilgi bankasında henüz hikaye yok veya embedding alınamadı."

        try:
            # Sorguyu vektöre çevir
            query_response = client.models.embed_content(
                model="gemini-embedding-001",
                contents=query
            )
            query_emb = np.array([query_response.embeddings[0].values])

            # Cosine similarity hesapla
            sims = cosine_similarity(query_emb, self.embeddings)[0]
            top_indices = np.argsort(sims)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                results.append({
                    "kooperatif_isim": self.metadata[idx]["isim"],
                    "lokasyon": self.metadata[idx]["lokasyon"],
                    "hikaye": self.documents[idx],
                    "benzerlik_skoru": float(sims[idx])
                })
            return results
        except Exception as e:
            return f"Arama sırasında hata: {e}"

# Tekil instance
vector_store = SimpleVectorDB()
