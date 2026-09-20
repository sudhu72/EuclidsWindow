// The optional "teach me" escape hatch for a Math Quest clue — a full
// Feynman-technique tutorial built on demand via the existing lesson
// pipeline. Ported out of QuestStage.tsx's TutorialViewer so the new
// clue-driven flow (QuestClue.tsx) can offer it without depending on
// QuestStage's own (now-unused) generic-quiz machinery.
import { useEffect, useState } from "react";
import { buildLesson, type LessonBuild } from "./lessonApi";
import Markdown from "./Markdown";

export default function QuestTutorial({
  topic,
  level,
  onDone,
}: {
  topic: string;
  level: string;
  onDone: () => void;
}) {
  const [build, setBuild] = useState<LessonBuild | null>(null);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    setBuild(null);
    setIdx(0);
    setError("");
    buildLesson(topic, level)
      .then(setBuild)
      .catch((e) => setError((e as Error).message));
  }, [topic, level]);

  if (error) {
    return (
      <div className="qst-verdict qst-wrong">
        <Markdown>{`Couldn't build a tutorial: ${error}`}</Markdown>
        <button className="send" onClick={onDone}>Back</button>
      </div>
    );
  }
  if (!build) return <p className="status">Building a quick tutorial on this…</p>;

  const scene = build.scenes[idx];
  const section = build.sections[idx];

  return (
    <div className="qst-tutorial">
      <h4>{build.title}</h4>
      <div className="chips">
        {build.sections.map((s, i) => (
          <button key={i} className={`chip ${i === idx ? "active" : ""}`} onClick={() => setIdx(i)}>
            {s.title}
          </button>
        ))}
      </div>
      {!scene && <p className="status">This part couldn't be generated — try another section.</p>}
      {scene && section?.type !== "quiz" && (
        <div className="qst-tutorial-scene">
          <Markdown>{scene.narration || ""}</Markdown>
          {scene.classmate_question && (
            <div className="classmate">
              <div className="cm-q">
                <strong>🧑‍🎓 Someone asks:</strong> <Markdown>{scene.classmate_question}</Markdown>
              </div>
              <details>
                <summary>See the answer</summary>
                <Markdown>{scene.classmate_answer || ""}</Markdown>
              </details>
            </div>
          )}
        </div>
      )}
      {scene && section?.type === "quiz" && (
        <div className="qst-tutorial-scene">
          <p className="q"><Markdown>{scene.question || ""}</Markdown></p>
          <ul>
            {(scene.choices || []).map((c, i) => (
              <li key={i} className={i === scene.correct_index ? "qst-correct-choice" : undefined}>
                {c}
              </li>
            ))}
          </ul>
          <Markdown>{scene.explanation || ""}</Markdown>
        </div>
      )}
      <div className="qst-tutorial-nav">
        <button className="btn-ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0}>
          ← Prev
        </button>
        <button
          className="btn-ghost"
          onClick={() => setIdx(Math.min(build.sections.length - 1, idx + 1))}
          disabled={idx >= build.sections.length - 1}
        >
          Next →
        </button>
        <button className="send" onClick={onDone}>
          Back to the clue
        </button>
      </div>
    </div>
  );
}
