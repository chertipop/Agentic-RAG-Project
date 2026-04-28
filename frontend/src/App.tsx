import { useState } from "react";
import "./index.css";

type RAGResponse = {
  intent: string;
  answer: string;
  sources: string[];
};

function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const askAgent = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });

      const data: RAGResponse = await response.json();
      setResult(data);
    } catch {
      setResult({
        intent: "error",
        answer: "Cannot connect to backend API.",
        sources: [],
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-10">
      <section className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <p className="mb-3 text-sm font-semibold tracking-[0.3em] text-cyan-400">
            FINANCIAL RAG
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            Agentic RAG Assistant
          </h1>
          <p className="mt-4 text-slate-400">
            Ask questions from your local financial reports and knowledge base.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <textarea
            className="h-36 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 p-4 text-base text-slate-100 outline-none transition focus:border-cyan-400"
            placeholder="Ask something, e.g. Summarize Apple's business model."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                askAgent();
              }
            }}
          />

          <div className="mt-5 flex justify-center">
            <button
              onClick={askAgent}
              disabled={loading}
              className="rounded-2xl bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-600 disabled:text-slate-300"
            >
              {loading ? "Thinking..." : "Ask"}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <div className="mb-5">
              <span className="text-sm font-semibold text-slate-400">
                Intent
              </span>
              <span className="ml-3 rounded-full bg-cyan-400/10 px-3 py-1 text-sm font-bold text-cyan-300">
                {result.intent}
              </span>
            </div>

            <h2 className="text-2xl font-bold">Answer</h2>
            <p className="mt-3 leading-8 text-slate-200">{result.answer}</p>

            {result.sources.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-slate-300">Source</h3>
                <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950 p-4 text-sm leading-7 text-slate-400">
                  {result.sources[0]}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;