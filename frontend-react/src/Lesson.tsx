import { useState } from "react";
import { buildLesson, fetchScene, type LessonBuild, type LessonScene } from "./lessonApi";
import { streamChat } from "./api";
import Markdown from "./Markdown";

const TYPE_ICON: Record<string, string> = { explain: "📖", example: "🧮", quiz: "❓" };
const LEVELS = ["kids", "teen", "college", "adult"];

// A curated ladder of self-learning concepts — good "aha" topics that make
// strong Feynman lessons, from everyday intuition to deeper ideas.
const STARTERS = [
  "Why is a negative times a negative positive?",
  "What is the Pythagorean theorem, really?",
  "Why is the area of a circle πr²?",
  "What does a derivative actually measure?",
  "Why do we need imaginary numbers?",
  "What makes prime numbers special?",
  "Why does e^(iπ) + 1 = 0?",
  "How does modular arithmetic power cryptography?",
];

function Quiz({ scene }: { scene: LessonScene }) {
  const [picked, setPicked] = useState<number | null>(null);
  const correct = scene.correct_index ?? 0;
  return (
    <div>
      <p className="q">
        <Markdown>{scene.question || ""}</Markdown>
      </p>
      <div className="choices">
        {(scene.choices || []).map((c, i) => {
          const state = picked === null ? "" : i === correct ? "right" : i === picked ? "wrong" : "";
          return (
            <button key={i} className={`choice ${state}`} onClick={() => setPicked(i)} disabled={picked !== null}>
              {c}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="feedback">
          {picked === correct ? "✅ Correct! " : "❌ Not quite. "}
          <Markdown>{scene.explanation || ""}</Markdown>
        </div>
      )}
    </div>
  );
}

function Classmate({ q, a }: { q?: string | null; a?: string | null }) {
  if (!q) return null;
  return (
    <div className="classmate">
      <div className="cm-q">
        <strong>🧑‍🎓 Maya asks:</strong> <Markdown>{q}</Markdown>
      </div>
      <details>
        <summary>See the answer</summary>
        <Markdown>{a || ""}</Markdown>
      </details>
    </div>
  );
}

function AskBox({ context }: { context: string }) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  async function ask() {
    const text = q.trim();
    if (!text || busy) return;
    setBusy(true);
    setAnswer("");
    let full = "";
    try {
      await streamChat(`${context}\n\nQuestion: ${text}`, [], (tok) => {
        full += tok;
        setAnswer(full);
      });
    } catch (e) {
      setAnswer(`⚠️ ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="askbox">
      <form
        className="ask-row"
        onSubmit={(e) => {
          e.preventDefault();
          void ask();
        }}
      >
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about this scene…" disabled={busy} />
        <button type="submit" className="send" disabled={busy || !q.trim()}>
          {busy ? "…" : "Ask"}
        </button>
      </form>
      {answer && (
        <div className="bubble assistant ask-answer">
          <Markdown>{answer}</Markdown>
        </div>
      )}
    </div>
  );
}

export default function Lesson() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("teen");
  const [status, setStatus] = useState("");
  const [lesson, setLesson] = useState<LessonBuild | null>(null);
  const [scenes, setScenes] = useState<(LessonScene | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [building, setBuilding] = useState(false);

  async function build(topicArg?: string) {
    const t = (topicArg ?? topic).trim();
    if (!t || building) return;
    setBuilding(true);
    setLesson(null);
    setStatus("Designing the lesson and writing every scene…");
    try {
      const built = await buildLesson(t, level);
      setLesson(built);
      setScenes(built.scenes.slice());
      setIdx(0);
      setStatus("");
    } catch (e) {
      setStatus(`Lesson failed: ${(e as Error).message}`);
    } finally {
      setBuilding(false);
    }
  }

  async function retryScene(i: number) {
    if (!lesson) return;
    setStatus(`Regenerating scene ${i + 1}…`);
    try {
      const s = await fetchScene(lesson.topic, lesson.level, lesson.sections[i]);
      setScenes((prev) => {
        const copy = prev.slice();
        copy[i] = s;
        return copy;
      });
      setStatus("");
    } catch (e) {
      setStatus(`Scene failed: ${(e as Error).message}`);
    }
  }

  const scene = lesson ? scenes[idx] : null;
  const section = lesson ? lesson.sections[idx] : null;
  const context = lesson && section ? `In the lesson "${lesson.title}", scene "${section.title}"` : "";

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Topic, e.g. why negative times negative is positive"
          onKeyDown={(e) => e.key === "Enter" && void build()}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
        <button className="send" onClick={() => void build()} disabled={building || !topic.trim()}>
          {building ? "Building…" : "Build Lesson"}
        </button>
        <span className="status">{status}</span>
      </div>

      {!lesson && !building && (
        <div className="starters">
          <div className="empty" style={{ margin: "8px auto 14px" }}>
            Learn any idea the Feynman way — a concrete example, one idea at a time, then a quiz —
            with math typeset live. Ask a follow-up on any scene. Or start with one of these:
          </div>
          <div className="starter-chips">
            {STARTERS.map((s) => (
              <button
                key={s}
                className="chip"
                onClick={() => {
                  setTopic(s);
                  void build(s);
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {lesson && (
        <div className="lesson-body">
          <h3 className="lesson-title">{lesson.title}</h3>
          <div className="chips">
            {lesson.sections.map((s, i) => (
              <button key={i} className={`chip ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)}>
                {TYPE_ICON[s.type] || ""} {i + 1}. {s.title}
                {!scenes[i] && i !== idx ? " ○" : ""}
              </button>
            ))}
          </div>

          <div className="scene">
            <div className="scene-meta">
              Scene {idx + 1} of {lesson.sections.length} • {section?.type}
            </div>
            <h4>{section?.title}</h4>
            {!scene ? (
              <div className="scene-failed">
                This scene didn&rsquo;t generate.{" "}
                <button className="link" onClick={() => void retryScene(idx)}>
                  Retry
                </button>
              </div>
            ) : scene.type === "quiz" ? (
              <Quiz scene={scene} />
            ) : (
              <>
                <Markdown>{scene.narration || ""}</Markdown>
                <Classmate q={scene.classmate_question} a={scene.classmate_answer} />
              </>
            )}
          </div>

          <div className="nav">
            <button className="btn" onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}>
              ← Prev
            </button>
            <button
              className="btn"
              onClick={() => setIdx((i) => Math.min(lesson.sections.length - 1, i + 1))}
              disabled={idx >= lesson.sections.length - 1}
            >
              Next →
            </button>
          </div>

          <AskBox context={context} />
        </div>
      )}
    </div>
  );
}
