import { useEffect, useMemo, useState } from "react";

interface Topic {
  id: string;
  name: string;
  icon: string;
  prompts: string[];
  category_id?: string;
  category_name?: string;
  category_color?: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  topics: Topic[];
}

/**
 * Map of Mathematics — the curated fields, each holding its topics and their
 * prompt paths. Picking a prompt opens it in Learn.
 *
 * The API also returns x/y percentages per category, but several overlap
 * (Music at 12,2 and Signal Processing at 14,4), so absolute placement would
 * collide. The classic page ignored them too and rendered in document order;
 * this does the same, in a responsive grid.
 */
export default function MathMap({ onAsk }: { onAsk: (question: string) => void }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Topic[] | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [status, setStatus] = useState("Loading the map…");

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/mathmap");
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
        setCats(d.categories || []);
        setStatus("");
      } catch (e) {
        setStatus(`Could not load the map: ${(e as Error).message}`);
      }
    })();
  }, []);

  // Search runs server-side so it spans prompts too, not just topic names.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setHits(null);
      return;
    }
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const r = await fetch(`/api/mathmap/search?query=${encodeURIComponent(q)}`);
          const d = await r.json();
          setHits(d.results || []);
        } catch {
          setHits([]);
        }
      })();
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const totals = useMemo(() => {
    const topics = cats.reduce((n, c) => n + c.topics.length, 0);
    const prompts = cats.reduce(
      (n, c) => n + c.topics.reduce((m, t) => m + t.prompts.length, 0),
      0
    );
    return { topics, prompts };
  }, [cats]);

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the map — topics and prompts…"
        />
        <span className="status">
          {status || `${cats.length} fields · ${totals.topics} topics · ${totals.prompts} prompts`}
        </span>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          The territory, field by field. Open a topic to see the prompt path that walks it from
          first principles.
        </p>

        {hits ? (
          <>
            <h4>{hits.length} match{hits.length === 1 ? "" : "es"}</h4>
            {hits.length === 0 && <div className="empty" style={{ margin: "16px auto" }}>Nothing found.</div>}
            <div className="mm-hits">
              {hits.map((t) => (
                <button key={t.id} className="mm-topic" onClick={() => setTopic(t)}>
                  <span className="mm-icon" style={{ color: t.category_color }}>{t.icon}</span>
                  <span>
                    <strong>{t.name}</strong>
                    <em>{t.category_name} · {t.prompts.length} prompts</em>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="mm-grid">
            {cats.map((c) => (
              <section key={c.id} className="mm-cat" style={{ borderTopColor: c.color }}>
                <h4 style={{ color: c.color }}>{c.name}</h4>
                <div className="mm-topics">
                  {c.topics.map((t) => (
                    <button
                      key={t.id}
                      className="mm-topic"
                      onClick={() => setTopic({ ...t, category_name: c.name, category_color: c.color })}
                    >
                      <span className="mm-icon" style={{ color: c.color }}>{t.icon}</span>
                      <span>
                        <strong>{t.name}</strong>
                        <em>{t.prompts.length} prompts</em>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {topic && (
          <div className="mm-detail">
            <h4>
              <span style={{ color: topic.category_color }}>{topic.icon}</span> {topic.name}
            </h4>
            <p className="set-hint" style={{ margin: "2px 0 10px" }}>
              {topic.category_name}
            </p>
            <ol className="pc-prompts" style={{ paddingLeft: 26 }}>
              {topic.prompts.map((p, i) => (
                <li key={i}>
                  <button className="pc-prompt" onClick={() => onAsk(p)} title="Open in Learn">
                    {p}
                  </button>
                </li>
              ))}
            </ol>
            <button className="link" onClick={() => setTopic(null)}>close</button>
          </div>
        )}
      </div>
    </div>
  );
}
