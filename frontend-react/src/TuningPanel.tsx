import { useEffect, useState } from "react";
import {
  cancelTuning,
  estimate,
  family,
  getTuningOptions,
  getTuningStatus,
  promoteTuned,
  startTuning,
  type TuningOptions,
  type TuningStatus,
} from "./tuningApi";

const STEP_LABELS: Record<string, string> = {
  build: "Write questions & teacher answers",
  train: "Train (LoRA, on this Mac)",
  export: "Export checkpoints to Ollama",
  pick: "Pick a checkpoint (validation gate)",
  gate: "Final gate (held-out test)",
  finish: "Finish",
};
const ICON: Record<string, string> = { pending: "○", running: "◐", done: "●", error: "✕" };

/**
 * Settings -> Model tuning. Teaches the local tutor to use library excerpts
 * (RAFT), all-local and free by default; Claude is an opt-in teacher/judge
 * with the cost shown first. Never switches the tutor itself: "Use this
 * model" appears only when the held-out gate says PROMOTE.
 */
export default function TuningPanel() {
  const [opts, setOpts] = useState<TuningOptions | null>(null);
  const [st, setSt] = useState<TuningStatus | null>(null);
  const [books, setBooks] = useState<string[]>([]);
  const [perSource, setPerSource] = useState(30);
  const [teacher, setTeacher] = useState("qwen3:8b");
  const [judges, setJudges] = useState<string[]>(["qwen3:8b", "llama3.1:8b"]);
  const [acceptCost, setAcceptCost] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    getTuningOptions()
      .then((o) => {
        setOpts(o);
        setTeacher(o.defaults.teacher);
        setJudges(o.defaults.judges);
        setPerSource(o.defaults.per_source);
        setBooks(o.books.filter((b) => /calc/i.test(b.source)).map((b) => b.source));
      })
      .catch((e) => setMsg((e as Error).message));
  }, []);

  useEffect(() => {
    let alive = true;
    const tick = () => getTuningStatus().then((s) => alive && setSt(s)).catch(() => undefined);
    tick();
    const id = setInterval(tick, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (!opts) return <p className="set-hint">{msg || "Loading tuning options…"}</p>;

  const run = st?.run;
  const running = run?.status === "running";
  const options = { sources: books, per_source: perSource, teacher, judges, eval_n: opts.defaults.eval_n };
  const est = estimate(options);
  const sameFamily = family(judges[0]) === family(judges[1]);
  const teacherBias = judges.some((j) => family(j) === family(teacher));
  const modelChoices = (extra: string[]) => [...extra, ...opts.local_models];
  const claudeTeacher = opts.claude_available ? ["claude"] : [];
  const claudeJudge = opts.claude_available ? [opts.claude_judge] : [];
  const label = (m: string) =>
    m === "claude" ? "Claude (Settings model) — higher quality, costs credit" :
    m === opts.claude_judge ? "Claude Haiku — costs credit" : m;

  async function start() {
    setMsg("");
    try {
      await startTuning(options);
      setAcceptCost(false);
      setSt(await getTuningStatus());
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  async function promote() {
    try {
      const r = await promoteTuned();
      setMsg(`The tutor now uses ${r.local_llm_model}.`);
    } catch (e) {
      setMsg((e as Error).message);
    }
  }

  const gate = run?.result?.test ?? run?.test;

  return (
    <>
      <p className="set-hint" style={{ marginLeft: 0 }}>
        Teach the local tutor to ground its answers in your library: questions are written from the
        chosen books, a teacher model writes cited answers, the tutor is LoRA-tuned on them, and two
        judges compare it with the current model on pages it never trained on. Runs on this Mac;
        free with local models. The tutor is only switched if you choose to after a passing gate.
      </p>

      {!st?.online && (
        <p className="tune-warn">
          The tuning helper isn't running. In a terminal in the project folder, run{" "}
          <code>make lora-agent</code> and leave it open.
        </p>
      )}

      {!running && (
        <>
          <details className="set-details" open>
            <summary>Books ({books.length} of {opts.books.length} chosen)</summary>
            <div className="tune-books">
              {opts.books.map((b) => (
                <label key={b.source} className="set-check">
                  <input
                    type="checkbox"
                    checked={books.includes(b.source)}
                    onChange={(e) =>
                      setBooks((prev) =>
                        e.target.checked ? [...prev, b.source] : prev.filter((x) => x !== b.source)
                      )
                    }
                  />
                  <span>{b.source} <em>{b.chunks} passages</em></span>
                </label>
              ))}
            </div>
          </details>

          <label className="set-row">
            <span>Questions per book</span>
            <input type="number" min={5} max={200} value={perSource}
              onChange={(e) => setPerSource(Math.max(5, Math.min(200, Number(e.target.value) || 5)))} />
          </label>
          <label className="set-row">
            <span>Teacher</span>
            <select value={teacher} onChange={(e) => setTeacher(e.target.value)}>
              {modelChoices(claudeTeacher).map((m) => <option key={m} value={m}>{label(m)}</option>)}
            </select>
          </label>
          {[0, 1].map((k) => (
            <label key={k} className="set-row">
              <span>Judge {k + 1}</span>
              <select value={judges[k]}
                onChange={(e) => setJudges((prev) => prev.map((j, i) => (i === k ? e.target.value : j)))}>
                {modelChoices(claudeJudge).map((m) => <option key={m} value={m}>{label(m)}</option>)}
              </select>
            </label>
          ))}
          {sameFamily && <p className="tune-warn">Both judges are from the same model family; a judge tends to favour its own family. Pick two different families.</p>}
          {!sameFamily && teacherBias && (
            <p className="set-hint">A judge shares the teacher's family and may favour the tuned model's learned style; the other judge balances it.</p>
          )}

          <p className="set-hint" style={{ marginLeft: 0 }}>
            About {est.questions} questions · roughly {est.hours < 1 ? `${Math.round(est.hours * 60)} min` : `${est.hours.toFixed(1)} h`} ·{" "}
            {est.cost > 0 ? <strong>Claude cost ≈ ${est.cost.toFixed(0)}</strong> : "$0 (all local)"}
          </p>
          {est.cost > 0 && (
            <label className="set-check">
              <input type="checkbox" checked={acceptCost} onChange={(e) => setAcceptCost(e.target.checked)} />
              <span>Spend about ${est.cost.toFixed(0)} of Claude credit on this run</span>
            </label>
          )}
          <div className="set-actions">
            <button className="send" onClick={() => void start()}
              disabled={!st?.online || books.length === 0 || (est.cost > 0 && !acceptCost) || sameFamily}>
              Start tuning run
            </button>
          </div>
        </>
      )}

      {run && (
        <div className="tune-run">
          <div className="tune-head">
            <strong>{run.id}</strong>
            <span className={`tune-status tune-${run.status}`}>{run.status}</span>
            {running && <button className="btn-ghost" onClick={() => void cancelTuning()}>Cancel</button>}
          </div>
          {running && (
            <div className="viz-progress">
              <div className="viz-progress-bar" style={{ width: `${Math.max(3, run.progress)}%` }} />
              <span className="viz-progress-label">{run.progress}%</span>
            </div>
          )}
          <ol className="tune-steps">
            {run.steps.map((s) => (
              <li key={s.name} className={`tune-step tune-${s.status}`}>
                <span aria-hidden="true">{ICON[s.status]}</span> {STEP_LABELS[s.name] ?? s.name}
                {s.detail && <em> — {s.detail}</em>}
              </li>
            ))}
          </ol>
          {run.error && <p className="tune-warn">{run.error}</p>}

          {gate && (
            <div className="tune-gate">
              <p>
                <strong className={gate.verdict === "PROMOTE" ? "tune-pass" : "tune-fail"}>{gate.verdict}</strong>{" "}
                — {gate.n} held-out questions, tuned vs. {gate.base}
              </p>
              <table>
                <thead><tr><th>Judge</th><th>Tuned wins</th><th>Base wins</th><th>Ties</th></tr></thead>
                <tbody>
                  {Object.entries(gate.judges).map(([j, t]) => (
                    <tr key={j}><td>{j}</td><td>{t.tuned}</td><td>{t.base}</td><td>{t.tie}</td></tr>
                  ))}
                </tbody>
              </table>
              <p className="set-hint" style={{ marginLeft: 0 }}>
                Cites a source when excerpts were retrieved: tuned {gate.tuned_stats.cites_when_excerpts}, base{" "}
                {gate.base_stats.cites_when_excerpts} · made-up citations: tuned {gate.tuned_stats.fabricated_citations},
                base {gate.base_stats.fabricated_citations} · looping answers: tuned {gate.tuned_stats.loops}, base{" "}
                {gate.base_stats.loops}
              </p>
              {run.result?.verdict === "PROMOTE" ? (
                opts.current_model === run.result.model ? (
                  <p className="set-hint" style={{ marginLeft: 0 }}>The tutor already uses {run.result.model}.</p>
                ) : (
                  <div className="set-actions">
                    <button className="send" onClick={() => void promote()}>Use {run.result.model} as the tutor</button>
                  </div>
                )
              ) : run.status === "done" ? (
                <p className="set-hint" style={{ marginLeft: 0 }}>
                  It didn't beat the current model on both judges, so the tutor stays on {opts.current_model}.
                  {run.result?.model && ` ${run.result.model} is kept in Ollama if you want to inspect it.`}
                </p>
              ) : null}
            </div>
          )}

          {run.log_tail?.length > 0 && (
            <details className="set-details">
              <summary>Log</summary>
              <pre className="tune-log">{run.log_tail.join("\n")}</pre>
            </details>
          )}
        </div>
      )}
      {msg && <p className="set-hint" style={{ marginLeft: 0 }}>{msg}</p>}
    </>
  );
}
