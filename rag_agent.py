from langchain_community.chat_models import ChatOllama
from langchain_community.embeddings import OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, ChatOllama

class RAGAgent:
    def __init__(self):
        # โหลด data
        with open("data/docs.txt", "r", encoding="utf-8") as f:
            text = f.read()

        # split
        chunks = [text[i:i+500] for i in range(0, len(text), 500)]

        # embeddings
        embeddings = OllamaEmbeddings(model="nomic-embed-text")

        # vector db
        self.vectorstore = FAISS.from_texts(chunks, embeddings)

        # LLM (local)
        self.llm = ChatOllama(model="llama3")

    def run(self, query: str):
        # retrieve
        docs = self.vectorstore.similarity_search(query, k=3)
        context = "\n".join([doc.page_content for doc in docs])

        prompt = f"""
        Answer the question based only on the context below.

        Explain clearly and naturally in English.
        Do not repeat the same sentence directly from the context.
        Summarize in your own words.
        If the answer is not found in the context, say: "I could not find the answer in the provided context."

        Context:
        {context}

        Question:
        {query}
        """

        # generate
        response = self.llm.invoke(prompt)

        return {
            "answer": response.content,
            "sources": [doc.page_content[:100] for doc in docs]
        }