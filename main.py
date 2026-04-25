from fastapi import FastAPI
from pydantic import BaseModel
from rag_agent import RAGAgent
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
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