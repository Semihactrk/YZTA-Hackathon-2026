from fastapi import FastAPI
from pydantic import BaseModel
from agents import get_agent_response

app = FastAPI()


class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):

    reply = get_agent_response(request.message)
    return {"reply": reply}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)