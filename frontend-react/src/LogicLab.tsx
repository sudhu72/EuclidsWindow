import { useMemo, useState } from "react";
import Markdown from "./Markdown";
import { safeEvaluator, truthTable, type TruthTable } from "./logic";
import {
  COPY,
  GATE_PUZZLES,
  KNAVE_PUZZLES,
  LEVELS,
  SYLLOGISMS,
  type Level,
} from "./logicData";

type Game = "truthtable" | "syllogism" | "knights" | "gates";

const GAMES: [Game, string][] = [
  ["truthtable", "Truth Tables"],
  ["syllogism", "Syllogisms"],
  ["knights", "Knights & Knaves"],
  ["gates", "Logic Gates"],
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
        </GameShell>
      </div>
    </div>
  );
}
