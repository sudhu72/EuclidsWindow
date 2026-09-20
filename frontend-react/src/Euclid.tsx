import { useEffect, useState } from "react";

interface Entry {
  id: string;
  reference: string;
  book: number;
  entry_type: string;
  number: number;
  original_text: string;
  modern_text?: string | null;
}

const BOOKS: [string, string][] = [
  ["", "All books"],
  ["1", "I — Plane Geometry"],
  ["2", "II — Geometric Algebra"],
  ["3", "III — Circles"],
  ["4", "IV — Inscribed Figures"],
  ["5", "V — Proportion Theory"],
  ["6", "VI — Similar Figures"],
  ["7", "VII — Number Theory"],
  ["8", "VIII — Continued Proportions"],
  ["9", "IX — Primes & Perfect Numbers"],
  ["10", "X — Irrational Magnitudes"],
  ["11", "XI — Solid Geometry"],
  ["12", "XII — Method of Exhaustion"],
  ["13", "XIII — Platonic Solids"],
];

const TYPES: [string, string][] = [
  ["", "All types"],
  ["definition", "Definitions"],
  ["postulate", "Postulates"],
  ["common_notion", "Common notions"],
  ["proposition", "Propositions"],
];

const TYPE_LABEL: Record<string, string> = {
  definition: "Definition",
  postulate: "Postulate",
  common_notion: "Common notion",
  proposition: "Proposition",
};

/**
 * Euclid's Elements — the axiomatic source the whole app is named after.
 * Each entry shows Euclid's own wording and a modern restatement, and can be
 * handed to the tutor.
 */
export default function Euclid({ onAsk }: { onAsk: (question: string) => void }) {
  const [query, setQuery] = useState("");
  const [book, setBook] = useState("");
  const [type, setType] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function search() {
    setBusy(true);
    setStatus("");
    try {
      const q = new URLSearchParams({ limit: "60" });
      if (query.trim()) q.set("query", query.trim());
      if (book) q.set("book", book);
      if (type) q.set("entry_type", type);
      const r = await fetch(`/api/euclid?${q}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setEntries(d.entries || []);
      if (!(d.entries || []).length) setStatus("Nothing matches.");
    } catch (e) {
      setStatus(`Search failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  // Runs on mount too, which populates the list on arrival. The text box waits
  // for Enter or the button so it does not query on every keystroke.
  useEffect(() => {
    void search();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, type]);

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the Elements…"
          onKeyDown={(e) => e.key === "Enter" && void search()}
        />
        <select value={book} onChange={(e) => setBook(e.target.value)}>
          {BOOKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)}>
          {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button className="send" onClick={() => void search()} disabled={busy}>
          {busy ? "…" : "Search"}
        </button>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          The <em>Elements</em>, as Euclid wrote it and as we would say it now — 2,300 years of
          deriving everything from a handful of self-evident starting points.
        </p>
        {status && <div className="status" style={{ marginBottom: 10 }}>{status}</div>}

        <div className="euc-list">
          {entries.map((e) => (
            <article key={e.id} className="euc-entry">
              <div className="euc-head">
                <span className="euc-ref">{e.reference}</span>
                <span className="res-pill">{TYPE_LABEL[e.entry_type] || e.entry_type}</span>
                <button
                  className="link"
                  onClick={() => onAsk(`Explain Euclid's ${TYPE_LABEL[e.entry_type] || e.entry_type} ${e.reference}: ${e.original_text}`)}
                >
                  explain this
                </button>
              </div>
              <blockquote className="euc-original">{e.original_text}</blockquote>
              {e.modern_text && <p className="euc-modern">{e.modern_text}</p>}
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
