import { useEffect, useState } from "react";

interface Resource {
  id: string;
  title: string;
  author?: string | null;
  resource_type: string;
  difficulty?: string | null;
  url?: string | null;
  isbn?: string | null;
  description?: string | null;
}

const TYPES: [string, string][] = [
  ["", "All types"],
  ["book", "Books"],
  ["video", "Videos"],
  ["course", "Courses"],
];

const LEVELS: [string, string][] = [
  ["", "All levels"],
  ["beginner", "Beginner"],
  ["intermediate", "Intermediate"],
  ["advanced", "Advanced"],
];

const TYPE_ICON: Record<string, string> = { book: "📘", video: "🎬", course: "🎓" };

/** Native port of the classic #tab-resources panel. */
export default function Resources() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [level, setLevel] = useState("");
  const [items, setItems] = useState<Resource[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [importing, setImporting] = useState(false);

  async function search() {
    setBusy(true);
    setStatus("");
    try {
      const q = new URLSearchParams({ limit: "60" });
      if (query.trim()) q.set("query", query.trim());
      if (type) q.set("resource_type", type);
      if (level) q.set("difficulty", level);
      const r = await fetch(`/api/resources?${q}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setItems(d.resources || []);
      if (!(d.resources || []).length) setStatus("No resources match.");
    } catch (e) {
      setStatus(`Search failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  // Show the full catalogue on arrival rather than an empty panel.
  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function importAwesomeMath() {
    if (importing) return;
    setImporting(true);
    setStatus("Importing from awesome-math…");
    try {
      const r = await fetch("/api/resources/import/awesome-math", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: [], dry_run: false }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setStatus(
        `Matched ${d.matched_count}, imported ${d.imported_count}, already had ${d.existing_count}.`
      );
      await search();
    } catch (e) {
      setStatus(`Import failed: ${(e as Error).message}`);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search books, videos, courses…"
          onKeyDown={(e) => e.key === "Enter" && void search()}
        />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="send" onClick={() => void search()} disabled={busy}>
          {busy ? "…" : "Search"}
        </button>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Curated books, lecture series, and courses. Filter by kind and level, or pull in the
          awesome-math catalogue.
        </p>

        <div className="set-actions" style={{ marginBottom: 14 }}>
          <button className="btn-ghost" onClick={() => void importAwesomeMath()} disabled={importing}>
            {importing ? "Importing…" : "Import from awesome-math"}
          </button>
          {status && <span className="status">{status}</span>}
        </div>

        <div className="res-list">
          {items.map((r) => (
            <article key={r.id} className="res-card">
              <div className="res-head">
                <span className="res-icon" aria-hidden="true">{TYPE_ICON[r.resource_type] || "📄"}</span>
                <div>
                  <h4 className="res-title">
                    {r.url ? (
                      <a href={r.url} target="_blank" rel="noreferrer noopener">{r.title}</a>
                    ) : (
                      r.title
                    )}
                  </h4>
                  {r.author && <div className="res-author">{r.author}</div>}
                </div>
              </div>
              <div className="res-meta">
                <span className="res-pill">{r.resource_type}</span>
                {r.difficulty && <span className="res-pill">{r.difficulty}</span>}
                {r.isbn && <span className="res-isbn">ISBN {r.isbn}</span>}
              </div>
              {r.description && <p className="res-desc">{r.description}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
