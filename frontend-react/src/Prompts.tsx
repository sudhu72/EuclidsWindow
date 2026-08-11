import { useEffect, useMemo, useState } from "react";

interface PromptTopic {
  topic_id: string;
  topic_name: string;
  icon: string;
  prompts: string[];
}

interface PromptCategory {
  category_id: string;
  category_name: string;
  color: string;
  topic_count: number;
  prompt_count: number;
  topics: PromptTopic[];
}

interface Collections {
  total_topics: number;
  total_prompts: number;
  categories: PromptCategory[];
}

/**
 * Native port of the classic #tab-collections panel: systematic step-by-step
 * prompt paths, grouped by category and topic. Picking a prompt hands it to the
 * Learn tab, the same deep-link the classic app made through sendTutorQuestion.
 */
export default function Prompts({ onAsk }: { onAsk: (question: string) => void }) {
  const [data, setData] = useState<Collections | null>(null);
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [status, setStatus] = useState("Loading…");

  useEffect(() => {
    void (async () => {
      try {
        const r = await fetch("/api/prompt-collections");
        const d = await r.json();
        if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
        setData(d);
        setStatus("");
      } catch (e) {
        setStatus(`Could not load prompts: ${(e as Error).message}`);
      }
    })();
  }, []);

  const shown = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    return data.categories
      .filter((c) => !category || c.category_id === category)
      .map((c) => ({
        ...c,
        topics: c.topics.filter(
          (t) =>
            !q ||
            t.topic_name.toLowerCase().includes(q) ||
            t.prompts.some((p) => p.toLowerCase().includes(q))
        ),
      }))
      .filter((c) => c.topics.length > 0);
  }, [data, category, query]);

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search topics or prompts…"
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {(data?.categories || []).map((c) => (
            <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
          ))}
        </select>
        <span className="status">
          {status || (data ? `${data.total_topics} topics · ${data.total_prompts} prompts` : "")}
        </span>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Systematic prompt paths that walk a topic from first principles. Pick one and it opens
          in Learn.
        </p>

        {shown.length === 0 && !status && (
          <div className="empty" style={{ margin: "24px auto" }}>Nothing matches that search.</div>
        )}

        {shown.map((c) => (
          <section key={c.category_id} className="pc-cat">
            <h4 className="pc-cat-head">
              <span className="pc-swatch" style={{ background: c.color }} aria-hidden="true" />
              {c.category_name}
              <span className="pc-count">{c.topic_count} topics · {c.prompt_count} prompts</span>
            </h4>

            {c.topics.map((t) => {
              const key = `${c.category_id}/${t.topic_id}`;
              const isOpen = open === key;
              return (
                <div key={key} className="pc-topic">
                  <button
                    className="pc-topic-head"
                    onClick={() => setOpen(isOpen ? null : key)}
                    aria-expanded={isOpen}
                  >
                    <span className="pc-icon" aria-hidden="true">{t.icon || "•"}</span>
                    <span className="pc-topic-name">{t.topic_name}</span>
                    <span className="pc-count">{t.prompts.length}</span>
                    <span className={`pc-caret ${isOpen ? "open" : ""}`} aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <ol className="pc-prompts">
                      {t.prompts.map((p, i) => (
                        <li key={i}>
                          <button className="pc-prompt" onClick={() => onAsk(p)} title="Open in Learn">
                            {p}
                          </button>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
