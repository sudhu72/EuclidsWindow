import { useEffect, useRef, useState } from "react";

type Source = { type: string; value: string; label: string };
type Status = {
  running: boolean;
  current: string;
  queued: number;
  visited: number;
  sources: Source[];
  stats: { ingested: number; chunks: number; errors: number };
  started_at?: string | null;
  last_activity?: string | null;
};

// Continuous crawler: press Start and it keeps finding + ingesting open math
// books/notes from your sources into the library until you press Stop.
export default function AutoLearn({ onChange }: { onChange?: () => void }) {
  const [st, setSt] = useState<Status | null>(null);
  const [url, setUrl] = useState("");
  const timer = useRef<number | undefined>(undefined);

  async function load() {
    try {
      setSt(await (await fetch("/api/learn/status")).json());
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    void load();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  useEffect(() => {
    if (st?.running && !timer.current) {
      timer.current = window.setInterval(() => {
        void load();
        onChange?.(); // refresh the doc list as new material lands
      }, 3000);
    } else if (!st?.running && timer.current) {
      clearInterval(timer.current);
      timer.current = undefined;
    }
  }, [st?.running]); // eslint-disable-line react-hooks/exhaustive-deps

  const post = async (path: string, body?: unknown) =>
    setSt(
      await (
        await fetch(path, {
          method: "POST",
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        })
      ).json()
    );

  async function addSource() {
    const v = url.trim();
    if (!v) return;
    await post("/api/learn/sources", { value: v });
    setUrl("");
  }

  const stats = st?.stats;

  return (
    <div className="autolearn">
      <div className="al-head">
        <h4>Auto-learn from the web</h4>
        {st?.running ? (
          <button className="send al-stop" onClick={() => void post("/api/learn/stop")}>■ Stop</button>
        ) : (
          <button className="send" onClick={() => void post("/api/learn/start")}>▶ Start</button>
        )}
      </div>
      <p className="dsub">
        Point it at pages, PDFs, or GitHub repos (e.g. an awesome-math list). Once started it keeps
        crawling and ingesting math material into your library until you stop it.
      </p>

      {st && (
        <div className={`al-status ${st.running ? "on" : ""}`}>
          {st.running ? "⏳ Learning" : "◼ Idle"} — <b>{stats?.ingested ?? 0}</b> pages,{" "}
          <b>{stats?.chunks ?? 0}</b> chunks · queue {st.queued} · seen {st.visited}
          {stats?.errors ? ` · ${stats.errors} skipped` : ""}
          {st.running && st.current ? <div className="al-cur">→ {st.current}</div> : null}
        </div>
      )}

      <form className="ask-row al-add" onSubmit={(e) => { e.preventDefault(); void addSource(); }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Add a source: https://…  or  https://github.com/owner/repo"
        />
        <button type="submit" className="send" disabled={!url.trim()}>Add source</button>
      </form>

      {st?.sources?.length ? (
        <ul className="al-sources">
          {st.sources.map((s) => (
            <li key={s.value}>
              <span>{s.type === "github" ? "⑂" : "🔗"} {s.label}</span>
              <button className="link" onClick={() => void post("/api/learn/sources/remove", { value: s.value })}>
                remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
