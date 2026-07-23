import { useState } from "react";
import { polyaStart, polyaCoach, type PolyaStart, type PolyaCoach } from "./polyaApi";
import Markdown from "./Markdown";

const PHASES = [
  { key: "understand", icon: "🔍", title: "Understand the Problem", intro: "Make sure you truly understand what is asked. What is given? What are you finding?" },
  { key: "plan", icon: "🧭", title: "Devise a Plan", intro: "Find a connection between the data and the unknown. What strategy could work?" },
  { key: "execute", icon: "✏️", title: "Carry Out the Plan", intro: "Execute your plan, checking each step as you go." },
  { key: "lookback", icon: "🔁", title: "Look Back", intro: "Check the result. Can you see it differently, or use it elsewhere?" },
];
const LEVELS = ["kids", "teen", "college", "adult"];

export default function Solve() {
  const [problem, setProblem] = useState("");
  const [level, setLevel] = useState("teen");
  const [difficulty, setDifficulty] = useState("basic");
  const [start, setStart] = useState<PolyaStart | null>(null);
  const [phase, setPhase] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [coach, setCoach] = useState<PolyaCoach | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function begin() {
    const p = problem.trim();
    if (!p || busy) return;
    setBusy(true);
    setStatus("Reading the problem…");
    setStart(null);
    setCoach(null);
    setNotes({});
    setPhase(0);
    try {
      setStart(await polyaStart(p, level, difficulty));
      setStatus("");
    } catch (e) {
      setStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function getFeedback(stuck = false) {
    if (!start || busy) return;
    const key = PHASES[phase].key;
    setBusy(true);
    setCoach(null);
    try {
      const c = await polyaCoach({
        problem: problem.trim(),
        phase: key,
        user_input: input,
        notes: Object.values(notes).join("\n"),
        level,
        difficulty,
        stuck,
      });
      setCoach(c);
      if (input.trim()) setNotes((n) => ({ ...n, [key]: input.trim() }));
    } catch (e) {
      setStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  function goPhase(i: number) {
    if (i <= phase) {
      setPhase(i);
      setInput(notes[PHASES[i].key] || "");
      setCoach(null);
    }
  }

  function nextPhase() {
    if (phase < PHASES.length - 1) {
      const next = phase + 1;
      setPhase(next);
      setInput(notes[PHASES[next].key] || "");
      setCoach(null);
    }
  }

  const p = PHASES[phase];

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={problem}
          onChange={(e) => setProblem(e.target.value)}
          placeholder="A problem to solve, e.g. how many ways to make change for $1"
          onKeyDown={(e) => e.key === "Enter" && void begin()}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>{l[0].toUpperCase() + l.slice(1)}</option>
          ))}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="basic">Basic</option>
          <option value="olympiad">Olympiad</option>
        </select>
        <button className="send" onClick={() => void begin()} disabled={busy || !problem.trim()}>
          {busy && !start ? "Starting…" : "Start"}
        </button>
        <span className="status">{status}</span>
      </div>

      {!start && !busy && (
        <div className="empty">
          Solve any problem with George Pólya&rsquo;s four steps — Understand, Plan, Carry Out, Look
          Back. You do the thinking; the coach asks questions and nudges, never just hands you the
          answer.
        </div>
      )}

      {start && (
        <div className="lesson-body">
          <div className="scene">
            <div className="scene-meta">{start.problem_type}</div>
            <Markdown>{`**Restated:** ${start.restated}\n\n${start.opening}`}</Markdown>
          </div>

          <div className="chips" style={{ marginTop: 14 }}>
            {PHASES.map((ph, i) => (
              <button
                key={ph.key}
                className={`chip ${i === phase ? "active" : ""}`}
                onClick={() => goPhase(i)}
                disabled={i > phase}
              >
                {i < phase ? "✓" : ph.icon} {i + 1}. {ph.title}
              </button>
            ))}
          </div>

          <div className="scene">
            <h4>{p.icon} {p.title}</h4>
            <p className="dsub">{p.intro}</p>
            <textarea
              className="polya-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Write your thinking for this step…"
              rows={4}
            />
            <div className="nav">
              <button className="send" onClick={() => void getFeedback(false)} disabled={busy}>
                {busy ? "…" : "Get feedback"}
              </button>
              <button className="btn" onClick={() => void getFeedback(true)} disabled={busy}>
                I&rsquo;m stuck
              </button>
              <button className="btn" onClick={nextPhase} disabled={phase >= PHASES.length - 1}>
                Next step →
              </button>
            </div>

            {coach && (
              <div className="coach">
                {(coach.verified || coach.revised) && (
                  <div className="badges">
                    {coach.verified && <span className="badge-ok">✓ verified</span>}
                    {coach.revised && <span className="badge-rev">✎ revised</span>}
                  </div>
                )}
                <div className="coach-fb"><Markdown>{coach.feedback}</Markdown></div>
                {coach.hint && (
                  <details className="coach-hint">
                    <summary>Need a hint?</summary>
                    <Markdown>{coach.hint}</Markdown>
                  </details>
                )}
                {coach.suggestions.length > 0 && (
                  <ul className="coach-sugg">
                    {coach.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                )}
                {coach.ready && <div className="coach-ready">👍 Looks solid — move to the next step.</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
