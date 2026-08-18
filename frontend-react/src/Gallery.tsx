import { useEffect, useMemo, useRef, useState } from "react";
import { GALLERY, GALLERY_BASE, type GalleryItem } from "./cogitoData";
import { streamTutor } from "./api";
import Markdown from "./Markdown";

const LEVELS = ["kids", "teen", "college", "adult"];

/**
 * Live level-adapted explanation for a gallery item. The 39 visualizations
 * themselves are fixed, hand-built HTML — hand-authoring 4 levels of prose
 * for each isn't practical — so instead of only a "leave and ask the tutor"
 * link, this streams the same level-aware tutor answer inline, grounded by
 * the concept graph entry that already links this viz (see cogito_concepts.json).
 */
function LevelExplain({ item, level }: { item: GalleryItem; level: string }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setText("");
    setStatus("loading");
    streamTutor(
      item.prompt,
      { learnerLevel: level },
      (tok) => setText((t) => t + tok),
      controller.signal
    )
      .then(() => setStatus("done"))
      .catch((e) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setText(`Could not load an explanation: ${(e as Error).message}`);
      });
    return () => controller.abort();
  }, [item.file, level]);

  return (
    <div className="lg-levels">
      <div className="lg-level-body">
        {status === "loading" && !text && <p className="set-hint">Thinking at the {level} level…</p>}
        <Markdown>{text}</Markdown>
      </div>
    </div>
  );
}

/**
 * Cogito Gallery — the interactive visualizations, browsable by track.
 *
 * Each one is a self-contained HTML page, so it is shown in a sandboxed iframe
 * rather than inlined. `allow-same-origin` is needed because they are served
 * from this origin and load their own fonts and styles; scripts are what makes
 * them interactive at all.
 */
export default function Gallery({ onAsk }: { onAsk: (question: string) => void }) {
  const [open, setOpen] = useState<GalleryItem | null>(null);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("teen");

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return GALLERY;
    return GALLERY.map((c) => ({
      ...c,
      items: c.items.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.one.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q)
      ),
    })).filter((c) => c.items.length > 0);
  }, [query]);

  const total = GALLERY.reduce((n, c) => n + c.items.length, 0);

  if (open) {
    return (
      <div className="lesson">
        <div className="lesson-bar">
          <button className="btn-ghost" onClick={() => setOpen(null)}>
            ‹ Back to gallery
          </button>
          <strong style={{ flex: 1 }}>{open.title}</strong>
          <select value={level} onChange={(e) => setLevel(e.target.value)} title="Learner level" aria-label="Learner level">
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
            ))}
          </select>
          <a
            className="btn-ghost"
            href={`${GALLERY_BASE}${open.file}`}
            target="_blank"
            rel="noreferrer noopener"
          >
            Open in new tab ↗
          </a>
          <button className="send" onClick={() => onAsk(open.prompt)}>
            Explore in Learn
          </button>
        </div>
        <div className="lesson-body">
          <div className="gal-frame-wrap">
            <iframe
              className="gal-frame"
              src={`${GALLERY_BASE}${open.file}`}
              title={open.title}
              sandbox="allow-scripts allow-same-origin allow-popups"
            />
          </div>
          <h4>Explain this at the {level} level</h4>
          <LevelExplain item={open} level={level} />
        </div>
      </div>
    );
  }

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the gallery…"
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)} title="Learner level" aria-label="Learner level">
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <span className="status">
          {query.trim()
            ? `${shown.reduce((n, c) => n + c.items.length, 0)} of ${total}`
            : `${total} visualizations`}
        </span>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Hands-on visualizations adapted from the Feynman-method tutorials. Open one to play with
          it, or send its idea to the tutor.
        </p>

        {shown.length === 0 && (
          <div className="empty" style={{ margin: "24px auto" }}>Nothing matches that search.</div>
        )}

        {shown.map((c) => (
          <section key={c.id} className="gal-cat">
            <h4>{c.title}</h4>
            <p className="set-hint" style={{ margin: "0 0 10px" }}>{c.blurb}</p>
            <div className="gal-grid">
              {c.items.map((item) => (
                <article key={item.file} className="gal-card">
                  <h5>{item.title}</h5>
                  <p>{item.one}</p>
                  <div className="gal-actions">
                    <button className="send" onClick={() => setOpen(item)}>Open ▸</button>
                    <button className="btn-ghost" onClick={() => onAsk(item.prompt)}>
                      Explore in Learn
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
