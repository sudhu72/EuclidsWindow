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

  // Web ingestion (single URL + crawl).
  const [url, setUrl] = useState("");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [depth, setDepth] = useState(2);
  const [breadth, setBreadth] = useState(5);
  const [sameDomain, setSameDomain] = useState(true);
  const [maxPages, setMaxPages] = useState(20);
  const [crawl, setCrawl] = useState<Record<string, unknown> | null>(null);

  async function ingestUrl() {
    const u = url.trim();
    if (!u || busy) return;
    setBusy(true);
    setMsg(`Fetching + indexing ${u}…`);
    try {
      const r = await fetch("/api/library/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setMsg(`Added ${d.source} — ${d.chunks} chunks.`);
      setUrl("");
      await load();
    } catch (e) {
      setMsg(`URL failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function startCrawl() {
    const u = crawlUrl.trim();
    if (!u || busy) return;
    setMsg("");
    setCrawl({ status: "starting", pages: 0, ingested: 0, chunks: 0, done: false });
    try {
      const r = await fetch("/api/library/crawl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u, depth, breadth, same_domain: sameDomain, max_pages: maxPages }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
    } catch (e) {
      setCrawl({ status: "error", error: (e as Error).message, done: true });
      return;
    }
    const poll = setInterval(async () => {
      try {
        const d = await (await fetch(`/api/library/crawl/status?url=${encodeURIComponent(u)}`)).json();
        const c = d.crawls;
        if (c && Object.keys(c).length) {
          setCrawl(c);
          if (c.done) {
            clearInterval(poll);
            await load();
          }
        }
      } catch {
        /* keep polling */
      }
    }, 1500);
  }

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
          Upload files, or add from the web (a page, a PDF, or crawl a whole site). Lessons,
          Discover, and the tutor ground their answers in this material and cite the source.
        </p>

        <h4>Add from the web</h4>
        <form className="ask-row" onSubmit={(e) => { e.preventDefault(); void ingestUrl(); }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…  (a web page or a PDF link)"
            disabled={busy}
          />
          <button type="submit" className="send" disabled={busy || !url.trim()}>Add URL</button>
        </form>

        <details className="crawl-box">
          <summary>Crawl a site (follow links)</summary>
          <div className="crawl-form">
            <input
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              placeholder="Start URL, e.g. https://…"
            />
            <label>Depth
              <input type="number" min={0} max={3} value={depth} onChange={(e) => setDepth(+e.target.value)} />
            </label>
            <label>Breadth
              <input type="number" min={1} max={20} value={breadth} onChange={(e) => setBreadth(+e.target.value)} />
            </label>
            <label>Max pages
              <input type="number" min={1} max={100} value={maxPages} onChange={(e) => setMaxPages(+e.target.value)} />
            </label>
            <label className="crawl-check">
              <input type="checkbox" checked={sameDomain} onChange={(e) => setSameDomain(e.target.checked)} />
              same domain only
            </label>
            <button className="send" onClick={() => void startCrawl()} disabled={!crawlUrl.trim() || (!!crawl && !crawl.done)}>
              Crawl
            </button>
          </div>
          {crawl && (
            <div className="crawl-status">
              {crawl.error ? (
                <span className="anim-err">Crawl failed: {String(crawl.error)}</span>
              ) : (
                <>
                  {crawl.done ? "✓ Done" : "⏳ Crawling"} — {String(crawl.ingested ?? 0)} pages,{" "}
                  {String(crawl.chunks ?? 0)} chunks
                  {crawl.current && !crawl.done ? <span className="crawl-cur"> · {String(crawl.current)}</span> : null}
                  {crawl.skipped_robots ? ` · ${String(crawl.skipped_robots)} blocked by robots.txt` : ""}
                </>
              )}
            </div>
          )}
        </details>

        <h4 style={{ marginTop: 18 }}>Your library</h4>
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
