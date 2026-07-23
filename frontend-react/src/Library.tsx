import { useEffect, useRef, useState } from "react";

type Doc = { source: string; chunks: number };
type Hit = { text: string; source: string; page: number; distance: number };

// Reference library (RAG) manager — upload books/notes so lessons and the tutor
// can ground answers in them. Reuses EuclidsWindow's /api/library endpoints.
export default function Library() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[] | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function load() {
    try {
      setDocs(await (await fetch("/api/library/docs")).json());
    } catch {
      /* ignore */
    }
  }
  useEffect(() => {
    void load();
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setMsg(`Ingesting ${file.name}…`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/library/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setMsg(`Added ${d.source}: ${d.chunks} chunks.`);
      await load();
    } catch (e) {
      setMsg(`Upload failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(source: string) {
    setBusy(true);
    try {
      await fetch(`/api/library/docs/${encodeURIComponent(source)}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function search() {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    setHits(null);
    try {
      const d = await (await fetch(`/api/library/search?q=${encodeURIComponent(q)}&k=5`)).json();
      setHits(d.results || []);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.markdown"
          onChange={(e) => e.target.files?.[0] && void upload(e.target.files[0])}
          disabled={busy}
          style={{ flex: 1 }}
        />
        <span className="status">{msg}</span>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Upload textbooks, notes, or papers (PDF / txt / md). Lessons, Discover, and the tutor
          will ground their answers in them — and cite the source.
        </p>

        <h4>Your library</h4>
        {docs.length === 0 ? (
          <div className="empty" style={{ margin: "8px 0" }}>Nothing uploaded yet.</div>
        ) : (
          <ul className="lib-list">
            {docs.map((d) => (
              <li key={d.source}>
                <span>📄 {d.source} <em>· {d.chunks} chunks</em></span>
                <button className="link" onClick={() => void remove(d.source)} disabled={busy}>
                  remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <h4 style={{ marginTop: 18 }}>Search the library</h4>
        <form className="ask-row" onSubmit={(e) => { e.preventDefault(); void search(); }}>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search your uploaded material…" />
          <button type="submit" className="send" disabled={busy || !query.trim()}>Search</button>
        </form>
        {hits && (
          <div className="lib-hits">
            {hits.length === 0 && <div className="dsub">No matches.</div>}
            {hits.map((h, i) => (
              <div key={i} className="lib-hit">
                <div className="lib-hit-meta">{h.source} · p.{h.page} · distance {h.distance?.toFixed(2)}</div>
                <div className="lib-hit-text">{h.text.slice(0, 320)}…</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
