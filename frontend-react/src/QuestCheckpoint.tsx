// A deduction checkpoint — modeled directly on LogicLab.tsx's KnightsGame:
// a fixed cast, one option picked per entity, checked all-or-nothing against
// a pre-baked answer, same .lg-verdict green/red feedback language. This is
// where a Math Quest story's real "who did it" / "which path is real"
// reasoning happens.
import { useState } from "react";
import type { QuestCheckpoint as QuestCheckpointData } from "./questCheckpoints";
import Markdown from "./Markdown";
import QuestSprite, { type QuestSkin } from "./QuestSprite";

export default function QuestCheckpoint({
  checkpoint,
  skin,
  onPassed,
}: {
  checkpoint: QuestCheckpointData;
  skin: QuestSkin;
  onPassed: () => void;
}) {
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [result, setResult] = useState<"none" | "incomplete" | "right" | "wrong">("none");

  function choose(entity: string, option: string) {
    if (result === "right") return;
    setPicks((p) => ({ ...p, [entity]: option }));
    setResult("none");
  }

  function check() {
    if (!checkpoint.entities.every((e) => picks[e])) {
      setResult("incomplete");
      return;
    }
    const correct = checkpoint.entities.every((e) => picks[e] === checkpoint.answer[e]);
    setResult(correct ? "right" : "wrong");
  }

  return (
    <div className="qst-stage">
      <div className="qst-stage-head">
        <QuestSprite skin={skin} pose={result === "right" ? "success" : result === "wrong" ? "stuck" : "idle"} size={72} />
        <div>
          <h3 className="qst-stage-title">{checkpoint.title}</h3>
        </div>
      </div>

      <div className="lg-scenario">
        <Markdown>{checkpoint.scenario}</Markdown>
      </div>

      {checkpoint.entities.map((entity) => (
        <div key={entity} className="lg-person">
          <strong>{entity}</strong>
          <div className="chips">
            {checkpoint.options.map((opt) => (
              <button
                key={opt}
                className={`chip ${picks[entity] === opt ? "active" : ""}`}
                onClick={() => choose(entity, opt)}
                disabled={result === "right"}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="set-actions">
        <button className="send" onClick={check} disabled={result === "right"}>
          {result === "right" ? "Solved" : "Check"}
        </button>
        {result === "incomplete" && <span className="set-hint">Pick an answer for everyone first.</span>}
      </div>

      {(result === "right" || result === "wrong") && (
        <div className={`lg-verdict ${result === "right" ? "lg-tautology" : "lg-contradiction"}`}>
          <strong>{result === "right" ? "✓ That fits." : "✗ Not quite."}</strong>
          <p style={{ margin: "6px 0 0" }}>
            <Markdown>{result === "right" ? checkpoint.explain : checkpoint.wrongConsequence}</Markdown>
          </p>
          {result === "right" && checkpoint.resolution && (
            <div className="qst-resolution">
              <Markdown>{checkpoint.resolution}</Markdown>
            </div>
          )}
          {result === "right" && (
            <button className="send" onClick={onPassed} style={{ marginTop: 10 }}>
              {checkpoint.resolution ? "Finish" : "Continue →"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
