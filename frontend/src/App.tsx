import { useState, useRef } from "react";
import "./index.css";

type RAGResponse = {
  intent: string;
  answer: string;
  sources: string[];
};

type UploadedFile = {
  file: File;
  status: "ready" | "indexed" | "error";
};

function FileIcon({ ext }: { ext: string }) {
  return ext === "pdf" ? (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="10" height="14" rx="1.5" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      <path d="M8 1v4h4" stroke="#334155" strokeWidth="1" fill="none"/>
      <rect x="3" y="7" width="6" height="1" rx="0.5" fill="#ef4444" opacity="0.8"/>
      <rect x="3" y="9.5" width="7" height="1" rx="0.5" fill="#475569"/>
      <rect x="3" y="12" width="5" height="1" rx="0.5" fill="#475569"/>
    </svg>
  ) : (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="10" height="14" rx="1.5" fill="#1e293b" stroke="#334155" strokeWidth="1"/>
      <path d="M8 1v4h4" stroke="#334155" strokeWidth="1" fill="none"/>
      <rect x="3" y="7" width="7" height="1" rx="0.5" fill="#22d3ee" opacity="0.8"/>
      <rect x="3" y="9.5" width="6" height="1" rx="0.5" fill="#475569"/>
      <rect x="3" y="12" width="7" height="1" rx="0.5" fill="#475569"/>
    </svg>
  );
}


function App() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<RAGResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Map<string, UploadedFile>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (newFiles: File[]) => {
    setUploadedFiles((prev) => {
      const next = new Map(prev);
      newFiles.forEach((f) => {
        if (!next.has(f.name)) next.set(f.name, { file: f, status: "ready" });
      });
      return next;
    });
  };

  const removeFile = (name: string) => {
    setUploadedFiles((prev) => {
      const next = new Map(prev);
      next.delete(name);
      return next;
    });
  };

  const indexFiles = async () => {
    setIndexing(true);
    const formData = new FormData();
    uploadedFiles.forEach(({ file, status }) => {
      if (status === "ready") formData.append("files", file);
    });
    try {
      await fetch("http://127.0.0.1:8000/index", { method: "POST", body: formData });
      setUploadedFiles((prev) => {
        const next = new Map(prev);
        next.forEach((v, k) => next.set(k, { ...v, status: "indexed" }));
        return next;
      });
    } catch {
      setUploadedFiles((prev) => {
        const next = new Map(prev);
        next.forEach((v, k) => {
          if (v.status === "ready") next.set(k, { ...v, status: "error" });
        });
        return next;
      });
    } finally {
      setIndexing(false);
    }
  };

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
      setResult({ intent: "error", answer: "Cannot connect to backend API.", sources: [] });
    } finally {
      setLoading(false);
    }
  };

  const readyCount = [...uploadedFiles.values()].filter((f) => f.status === "ready").length;
  const indexedCount = [...uploadedFiles.values()].filter((f) => f.status === "indexed").length;
  const hasFiles = uploadedFiles.size > 0;

  const formatSize = (bytes: number) =>
    bytes < 1024 ? `${bytes}B`
    : bytes < 1048576 ? `${(bytes / 1024).toFixed(0)}KB`
    : `${(bytes / 1048576).toFixed(1)}MB`;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-6 py-12">
      <section className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="mb-10 text-center">
          <span className="inline-block mb-4 text-[11px] font-bold tracking-[0.3em] text-cyan-400/80 uppercase">
            Financial RAG
          </span>
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-white">
            Agentic RAG Assistant
          </h1>
          <p className="mt-3 text-slate-500 text-sm">
            Upload financial reports, then ask questions from your knowledge base.
          </p>
        </div>

        {/* Upload zone */}
        <div className="mb-3 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          {/* Drop area */}
          <div
            className={`relative flex flex-col items-center justify-center gap-2 px-6 py-8 cursor-pointer transition-all duration-200
              ${isDragOver ? "bg-cyan-400/5 border-b border-cyan-400/30" : "border-b border-slate-800/60 hover:bg-slate-800/30"}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); handleFiles([...e.dataTransfer.files]); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              hidden
              onChange={(e) => handleFiles([...e.target.files!])}
            />
            {/* Upload icon */}
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
              ${isDragOver ? "bg-cyan-400/20 scale-110" : "bg-slate-800"}`}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 12V4M9 4L6 7M9 4L12 7" stroke={isDragOver ? "#22d3ee" : "#64748b"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 14h12" stroke={isDragOver ? "#22d3ee" : "#475569"} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="text-center">
              <p className={`text-sm font-medium transition-colors ${isDragOver ? "text-cyan-300" : "text-slate-300"}`}>
                {isDragOver ? "Drop to add files" : "Drop files or click to browse"}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">PDF, TXT, MD supported</p>
            </div>
          </div>

          {/* File list */}
          {hasFiles && (
            <div className="px-3 py-2 flex flex-col gap-1">
              {[...uploadedFiles.entries()].map(([name, { file, status }]) => {
                const ext = name.split(".").pop() ?? "txt";
                return (
                  <div key={name} className="group flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-slate-800/50 transition-colors">
                    <FileIcon ext={ext} />
                    <span className="flex-1 text-xs text-slate-400 font-mono truncate">{name}</span>
                    <span className="text-[10px] text-slate-600">{formatSize(file.size)}</span>

                    {/* Status badge */}
                    {status === "indexed" && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block"/>indexed
                      </span>
                    )}
                    {status === "error" && (
                      <span className="text-[10px] font-semibold text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">failed</span>
                    )}
                    {status === "ready" && (
                      <span className="text-[10px] font-semibold text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">ready</span>
                    )}

                    <button
                      onClick={() => removeFile(name)}
                      className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded-md hover:bg-red-500/20 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom action bar */}
          {hasFiles && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800/60">
              <p className="text-xs text-slate-600">
                {indexedCount > 0
                  ? `${indexedCount}/${uploadedFiles.size} indexed`
                  : `${uploadedFiles.size} file${uploadedFiles.size > 1 ? "s" : ""} ready`}
              </p>
              <button
                onClick={indexFiles}
                disabled={indexing || readyCount === 0}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200
                  bg-slate-800 text-slate-300 hover:bg-cyan-400/10 hover:text-cyan-300 border border-slate-700 hover:border-cyan-400/30
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-slate-800 disabled:hover:text-slate-300 disabled:hover:border-slate-700"
              >
                {indexing ? (
                  <>
                    <svg className="animate-spin" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="7 14" strokeLinecap="round"/>
                    </svg>
                    Indexing…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M7 3.5L9.5 6 7 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Index Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Context hint */}
        <div className="flex items-center gap-2 mb-5 px-1">
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${indexedCount > 0 ? "bg-emerald-400" : "bg-slate-700"}`} />
          <p className="text-xs text-slate-600">
            {indexedCount > 0
              ? `${indexedCount} document${indexedCount > 1 ? "s" : ""} in context`
              : "No documents indexed — answering from general knowledge"}
          </p>
        </div>

        {/* Query card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <textarea
            className="h-32 w-full resize-none rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 text-sm text-slate-100 outline-none transition-colors focus:border-cyan-400/50 placeholder:text-slate-700"
            placeholder="e.g. Summarize Apple's revenue breakdown in Q3 2024."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askAgent(); }
            }}
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={askAgent}
              disabled={loading || !question.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200
                bg-cyan-400 text-slate-950 hover:bg-cyan-300 active:scale-95
                disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed disabled:scale-100"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.8" strokeDasharray="8 17" strokeLinecap="round"/>
                  </svg>
                  Thinking…
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7h10M8 3.5L11.5 7 8 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Ask
                </>
              )}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
            <div className="flex items-center gap-2.5 mb-4">
              <span className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Intent</span>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-400/10 text-cyan-300 text-xs font-bold border border-cyan-400/20">
                {result.intent}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-200 mb-2">Answer</h2>
            <p className="text-sm leading-7 text-slate-400">{result.answer}</p>

            {result.sources.length > 0 && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Source</p>
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 text-xs leading-6 text-slate-500 font-mono">
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
