import { useEffect, useRef, useState } from "react";
import renderMathInElement from "katex/contrib/auto-render";
import { EXERCISES, TIERS, STAGE_ORDER, type Exercise } from "./aibyhandData";
import { BYHAND_CHECKS } from "./aibyhandChecks";

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

/** A small "predict and check" quiz, one per exercise, built only from
 *  numbers already given (and already verified) in that exercise's own
 *  by-hand walkthrough — this tests recall of a real computation, it never
 *  introduces a new unverified number. */
function TryItYourself({ exId }: { exId: string }) {
  const check = BYHAND_CHECKS[exId];
  const [values, setValues] = useState<string[]>(() => (check ? check.fields.map(() => "") : []));
  const [result, setResult] = useState<"idle" | "correct" | "wrong">("idle");
  const [showAnswer, setShowAnswer] = useState(false);

  if (!check) return null;

  function submit() {
    const ok = check.fields.every((f, i) => {
      const v = parseFloat(values[i]);
      return !Number.isNaN(v) && Math.abs(v - f.answer) <= f.tolerance;
    });
    setResult(ok ? "correct" : "wrong");
  }

  return (
    <div className="abh-tryit">
      <div className="abh-tryit-h">✏️ Try it yourself</div>
      <Html html={check.prompt} />
      <div className="abh-tryit-fields">
        {check.fields.map((f, i) => (
          <label key={i} className="set-row" style={{ maxWidth: 260 }}>
            <span>{f.label}</span>
            <input
              type="number"
              step="any"
              value={values[i]}
              onChange={(e) => {
                const next = values.slice();
                next[i] = e.target.value;
                setValues(next);
                setResult("idle");
              }}
            />
          </label>
        ))}
      </div>
      <div className="set-actions">
        <button className="send" onClick={submit}>Check my answer</button>
        <button className="btn-ghost" onClick={() => setShowAnswer((s) => !s)}>
          {showAnswer ? "Hide answer" : "Show answer"}
        </button>
      </div>
      {result === "correct" && <div className="lg-verdict lg-tautology">✓ {check.successMsg}</div>}
      {result === "wrong" && (
        <div className="lg-verdict lg-contingent">
          Not quite — recheck the arithmetic in the steps above and try again.
        </div>
      )}
      {showAnswer && (
        <div className="lg-note">
          {check.fields.map((f, i) => (
            <div key={i}>{f.label} = {f.answer}</div>
          ))}
        </div>
      )}
    </div>
  );
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
            {key === "byhand" && <TryItYourself key={ex.id} exId={ex.id} />}
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
