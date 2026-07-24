import { useEffect, useRef, useState } from "react";
import renderMathInElement from "katex/contrib/auto-render";
import { EXERCISES, TIERS, STAGE_ORDER, type Exercise } from "./aibyhandData";

// The stage strings are curated HTML (tables, steps) with \(...\) math, so we
// inject them and typeset with KaTeX after render.
function Html({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    try {
      renderMathInElement(ref.current, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "$$", right: "$$", display: true },
        ],
        throwOnError: false,
      });
    } catch {
      /* KaTeX optional */
    }
  }, [html]);
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: html }} />;
}

function Walkthrough({ ex, onBack }: { ex: Exercise; onBack: () => void }) {
  return (
    <div className="lesson-body">
      <button className="abh-back" onClick={onBack}>← All exercises</button>
      <div className="abh-ex-head">
        <span className="abh-tier-badge">{ex.tier}</span>
        <h3>{ex.title}</h3>
        <p className="abh-ex-one">{ex.oneLiner}</p>
        <p className="abh-ex-pre">Builds on: {ex.prereqs.join(" · ")}</p>
      </div>
      {STAGE_ORDER.map(([key, label]) => (
        <div className="abh-stage" key={key}>
          <div className="abh-stage-h">{label}</div>
          <div className="abh-stage-b">
            <Html html={ex.stages[key]} />
          </div>
        </div>
      ))}
      <div className="abh-stage abh-connect">
        <div className="abh-stage-h">⑥ Connections (basic → advanced)</div>
        <div className="abh-stage-b">
          <b>Rests on:</b> {ex.stages.connect.back.join(" · ")}
          <br />
          <b>Unlocks:</b> {ex.stages.connect.forward.join(" · ")}
        </div>
      </div>
    </div>
  );
}

export default function AiByHand() {
  const [openId, setOpenId] = useState<string | null>(null);
  const open = EXERCISES.find((e) => e.id === openId) || null;

  if (open) {
    return (
      <div className="lesson">
        <Walkthrough ex={open} onBack={() => setOpenId(null)} />
      </div>
    );
  }

  return (
    <div className="lesson">
      <div className="lesson-body">
        <div className="abh-intro">
          <h3>AI by Hand — discover it yourself</h3>
          <p>
            19 ideas, each rebuilt the Feynman way: start from math you know, work a
            <b> tiny example by hand</b>, then <b>derive the rule yourself</b> and see how it
            connects. Every number is verified. Pick one and build it.
          </p>
        </div>
        {TIERS.map((tier) => (
          <div className="abh-tier" key={tier}>
            <h4 className="abh-tier-title">{tier}</h4>
            <div className="abh-grid">
              {EXERCISES.filter((e) => e.tier === tier).map((e) => (
                <button key={e.id} className="abh-card" onClick={() => setOpenId(e.id)}>
                  <span className="abh-card-title">{e.title}</span>
                  <span className="abh-card-one">{e.oneLiner}</span>
                  <span className="abh-card-pre">needs: {e.prereqs.join(" · ")}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
