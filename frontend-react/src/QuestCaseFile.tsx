// The accumulating-evidence panel — turns "N solved" into a readable,
// growing narrative artifact instead of a bare counter. Pure presentation:
// the caller passes the already-solved clues in order.
import type { QuestClue } from "./questClues";
import Markdown from "./Markdown";

export default function QuestCaseFile({
  title,
  clues,
}: {
  title: string;
  clues: QuestClue[];
}) {
  if (clues.length === 0) return null;
  return (
    <details className="qst-casefile">
      <summary>{title} ({clues.length})</summary>
      <ol>
        {clues.map((c) => (
          <li key={c.id}>
            <Markdown>{c.solvedBeat}</Markdown>
          </li>
        ))}
      </ol>
    </details>
  );
}
