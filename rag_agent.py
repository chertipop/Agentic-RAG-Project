import os
from collections import OrderedDict

from langchain_community.vectorstores import FAISS
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_text_splitters import CharacterTextSplitter


class RAGAgent:
    def __init__(self):
        self.cache = OrderedDict()
        self.cache_limit = 50

        data_folder = "data"
        documents = []

        if os.path.exists(data_folder):
            for file_name in os.listdir(data_folder):
                file_path = os.path.join(data_folder, file_name)

                if file_name.endswith(".txt"):
                    loader = TextLoader(file_path, encoding="utf-8")
                    documents.extend(loader.load())

                elif file_name.endswith(".pdf"):
                    loader = PyPDFLoader(file_path)
                    documents.extend(loader.load())

        self.splitter = CharacterTextSplitter(
            chunk_size=800,
            chunk_overlap=100
        )

        self.embeddings = OllamaEmbeddings(model="nomic-embed-text")

        chunks = self.splitter.split_documents(documents)

        if len(chunks) > 0:
            self.vectorstore = FAISS.from_documents(chunks, self.embeddings)
        else:
            self.vectorstore = FAISS.from_texts(["init"], self.embeddings)

        self.llm = ChatOllama(
            model="phi3",
            temperature=0.2
        )

    # ---------------------------
    # 🔥 FAST ANSWER GENERATION
    # ---------------------------
    def generate_answer(self, query: str, context: str):
        prompt = f"""
Answer using the context. If not found, say you don't know.

{context}

Q: {query}
A:
"""
        response = self.llm.invoke(prompt)
        return response.content.strip()

    # ---------------------------
    # 🔥 MAIN RUN (optimized)
    # ---------------------------
    def run(self, query: str):
        key = query.strip().lower()

        # ✅ CACHE HIT
        if key in self.cache:
            return self.cache[key]

        # 🔍 RETRIEVE (เร็วขึ้น)
        docs = self.vectorstore.similarity_search(query, k=2)

        # ✂️ ลด context ให้สั้นลง
        context = "\n".join([d.page_content[:500] for d in docs])

        # 🤖 GENERATE
        answer = self.generate_answer(query, context)

        result = {
            "intent": "search",
            "answer": answer,
            "sources": [docs[0].page_content] if docs else []
        }

        # 💾 SAVE CACHE (limit size)
        self.cache[key] = result
        if len(self.cache) > self.cache_limit:
            self.cache.popitem(last=False)

        return result

    # ---------------------------
    # 📥 INGEST NEW FILES
    # ---------------------------
    def ingest_files(self, file_paths):
        new_docs = []

        for path in file_paths:
            if path.endswith(".txt"):
                loader = TextLoader(path, encoding="utf-8")
            elif path.endswith(".pdf"):
                loader = PyPDFLoader(path)
            else:
                continue

            new_docs.extend(loader.load())

        if not new_docs:
            return

        chunks = self.splitter.split_documents(new_docs)

        # ➕ เพิ่มเข้า vector DB
        self.vectorstore.add_documents(chunks)

        # 🔥 สำคัญมาก: clear cache
        self.cache.clear()

        print(f"✅ Indexed {len(chunks)} chunks")