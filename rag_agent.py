from langchain_community.vectorstores import FAISS
from langchain_ollama import OllamaEmbeddings, ChatOllama
from langchain_text_splitters import CharacterTextSplitter

class RAGAgent:
    def __init__(self):
        with open("data/docs.txt", "r", encoding="utf-8") as f:
            text = f.read()

        splitter = CharacterTextSplitter(
            chunk_size=500,
            chunk_overlap=50
        )
        chunks = splitter.split_text(text)

        embeddings = OllamaEmbeddings(model="nomic-embed-text")
        self.vectorstore = FAISS.from_texts(chunks, embeddings)

        self.llm = ChatOllama(
            model="llama3",
            temperature=0.2
        )

    def classify_intent(self, query: str) -> str:
        prompt = f"""
Classify the user's question into one of these intents:

1. summary - if the user asks to summarize
2. compare - if the user asks to compare things
3. risk - if the user asks about risks, problems, limitations, disadvantages
4. future - if the user asks about future trends
5. search - for general factual questions

Return only one word: summary, compare, risk, future, or search.

Question:
{query}
"""
        response = self.llm.invoke(prompt)
        return response.content.strip().lower()

    def retrieve_context(self, query: str, intent: str):
        if intent == "summary":
            docs = self.vectorstore.similarity_search(query, k=5)

        elif intent == "compare":
            docs = self.vectorstore.similarity_search(query, k=5)

        elif intent == "risk":
            docs = self.vectorstore.similarity_search(
                query + " risks problems limitations disadvantages",
                k=4
            )

        elif intent == "future":
            docs = self.vectorstore.similarity_search(
                query + " future trends transformation collaboration",
                k=4
            )

        else:
            docs = self.vectorstore.similarity_search(query, k=3)

        return docs

    def generate_answer(self, query: str, context: str, intent: str):
        prompt = f"""
You are an Agentic RAG assistant.

Your task type is: {intent}

Answer the question based only on the context below.

Rules:
- Answer clearly in English.
- Use only the provided context.
- Do not make up information.
- If the answer is not found in the context, say:
  "I could not find the answer in the provided context."
- If task type is summary, summarize the key ideas.
- If task type is compare, compare the relevant concepts clearly.
- If task type is risk, focus on risks or limitations.
- If task type is future, focus on future trends.

Context:
{context}

Question:
{query}

Answer:
"""
        response = self.llm.invoke(prompt)
        return response.content

    def run(self, query: str):
        intent = self.classify_intent(query)

        allowed_intents = ["summary", "compare", "risk", "future", "search"]
        if intent not in allowed_intents:
            intent = "search"

        docs = self.retrieve_context(query, intent)
        context = "\n\n".join([doc.page_content for doc in docs])

        answer = self.generate_answer(query, context, intent)

        return {
            "intent": intent,
            "answer": answer,
            "sources": [doc.page_content for doc in docs]
        }