import { useMemo, useState } from "react";
import Markdown from "./Markdown";
import { safeEvaluator, truthTable, type TruthTable } from "./logic";
import {
  ARGUMENT_EXAMPLES,
  COPY,
  GATE_PUZZLES,
  KNAVE_PUZZLES,
  LEVELS,
  SYLLOGISMS,
  type ArgumentExample,
  type Level,
} from "./logicData";

type Game = "truthtable" | "syllogism" | "knights" | "gates" | "argument";

const GAMES: [Game, string][] = [
  ["truthtable", "Truth Tables"],
  ["syllogism", "Syllogisms"],
  ["knights", "Knights & Knaves"],
  ["gates", "Logic Gates"],
  ["argument", "Argument Builder"],
];

/** Shared chrome for each game: brief, the game itself, note, level prose. */
function GameShell({
  game,
  onAsk,
  children,
}: {
  game: Game;
  onAsk: (q: string) => void;
  children: React.ReactNode;
}) {
  const copy = COPY[game];
  const [level, setLevel] = useState<Level>("kids");
  if (!copy) return <>{children}</>;
  return (
    <>
      <h3 className="lesson-title">{copy.title}</h3>
      <p className="dsub">{copy.subtitle}</p>

      <div className="lg-prereq">
        <Markdown>{copy.prereq}</Markdown>
        <button className="link" onClick={() => onAsk(copy.prompt)}>
          Explore this in Learn →
        </button>
      </div>

      {children}

      <div className="lg-note">
        <Markdown>{copy.anecdote}</Markdown>
      </div>

      <div className="lg-levels">
        <div className="chips">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`chip ${level === l ? "active" : ""}`}
              onClick={() => setLevel(l)}
            >
              {l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <div className="lg-level-body">
          <Markdown>{copy.levels[level] || ""}</Markdown>
        </div>
      </div>
    </>
  );
}

function BitTable({
  vars,
  rows,
  extraHead,
}: {
  vars: string[];
  rows: { values: number[]; cells: { value: number | null; bad?: boolean }[] }[];
  extraHead: string[];
}) {
  return (
    <div className="eval-table-wrap" style={{ marginTop: 10 }}>
      <table className="tt-table">
        <thead>
          <tr>
            {vars.map((v) => <th key={v}>{v}</th>)}
            {extraHead.map((h) => <th key={h} className="tt-out">{h}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {r.values.map((v, j) => (
                <td key={j} className={v ? "val-true" : "val-false"}>{v}</td>
              ))}
              {r.cells.map((c, j) => (
                <td
                  key={j}
                  className={c.bad ? "val-bad" : c.value ? "val-true" : "val-false"}
                >
                  <strong>{c.value === null ? "ERR" : c.value}</strong>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TruthTableGame() {
  const [formula, setFormula] = useState("(P && Q) || !P");
  const result = useMemo<{ table?: TruthTable; error?: string }>(() => {
    if (!formula.trim()) return {};
    try {
      return { table: truthTable(formula) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [formula]);

  const VERDICT: Record<string, string> = {
    tautology: "TAUTOLOGY — true in every row",
    contradiction: "CONTRADICTION — false in every row",
    contingent: "CONTINGENT",
  };

  return (
    <div className="lg-game">
      <div className="set-actions">
        <input
          className="lg-formula"
          value={formula}
          onChange={(e) => setFormula(e.target.value)}
          placeholder="e.g. (P && Q) || !R"
          aria-label="Propositional formula"
        />
      </div>
      <p className="set-hint" style={{ margin: "6px 0 0" }}>
        Use <code>&amp;&amp;</code> (and), <code>||</code> (or), <code>!</code> (not),
        <code> -&gt;</code> (implies), <code>&lt;-&gt;</code> (iff). Variables are single
        letters A–Z. The table updates as you type.
      </p>

      {result.error && <div className="lg-bad">Could not parse that: {result.error}</div>}
      {result.table && (
        <>
          <BitTable
            vars={result.table.vars}
            rows={result.table.rows.map((r) => ({
              values: r.values,
              cells: [{ value: r.result }],
            }))}
            extraHead={["Result"]}
          />
          <div className={`lg-verdict lg-${result.table.verdict}`}>
            <strong>{VERDICT[result.table.verdict]}</strong>
            {result.table.verdict === "contingent" &&
              ` — true in ${result.table.trueCount} of ${result.table.rows.length} rows`}
          </div>
        </>
      )}
    </div>
  );
}

function SyllogismGame() {
  const [idx, setIdx] = useState(0);
  const [checked, setChecked] = useState(false);
  const custom = idx === SYLLOGISMS.length;
  const s = custom ? null : SYLLOGISMS[idx];

  return (
    <div className="lg-game">
      <div className="set-actions">
        <select
          value={idx}
          onChange={(e) => {
            setIdx(Number(e.target.value));
            setChecked(false);
          }}
        >
          {SYLLOGISMS.map((x, i) => (
            <option key={x.name} value={i}>{x.name}</option>
          ))}
          <option value={SYLLOGISMS.length}>Your own…</option>
        </select>
        <button className="send" onClick={() => setChecked(true)}>Check validity</button>
      </div>

      {custom ? (
        <div className="lg-syl">
          <p>
            Write your own premises and conclusion, then ask the question that decides every
            syllogism: <strong>is it possible for both premises to be true and the conclusion
            false?</strong> If yes it is invalid; if no it is valid.
          </p>
          <textarea className="pad-text" rows={4} placeholder={"Premise 1…\nPremise 2…\n∴ Conclusion…"} />
        </div>
      ) : (
        s && (
          <div className="lg-syl">
            <div><strong>Premise 1:</strong> {s.p1}</div>
            <div><strong>Premise 2:</strong> {s.p2}</div>
            <div className="lg-conc"><strong>Conclusion:</strong> {s.conc}</div>
            <p className="set-hint" style={{ margin: "8px 0 0" }}><em>Example:</em> {s.example}</p>
          </div>
        )
      )}

      {checked && s && (
        <div className={`lg-verdict ${s.valid ? "lg-tautology" : "lg-contradiction"}`}>
          <strong>{s.valid ? "✓ VALID" : "✗ INVALID — this is a fallacy"}</strong>
          <p style={{ margin: "6px 0 0" }}>{s.explain}</p>
        </div>
      )}
      {checked && custom && (
        <div className="lg-verdict lg-contingent">
          A custom syllogism needs your judgement — no checker can replace the question above.
        </div>
      )}
    </div>
  );
}

function KnightsGame() {
  const [idx, setIdx] = useState(0);
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [hint, setHint] = useState(false);
  const [result, setResult] = useState<"none" | "incomplete" | "right" | "wrong">("none");
  const p = KNAVE_PUZZLES[idx];

  function choose(person: string, value: string) {
    setPicks((prev) => ({ ...prev, [person]: value }));
    setResult("none");
  }

  function check() {
    if (!p.people.every((person) => picks[person])) return setResult("incomplete");
    setResult(p.people.every((person) => picks[person] === p.answer[person]) ? "right" : "wrong");
  }

  return (
    <div className="lg-game">
      <div className="set-actions">
        <select
          value={idx}
          onChange={(e) => {
            setIdx(Number(e.target.value));
            setPicks({});
            setHint(false);
            setResult("none");
          }}
        >
          {KNAVE_PUZZLES.map((_, i) => (
            <option key={i} value={i}>Puzzle {i + 1}</option>
          ))}
        </select>
        <button className="btn-ghost" onClick={() => setHint(true)}>Hint</button>
        <button className="send" onClick={check}>Check answer</button>
      </div>

      <div className="lg-scenario"><Markdown>{p.scenario}</Markdown></div>

      {p.people.map((person) => (
        <div key={person} className="lg-person">
          <strong>{person}:</strong>
          {p.options.map((opt) => (
            <button
              key={opt}
              className={`chip ${picks[person] === opt ? "active" : ""}`}
              onClick={() => choose(person, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      ))}

      {hint && <div className="lg-note" style={{ marginTop: 10 }}>{p.hint}</div>}

      {result === "incomplete" && <div className="lg-bad">Choose an answer for each first.</div>}
      {(result === "right" || result === "wrong") && (
        <div className={`lg-verdict ${result === "right" ? "lg-tautology" : "lg-contradiction"}`}>
          <strong>{result === "right" ? "✓ Correct" : "✗ Not quite"}</strong>
          {result === "wrong" && (
            <span> — you said {p.people.map((x) => `${x}=${picks[x]}`).join(", ")}</span>
          )}
          <p style={{ margin: "6px 0 0" }}>{p.explain}</p>
        </div>
      )}
    </div>
  );
}

function GatesGame() {
  const [idx, setIdx] = useState(0);
  const [formula, setFormula] = useState("");
  const [showHint, setShowHint] = useState(false);
  const p = GATE_PUZZLES[idx];

  const check = useMemo(() => {
    if (!formula.trim()) return null;
    const evaluator = safeEvaluator(formula, p.vars);
    const total = 1 << p.vars.length;
    const rows: { values: number[]; cells: { value: number | null; bad?: boolean }[] }[] = [];
    let allMatch = true;
    for (let r = 0; r < total; r++) {
      const env: Record<string, number> = {};
      const values: number[] = [];
      for (let c = 0; c < p.vars.length; c++) {
        const val = (r >> (p.vars.length - 1 - c)) & 1;
        env[p.vars[c]] = val;
        values.push(val);
      }
      const target = p.target(...values);
      const yours = evaluator ? evaluator(env) : null;
      const match = yours === target;
      if (!match) allMatch = false;
      rows.push({ values, cells: [{ value: target }, { value: yours, bad: !match }] });
    }
    return { rows, allMatch, parsed: evaluator !== null };
  }, [formula, p]);

  return (
    <div className="lg-game">
      <div className="set-actions">
        <select
          value={idx}
          onChange={(e) => {
            setIdx(Number(e.target.value));
            setFormula("");
            setShowHint(false);
          }}
        >
          {GATE_PUZZLES.map((x, i) => (
            <option key={x.name} value={i}>{x.name}</option>
          ))}
        </select>
        <button className="btn-ghost" onClick={() => setShowHint(true)}>Hint</button>
      </div>

      <div className="lg-desc"><Markdown>{p.desc}</Markdown></div>

      <input
        className="lg-formula"
        value={formula}
        onChange={(e) => setFormula(e.target.value)}
        placeholder={p.placeholder}
        aria-label="Your formula"
      />
      <p className="set-hint" style={{ margin: "6px 0 0" }}>
        Inputs: {p.vars.join(", ")}. The comparison updates as you type.
      </p>

      {showHint && <div className="lg-note" style={{ marginTop: 10 }}>{p.hint}</div>}

      {check && (
        <>
          <BitTable vars={p.vars} rows={check.rows} extraHead={["Target", "Yours"]} />
          {!check.parsed ? (
            <div className="lg-bad">
              That formula does not parse, or it uses a variable this puzzle does not have.
              Available: {p.vars.join(", ")}.
            </div>
          ) : (
            <div className={`lg-verdict ${check.allMatch ? "lg-tautology" : "lg-contradiction"}`}>
              <strong>
                {check.allMatch
                  ? "✓ Perfect match — your circuit is correct."
                  : "✗ Some rows differ — the highlighted cells show where."}
              </strong>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const TOULMIN_FIELDS: [keyof ArgumentExample, string][] = [
  ["claim", "Claim"],
  ["grounds", "Grounds (evidence)"],
  ["warrant", "Warrant (why the grounds support the claim)"],
  ["backing", "Backing (support for the warrant)"],
  ["qualifier", "Qualifier (how strongly it follows)"],
  ["rebuttal", "Rebuttal (when it wouldn't hold)"],
];

const BLANK_CUSTOM = { claim: "", grounds: "", warrant: "", backing: "", qualifier: "", rebuttal: "" };

/** The "building an argument is like stacking blocks" analogy, made literal and
 *  interactive: two premise blocks (Grounds, Warrant) hold up a Claim block.
 *  Knock either premise out and the claim topples — even if the other premise,
 *  and the reasoning connecting them, is perfectly solid. That's the whole
 *  point of the Toulmin model: a claim needs BOTH good grounds AND a warrant
 *  that actually licenses the step from those grounds to that claim. */
function ArgumentTower({ claim, grounds, warrant }: { claim: string; grounds: string; warrant: string }) {
  const [groundsTrue, setGroundsTrue] = useState(true);
  const [warrantTrue, setWarrantTrue] = useState(true);
  const claimStands = groundsTrue && warrantTrue;

  return (
    <div className="lg-tower" style={{ maxWidth: 360, margin: "0 auto" }}>
      <svg
        viewBox="0 0 260 190"
        role="img"
        aria-label="Two blocks labelled Grounds and Warrant holding up a block labelled Claim"
        style={{ width: "100%", height: "auto", display: "block" }}
      >
        <line x1="10" y1="172" x2="250" y2="172" stroke="#a8a29e" strokeWidth="2" />

        <g
          style={{
            transform: groundsTrue ? "none" : "rotate(-20deg)",
            transformOrigin: "55px 172px",
            transition: "transform 0.5s cubic-bezier(.36,1.6,.4,1)",
          }}
        >
          <rect x="15" y="117" width="80" height="55" rx="4"
                fill={groundsTrue ? "#fef3c7" : "#fecaca"} stroke="#1c1917" strokeWidth="2" />
          <text x="55" y="141" textAnchor="middle" fontSize="12" fontWeight={700}>Grounds</text>
          <text x="55" y="157" textAnchor="middle" fontSize="9" fill="#57534e">
            {groundsTrue ? "solid" : "wobbly!"}
          </text>
        </g>

        <g
          style={{
            transform: warrantTrue ? "none" : "rotate(18deg)",
            transformOrigin: "205px 172px",
            transition: "transform 0.5s cubic-bezier(.36,1.6,.4,1)",
          }}
        >
          <rect x="165" y="117" width="80" height="55" rx="4"
                fill={warrantTrue ? "#fef3c7" : "#fecaca"} stroke="#1c1917" strokeWidth="2" />
          <text x="205" y="141" textAnchor="middle" fontSize="12" fontWeight={700}>Warrant</text>
          <text x="205" y="157" textAnchor="middle" fontSize="9" fill="#57534e">
            {warrantTrue ? "solid" : "wobbly!"}
          </text>
        </g>

        <g
          style={{
            transform: claimStands ? "none" : "translate(14px, 30px) rotate(30deg)",
            transformOrigin: "130px 117px",
            transition: "transform 0.5s cubic-bezier(.34,1.4,.3,1)",
          }}
        >
          <rect x="70" y="60" width="120" height="55" rx="4"
                fill={claimStands ? "#bbf7d0" : "#e7e5e4"} stroke="#1c1917" strokeWidth="2.5" />
          <text x="130" y="92" textAnchor="middle" fontSize="12" fontWeight={700}>Claim</text>
          <text x="130" y="107" textAnchor="middle" fontSize="9" fill="#57534e">
            {claimStands ? "stands" : "topples!"}
          </text>
        </g>
      </svg>

      <div className="set-actions">
        <button className={`chip ${groundsTrue ? "active" : ""}`} onClick={() => setGroundsTrue((v) => !v)}>
          Grounds {groundsTrue ? "✓ true" : "✗ FALSE"}
        </button>
        <button className={`chip ${warrantTrue ? "active" : ""}`} onClick={() => setWarrantTrue((v) => !v)}>
          Warrant {warrantTrue ? "✓ true" : "✗ FALSE"}
        </button>
      </div>
      <p className="set-hint" style={{ margin: "8px 0 0" }}>
        {claimStands ? (
          <>Both blocks are solid, so the claim stands: <em>{claim || "your claim"}</em></>
        ) : !groundsTrue && !warrantTrue ? (
          <>Neither block is solid — the claim has nothing to stand on.</>
        ) : !groundsTrue ? (
          <>The <strong>grounds</strong> block is wobbly ({grounds || "your grounds"}) — even with a perfectly solid warrant, the claim topples. This is what "valid but not sound" looks like: the reasoning can be flawless and the conclusion still fails, because a premise isn't actually true.</>
        ) : (
          <>The <strong>warrant</strong> block is wobbly ({warrant || "your warrant"}) — even with perfectly true grounds, the claim topples, because nothing actually licenses the step from those grounds to that claim.</>
        )}
      </p>
    </div>
  );
}

/** The argument's warrant/grounds/claim as propositional logic — run through the
 *  same truthTable() engine the Truth Table Builder game uses, so "valid" isn't
 *  just asserted, it's checked. Omitted (renders nothing) for arguments whose
 *  `symbolic` field is absent — those are inductive, not deductive, on purpose. */
function ArgumentSymbolicForm({ ex }: { ex: ArgumentExample }) {
  const sym = ex.symbolic;
  const result = useMemo<{ table?: TruthTable; error?: string }>(() => {
    if (!sym) return {};
    try {
      return { table: truthTable(sym.formula) };
    } catch (e) {
      return { error: (e as Error).message };
    }
  }, [sym]);

  if (!sym) return null;

  return (
    <>
      <h5 style={{ margin: "14px 0 6px" }}>In symbolic form — propositional logic</h5>
      <ul className="lg-symbols" style={{ margin: "0 0 8px", paddingLeft: 18 }}>
        {sym.symbols.map((s) => (
          <li key={s.symbol}>
            <strong>{s.symbol}</strong> = {s.meaning}
          </li>
        ))}
      </ul>
      <ol className="cl-steps">
        {sym.premises.map((line, i) => (
          <li key={i}>{line}</li>
        ))}
      </ol>
      <p className="set-hint" style={{ margin: "6px 0" }}>
        Pattern: <strong>{sym.patternName}</strong> &nbsp;·&nbsp; formula tested below:{" "}
        <code>{sym.formula}</code>
      </p>

      {result.error && <div className="lg-bad">Could not evaluate that formula: {result.error}</div>}
      {result.table && (
        <>
          <BitTable
            vars={result.table.vars}
            rows={result.table.rows.map((r) => ({
              values: r.values,
              cells: [{ value: r.result }],
            }))}
            extraHead={["Whole argument"]}
          />
          <div className={`lg-verdict lg-${result.table.verdict}`} style={{ marginTop: 8 }}>
            <strong>
              {result.table.verdict === "tautology"
                ? "✓ Tautology — true in every row. This pattern is deductively valid, always, regardless of what the letters mean."
                : "✗ Not a tautology — false in at least one row. This pattern is NOT deductively valid on its own."}
            </strong>
          </div>
        </>
      )}
      <p className="set-hint" style={{ margin: "8px 0 0" }}>{sym.explain}</p>
    </>
  );
}

function ArgumentBuilderGame() {
  const [mode, setMode] = useState<"examples" | "custom">("examples");
  const [idx, setIdx] = useState(1); // default to Beccaria — a real, immediately interesting case
  const [custom, setCustom] = useState({ ...BLANK_CUSTOM });
  const ex = ARGUMENT_EXAMPLES[idx];

  return (
    <div className="lg-game">
      <div className="set-actions">
        <button
          className={`chip ${mode === "examples" ? "active" : ""}`}
          onClick={() => setMode("examples")}
        >
          Load an example
        </button>
        <button
          className={`chip ${mode === "custom" ? "active" : ""}`}
          onClick={() => setMode("custom")}
        >
          Build your own
        </button>
      </div>

      {mode === "examples" ? (
        <>
          <div className="set-actions">
            <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
              {ARGUMENT_EXAMPLES.map((a, i) => (
                <option key={a.title} value={i}>
                  {a.domain} — {a.title}
                </option>
              ))}
            </select>
          </div>
          <p className="set-hint" style={{ margin: "8px 0" }}>
            <em>Source: {ex.source}</em>
          </p>

          <div className="lg-scenario">
            {TOULMIN_FIELDS.map(([key, label]) => (
              <p key={key} style={{ margin: "0 0 8px" }}>
                <strong>{label}:</strong> {ex[key] as string}
              </p>
            ))}
          </div>

          <h5 style={{ margin: "14px 0 6px" }}>The claim, held up by its blocks</h5>
          <ArgumentTower key={ex.title} claim={ex.claim} grounds={ex.grounds} warrant={ex.warrant} />

          <h5 style={{ margin: "14px 0 6px" }}>In strict logical form</h5>
          <ol className="cl-steps">
            {ex.logicalForm.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ol>

          <ArgumentSymbolicForm ex={ex} />

          <div className="lg-verdict lg-contingent" style={{ marginTop: 10 }}>
            {ex.note}
          </div>
        </>
      ) : (
        <>
          <p className="set-hint" style={{ margin: "0 0 10px" }}>
            Pick a real argument you actually hold — about school, a hobby, current events, anything
            — and fill in each part. Leaving a field blank is itself informative: it's usually the
            part your argument is quietly assuming rather than stating.
          </p>
          {TOULMIN_FIELDS.map(([key, label]) => (
            <label key={key} className="set-row" style={{ alignItems: "flex-start" }}>
              <span style={{ flexBasis: 220 }}>{label}</span>
              <textarea
                className="pad-text"
                rows={2}
                value={custom[key as keyof typeof BLANK_CUSTOM]}
                onChange={(e) =>
                  setCustom((c) => ({ ...c, [key]: e.target.value }))
                }
                placeholder={key === "claim" ? "What are you arguing?" : "…"}
              />
            </label>
          ))}
          <button className="btn-ghost" onClick={() => setCustom({ ...BLANK_CUSTOM })}>
            Clear
          </button>

          <h5 style={{ margin: "14px 0 6px" }}>The claim, held up by its blocks</h5>
          <ArgumentTower key="custom" claim={custom.claim} grounds={custom.grounds} warrant={custom.warrant} />
        </>
      )}
    </div>
  );
}

/** Formal Logic Lab — truth tables, syllogisms, Knights & Knaves, logic gates. */
export default function LogicLab({ onAsk }: { onAsk: (question: string) => void }) {
  const [game, setGame] = useState<Game>("truthtable");

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <div className="chips" style={{ margin: 0 }}>
          {GAMES.map(([id, label]) => (
            <button
              key={id}
              className={`chip ${game === id ? "active" : ""}`}
              onClick={() => setGame(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="lesson-body">
        <GameShell game={game} onAsk={onAsk}>
          {game === "truthtable" && <TruthTableGame />}
          {game === "syllogism" && <SyllogismGame />}
          {game === "knights" && <KnightsGame />}
          {game === "gates" && <GatesGame />}
          {game === "argument" && <ArgumentBuilderGame />}
        </GameShell>
      </div>
    </div>
  );
}
