// The per-node "stage" panel for Math Quest: flavor narrative -> a freshly
// generated gate question -> on a wrong answer, a hint ladder ending in the
// full Feynman tutorial -> back to a fresh question. Reuses the existing
// lesson pipeline (lessonApi.ts) and tutor stream (api.ts) unmodified.
import { useEffect, useState } from "react";
import { buildLesson, fetchScene, type LessonBuild, type LessonScene } from "./lessonApi";
import { streamTutor } from "./api";
import { MicButton } from "./VoiceControls";
import Markdown from "./Markdown";
import type { QuestNode } from "./questApi";
import QuestSprite, { type QuestSkin } from "./QuestSprite";

type Phase = "loading" | "question" | "wrong" | "correct" | "tutorial" | "error";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

/** Fuzzy-match a dictated answer to one of the 4 choices. Returns null below confidence. */
function matchChoice(said: string, choices: string[]): number | null {
  const saidN = normalize(said);
  if (!saidN) return null;
  const letters = ["a", "b", "c", "d"];
  const letterIdx = letters.indexOf(saidN.replace(/^option\s+/, ""));
  if (letterIdx >= 0 && letterIdx < choices.length) return letterIdx;

  let best = -1;
  let bestScore = 0;
  choices.forEach((c, i) => {
    const cn = normalize(c);
    let score = 0;
    if (cn === saidN) score = 100;
    else if (cn.includes(saidN) || saidN.includes(cn)) score = 60 + Math.min(cn.length, saidN.length);
    else {
      const cWords = new Set(cn.split(" ").filter(Boolean));
      const overlap = saidN.split(" ").filter((w) => cWords.has(w)).length;
      score = overlap * 15;
    }
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return bestScore >= 20 ? best : null;
}

function topicFor(node: QuestNode): string {
  return node.description ? `${node.name} — ${node.description}` : node.name;
}

export default function QuestStage({
  node,
  level,
  skin,
  onSolved,
  onClose,
  onAsk,
}: {
  node: QuestNode;
  level: string;
  skin: QuestSkin;
  onSolved: (slug: string, score: number) => void;
  onClose: () => void;
  onAsk?: (question: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("loading");
  const [quiz, setQuiz] = useState<LessonScene | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [extraHint, setExtraHint] = useState("");
  const [hintBusy, setHintBusy] = useState(false);
  const [tutorial, setTutorial] = useState<LessonBuild | null>(null);
  const [tutorialIdx, setTutorialIdx] = useState(0);
  const [dictateNote, setDictateNote] = useState("");
  const [error, setError] = useState("");

  async function loadQuestion() {
    setPhase("loading");
    setPicked(null);
    setExtraHint("");
    setDictateNote("");
    setError("");
    try {
      const scene = await fetchScene(topicFor(node), level, {
        title: node.name,
        type: "quiz",
        summary: node.description,
      });
      setQuiz(scene);
      setPhase("question");
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  useEffect(() => {
    void loadQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node.slug]);

  function choose(i: number) {
    if (phase !== "question" && phase !== "wrong") return;
    setPicked(i);
    const correct = quiz?.correct_index ?? 0;
    if (i === correct) {
      const score = Math.max(20, 100 - wrongAttempts * 20);
      setPhase("correct");
      onSolved(node.slug, score);
    } else {
      setWrongAttempts((n) => n + 1);
      setPhase("wrong");
    }
  }

  function onDictate(text: string) {
    const choices = quiz?.choices || [];
    const idx = matchChoice(text, choices);
    if (idx === null) {
      setDictateNote(`Didn't catch that clearly ("${text}") — try again, or click your answer.`);
      return;
    }
    setDictateNote("");
    choose(idx);
  }

  async function askAnotherHint() {
    if (!quiz) return;
    setHintBusy(true);
    setExtraHint("");
    let full = "";
    try {
      await streamTutor(
        `I'm stuck on this question and picked the wrong answer. Give me one more hint (not the answer): ${quiz.question}`,
        {
          learnerLevel: level,
          history: [{ role: "assistant", content: `${node.flavor_hint}\n\n${quiz.explanation ?? ""}` }],
        },
        (tok) => {
          full += tok;
          setExtraHint(full);
        }
      );
    } catch (e) {
      setExtraHint(`⚠️ ${(e as Error).message}`);
    } finally {
      setHintBusy(false);
    }
  }

  async function openTutorial() {
    setPhase("tutorial");
    setTutorial(null);
    setTutorialIdx(0);
    try {
      const build = await buildLesson(topicFor(node), level);
      setTutorial(build);
    } catch (e) {
      setError((e as Error).message);
      setPhase("error");
    }
  }

  function returnToQuestion() {
    void loadQuestion();
  }

  const pose = phase === "correct" ? "success" : phase === "wrong" ? "stuck" : phase === "loading" ? "walk" : "idle";

  return (
    <div className="qst-stage">
      <div className="qst-stage-head">
        <QuestSprite skin={skin} pose={pose} size={72} />
        <div>
          <h3 className="qst-stage-title">{node.flavor_title}</h3>
          <p className="qst-stage-meta">
            {node.category.replace(/_/g, " ")} · {node.euclid_ref ? `Euclid ${node.euclid_ref}` : "applied idea"}
          </p>
        </div>
        <button className="link qst-stage-close" onClick={onClose}>close</button>
      </div>

      {phase === "loading" && <p className="status">The trail is being pieced together…</p>}
      {phase === "error" && (
        <div className="qst-verdict qst-wrong">
          <Markdown>{`Something went wrong: ${error}`}</Markdown>
          <button className="send" onClick={() => void loadQuestion()}>Try again</button>
        </div>
      )}

      {(phase === "question" || phase === "wrong" || phase === "correct") && quiz && (
        <>
          <p className="qst-flavor"><Markdown>{node.flavor_intro}</Markdown></p>
          <p className="q"><Markdown>{quiz.question || ""}</Markdown></p>
          <div className="choices">
            {(quiz.choices || []).map((c, i) => {
              const state =
                picked === null
                  ? ""
                  : i === quiz.correct_index
                  ? "right"
                  : i === picked
                  ? "wrong"
                  : "";
              return (
                <button
                  key={i}
                  className={`choice ${state}`}
                  onClick={() => choose(i)}
                  disabled={phase === "correct"}
                >
                  {c}
                </button>
              );
            })}
          </div>
          {phase !== "correct" && (
            <div className="qst-voice-row">
              <MicButton onDictate={onDictate} />
              <span className="set-hint">Or say your answer out loud.</span>
            </div>
          )}
          {dictateNote && <p className="set-hint">{dictateNote}</p>}

          {phase === "correct" && (
            <div className="qst-verdict qst-right">
              <p><strong>✅ Solved.</strong> <Markdown>{node.flavor_success}</Markdown></p>
              <button className="send" onClick={onClose}>Continue →</button>
            </div>
          )}

          {phase === "wrong" && (
            <div className="qst-verdict qst-wrong">
              <p><Markdown>{node.flavor_hint}</Markdown></p>
              <p><Markdown>{quiz.explanation || ""}</Markdown></p>
              <div className="qst-hint-actions">
                <button className="btn-ghost" onClick={() => void askAnotherHint()} disabled={hintBusy}>
                  {hintBusy ? "Thinking…" : "Another hint"}
                </button>
                <button className="btn-ghost" onClick={() => void openTutorial()}>
                  I don't know this — teach me
                </button>
                <button className="send" onClick={() => setPicked(null)}>Try again</button>
                {onAsk && (
                  <button className="link" onClick={() => onAsk(`Explain ${node.name}`)}>
                    Explore this in Learn →
                  </button>
                )}
              </div>
              {extraHint && (
                <div className="bubble assistant ask-answer">
                  <Markdown>{extraHint}</Markdown>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {phase === "tutorial" && (
        <TutorialViewer
          build={tutorial}
          idx={tutorialIdx}
          setIdx={setTutorialIdx}
          onDone={returnToQuestion}
        />
      )}
    </div>
  );
}

function TutorialViewer({
  build,
  idx,
  setIdx,
  onDone,
}: {
  build: LessonBuild | null;
  idx: number;
  setIdx: (n: number) => void;
  onDone: () => void;
}) {
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
        <button
          className="btn-ghost"
          onClick={() => setIdx(Math.max(0, idx - 1))}
          disabled={idx === 0}
        >
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
          Back to the question
        </button>
      </div>
    </div>
  );
}
