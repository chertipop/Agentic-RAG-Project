from fastapi import FastAPI
from pydantic import BaseModel
from rag_agent import RAGAgent
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = RAGAgent()

class Query(BaseModel):
    question: str

@app.post("/search")
def search(query: Query):
    result = agent.run(query.question)
    return result

@app.get("/")
def root():
    return {"message": "Agentic RAG API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}