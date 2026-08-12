import { useEffect, useRef, useState } from "react";
import { buildLesson, fetchScene, type LessonBuild, type LessonScene } from "./lessonApi";
import { streamTutor, type TutorAids, type TutorMeta } from "./api";
import Markdown from "./Markdown";
import Animation from "./Animation";
import VizPanel from "./VizPanel";
import Scratchpad from "./Scratchpad";
import { exportLesson } from "./exportLesson";

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

function AskBox({
  context,
  level,
  sessionId,
  placeholder,
  onAnswer,
  onExchange,
}: {
  context: string;
  level: string;
  sessionId: string;
  placeholder?: string;
  onAnswer?: (text: string) => void;
  onExchange?: (q: string, a: string) => void;
}) {
  const [q, setQ] = useState("");
  const [answer, setAnswer] = useState("");
  const [meta, setMeta] = useState<TutorMeta | null>(null);
  const [aids, setAids] = useState<TutorAids | null>(null);
  const [busy, setBusy] = useState(false);

  async function ask(override?: string) {
    const text = (override ?? q).trim();
    if (!text || busy) return;
    setBusy(true);
    setAnswer("");
    setMeta(null);
    setAids(null);
    let full = "";
    try {
      // The scene context frames the question, but the tutor is asked the
      // learner's actual words so catalog + library matching sees them cleanly.
      await streamTutor(
        text,
        {
          learnerLevel: level,
          sessionId,
          history: context ? [{ role: "assistant", content: context }] : [],
          onMeta: setMeta,
          onAids: setAids,
        },
        (tok) => {
          full += tok;
          setAnswer(full);
        }
      );
      onAnswer?.(full);
      onExchange?.(text, full);
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
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={placeholder || "Ask about this scene…"}
          disabled={busy}
        />
        <button type="submit" className="send" disabled={busy || !q.trim()}>
          {busy ? "…" : "Ask"}
        </button>
      </form>
      {answer && (
        <div className="bubble assistant ask-answer">
          <Markdown>{answer}</Markdown>
          {meta && (
            <div className="ask-meta">
              {meta.source === "curated" ? "📗 curated lesson" : "✨ tutor"}
              {meta.library_grounded ? " · grounded in your library" : ""}
              {` · ${meta.learner_level} level`}
            </div>
          )}
        </div>
      )}
      {aids && aids.takeaways.length > 0 && (
        <div className="aids">
          <h5>Key takeaways</h5>
          <ul>{aids.takeaways.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
      {aids && aids.next_questions.length > 0 && (
        <div className="aids">
          <h5>Where to go next</h5>
          <div className="chips">
            {aids.next_questions.map((n, i) => (
              <button key={i} className="chip" onClick={() => { setQ(n); void ask(n); }} disabled={busy}>
                {n}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Lesson({
  seedTopic,
  onSeedUsed,
}: {
  seedTopic?: string | null;
  onSeedUsed?: () => void;
}) {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("teen");
  const [status, setStatus] = useState("");
  const [lesson, setLesson] = useState<LessonBuild | null>(null);
  const [scenes, setScenes] = useState<(LessonScene | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [building, setBuilding] = useState(false);
  const [lastAnswer, setLastAnswer] = useState("");
  const [justAsk, setJustAsk] = useState(false);
  // One context session per visit: the tutor keeps the thread across questions,
  // and Reset starts a clean one.
  const [sessionId, setSessionId] = useState(() => `learn-${Date.now().toString(36)}`);
  const [qa, setQa] = useState<{ role: string; content: string }[]>([]);
  const [sessionCount, setSessionCount] = useState(0);

  const recordExchange = (question: string, answer: string) => {
    setQa((prev) => [...prev, { role: "user", content: question }, { role: "assistant", content: answer }]);
    setSessionCount((n) => n + 1);
  };

  async function resetSession() {
    await fetch(`/api/context/session/${encodeURIComponent(sessionId)}`, { method: "DELETE" }).catch(() => undefined);
    setSessionId(`learn-${Date.now().toString(36)}`);
    setQa([]);
    setSessionCount(0);
    setLastAnswer("");
  }

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

  // A prompt handed over from the Prompt Library builds itself on arrival. The
  // ref guards against React 18 StrictMode running the effect twice.
  const seedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!seedTopic || seedRef.current === seedTopic) return;
    seedRef.current = seedTopic;
    setTopic(seedTopic);
    void build(seedTopic);
    onSeedUsed?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedTopic]);

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
        <button
          className="btn-ghost"
          onClick={() => setJustAsk(true)}
          disabled={building}
          title="Ask the tutor without building a whole lesson"
        >
          Just ask
        </button>
        <button
          className="btn-ghost"
          onClick={() => lesson && exportLesson(lesson, scenes, qa)}
          disabled={!lesson || !scenes.some(Boolean)}
          title="Download this lesson as a standalone HTML file"
        >
          Export
        </button>
        <span className="status">{status}</span>
      </div>

      <div className="ctxbar">
        <span>
          Context: session <code>{sessionId.slice(-6)}</code> · {sessionCount}{" "}
          {sessionCount === 1 ? "question" : "questions"}
        </span>
        <button className="link" onClick={() => void resetSession()} disabled={sessionCount === 0}>
          Reset
        </button>
      </div>

      {!lesson && !building && justAsk && (
        <div className="lesson-body">
          <h3 className="lesson-title">Ask the tutor</h3>
          <p className="dsub">
            A direct question, no lesson scaffolding. Build a lesson above whenever you want the
            full walkthrough.
          </p>
          <AskBox
            context=""
            level={level}
            sessionId={sessionId}
            placeholder="Ask anything, e.g. why does a determinant measure area?"
            onAnswer={setLastAnswer}
            onExchange={recordExchange}
          />
          <VizPanel topic={topic || lastAnswer.slice(0, 80)} answerText={lastAnswer} />
          <Scratchpad question={topic || "Check this working"} />
        </div>
      )}

      {!lesson && !building && !justAsk && (
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
                <Animation topic={`${lesson.topic} — ${section?.title || ""}`} />
              </>
            )}
          </div>

          <VizPanel
            topic={section?.title ? `${lesson.topic} — ${section.title}` : lesson.topic}
            answerText={lastAnswer || scene?.narration || ""}
          />

          <Scratchpad question={section?.title ? `${lesson.topic} — ${section.title}` : lesson.topic} />

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

          <AskBox
            context={context}
            level={level}
            sessionId={sessionId}
            onAnswer={setLastAnswer}
            onExchange={recordExchange}
          />
        </div>
      )}
    </div>
  );
}
