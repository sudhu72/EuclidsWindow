import { Fragment, useMemo, useState } from "react";
import { SYMBOLS, SYMBOL_CATEGORIES, type MathSymbol } from "./symbolsData";

/**
 * Render the only markup the symbol prose uses — <em> and <strong> — as real
 * elements. The data is authored in-repo, but parsing the two tags we actually
 * use keeps this off dangerouslySetInnerHTML entirely.
 */
function Prose({ children }: { children: string }) {
  const parts = children.split(/(<\/?(?:em|strong)>)/);
  const out: React.ReactNode[] = [];
  let em = false;
  let strong = false;
  parts.forEach((part, i) => {
    if (part === "<em>") return void (em = true);
    if (part === "</em>") return void (em = false);
    if (part === "<strong>") return void (strong = true);
    if (part === "</strong>") return void (strong = false);
    if (!part) return;
    let node: React.ReactNode = part;
    if (em) node = <em key={`e${i}`}>{node}</em>;
    if (strong) node = <strong key={`s${i}`}>{node}</strong>;
    out.push(<Fragment key={i}>{node}</Fragment>);
  });
  return <>{out}</>;
}

function matches(s: MathSymbol, q: string): boolean {
  if (!q) return true;
  return (
    s.glyph.toLowerCase().includes(q) ||
    s.name.toLowerCase().includes(q) ||
    s.cat.toLowerCase().includes(q) ||
    (s.topics || []).some((t) => t.toLowerCase().includes(q)) ||
    (s.meanings || []).some(
      (m) => m.field.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
    ) ||
    (s.history || "").toLowerCase().includes(q)
  );
}

/** Native port of the classic #tab-symbols panel. */
export default function Symbols() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("all");
  const [picked, setPicked] = useState<number | null>(null);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SYMBOLS.map((s, idx) => ({ s, idx })).filter(
      ({ s }) => (cat === "all" || s.cat === cat) && matches(s, q)
    );
  }, [query, cat]);

  const detail = picked !== null ? SYMBOLS[picked] : null;

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search symbols, meanings, history…"
        />
        <span className="status">{shown.length} of {SYMBOLS.length}</span>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Where each symbol came from, what it means in different branches of mathematics,
          and where those meanings collide.
        </p>

        <div className="chips">
          {SYMBOL_CATEGORIES.map(([id, label]) => (
            <button
              key={id}
              className={`chip ${cat === id ? "active" : ""}`}
              onClick={() => {
                setCat(id);
                setPicked(null);
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <div className="empty" style={{ margin: "24px auto" }}>No symbols match your search.</div>
        ) : (
          <div className="sym-grid">
            {shown.map(({ s, idx }) => (
              <button
                key={idx}
                className={`sym-card ${picked === idx ? "active" : ""}`}
                onClick={() => setPicked(picked === idx ? null : idx)}
                title={s.name}
              >
                <span className="sym-glyph">{s.glyph}</span>
                <span className="sym-name">{s.name}</span>
              </button>
            ))}
          </div>
        )}

        {detail && (
          <div className="sym-detail">
            <div className="sym-detail-glyph">{detail.glyph}</div>
            <h4>{detail.name}</h4>
            {detail.latex && (
              <div className="sym-latex">
                LaTeX: <code>{detail.latex}</code>
              </div>
            )}

            {detail.history && (
              <section className="sym-section">
                <h5>History</h5>
                <div className="sym-box"><Prose>{detail.history}</Prose></div>
              </section>
            )}

            {detail.meanings && detail.meanings.length > 0 && (
              <section className="sym-section">
                <h5>Meanings &amp; usage</h5>
                <ul className="sym-meanings">
                  {detail.meanings.map((m, i) => (
                    <li key={i}>
                      <strong>{m.field}:</strong> <Prose>{m.desc}</Prose>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {detail.overlap && (
              <section className="sym-section">
                <h5>Overlapping meanings &amp; pitfalls</h5>
                <div className="sym-box sym-box-warn"><Prose>{detail.overlap}</Prose></div>
              </section>
            )}

            {detail.topics && detail.topics.length > 0 && (
              <section className="sym-section">
                <h5>Topics where used</h5>
                <div className="sym-tags">
                  {detail.topics.map((t) => (
                    <span key={t} className="sym-tag">{t}</span>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
