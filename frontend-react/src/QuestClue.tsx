// Renders one hand-authored clue: the in-world scene, the puzzle phrased
// entirely in-story, choices (click or voice), and — only after solving —
// the plot payoff plus a small, skippable reveal of the math concept behind
// it. A wrong pick shows a narrative consequence that still carries a real
// mathematical nudge. This replaces the old generic per-node LLM quiz.
import { useEffect, useState } from "react";
import type { QuestClue as QuestClueData } from "./questClues";
import { MicButton } from "./VoiceControls";
import { matchChoice } from "./questVoiceMatch";
import Markdown from "./Markdown";
import QuestSprite, { type QuestSkin } from "./QuestSprite";
import QuestTutorial from "./QuestTutorial";

type Phase = "puzzle" | "wrong" | "correct" | "tutorial";

export default function QuestClue({
  clue,
  index,
  total,
  level,
  skin,
  onSolved,
}: {
  clue: QuestClueData;
  index: number;
  total: number;
  level: string;
  skin: QuestSkin;
  onSolved: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("puzzle");
  const [picked, setPicked] = useState<number | null>(null);
  const [dictateNote, setDictateNote] = useState("");

  useEffect(() => {
    setPhase("puzzle");
    setPicked(null);
    setDictateNote("");
  }, [clue.id]);

  function choose(i: number) {
    if (phase !== "puzzle" && phase !== "wrong") return;
    setPicked(i);
    setPhase(i === clue.correctIndex ? "correct" : "wrong");
  }

  function onDictate(text: string) {
    const idx = matchChoice(text, clue.choices);
    if (idx === null) {
      setDictateNote(`Didn't catch that clearly ("${text}") — try again, or click your answer.`);
      return;
    }
    setDictateNote("");
    choose(idx);
  }

  const pose = phase === "correct" ? "success" : phase === "wrong" ? "stuck" : "idle";

  return (
    <div className="qst-stage">
      <div className="qst-stage-head">
        <QuestSprite skin={skin} pose={pose} size={72} />
        <div>
          <p className="qst-stage-meta">Clue {index + 1} of {total}</p>
        </div>
      </div>

      {phase !== "tutorial" && (
        <>
          <p className="qst-flavor"><Markdown>{clue.sceneText}</Markdown></p>
          <p className="q"><Markdown>{clue.puzzle}</Markdown></p>
          <div className="choices">
            {clue.choices.map((c, i) => {
              const state =
                picked === null ? "" : i === clue.correctIndex ? "right" : i === picked ? "wrong" : "";
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
              <p><Markdown>{clue.solvedBeat}</Markdown></p>
              <p className="qst-concept-reveal">🔎 What you just used: <strong>{clue.concept}</strong></p>
              <button className="send" onClick={onSolved}>Continue →</button>
            </div>
          )}

          {phase === "wrong" && (
            <div className="qst-verdict qst-wrong">
              <p><Markdown>{clue.wrongBeat}</Markdown></p>
              <div className="qst-hint-actions">
                <button className="btn-ghost" onClick={() => setPhase("tutorial")}>
                  I don't know this — teach me
                </button>
                <button className="send" onClick={() => setPicked(null)}>Try again</button>
              </div>
            </div>
          )}
        </>
      )}

      {phase === "tutorial" && (
        <QuestTutorial topic={clue.concept} level={level} onDone={() => setPhase("wrong")} />
      )}
    </div>
  );
}
