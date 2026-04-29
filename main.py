from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from rag_agent import RAGAgent
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import os

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

UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class Query(BaseModel):
    question: str

@app.post("/search")
def search(query: Query):
    result = agent.run(query.question)
    return result

@app.post("/index")
async def index_files(files: list[UploadFile] = File(...)):
    file_paths = []

    for file in files:
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as f:
            f.write(await file.read())

        file_paths.append(file_path)

    # 🔥 ให้ agent อ่านไฟล์
    agent.ingest_files(file_paths)

    return {"status": "indexed"}

@app.get("/")
def root():
    return {"message": "Agentic RAG API is running"}

@app.get("/health")
def health():
    return {"status": "ok"}