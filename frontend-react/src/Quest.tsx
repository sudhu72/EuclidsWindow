// Math Quest — top-level: a story + level start screen, then a hand-authored
// mystery/treasure-hunt experience (intro -> clue -> deduction checkpoint ->
// ... -> ending). Only "ready" stories are playable; the rest are shown as a
// "coming soon" catalog. See questClues.ts/questCheckpoints.ts/questIntros.ts
// for the actual story content.
import { useMemo, useState } from "react";
import type { QuestTheme } from "./questApi";
import {
  getState,
  setStoryAndLevel,
  getStoryProgress,
  markClueSolved,
  markCheckpointPassed,
} from "./questProgress";
import { levelLabel } from "./levelLabels";
import { QUEST_STORIES, storyById, type QuestStory } from "./questStories";
import { cluesForStory } from "./questClues";
import { checkpointsForStory, type QuestCheckpoint as QuestCheckpointData } from "./questCheckpoints";
import { introForStory } from "./questIntros";
import QuestClue from "./QuestClue";
import QuestCheckpoint from "./QuestCheckpoint";
import QuestCaseFile from "./QuestCaseFile";
import QuestSprite, { type QuestSkin } from "./QuestSprite";
import Markdown from "./Markdown";

const LEVELS = ["kids", "teen", "college", "adult"];

const SKIN_BY_THEME: Record<QuestTheme, QuestSkin> = {
  mystery: "detective",
  treasure: "explorer",
};

type Resolved =
  | { kind: "checkpoint"; checkpoint: QuestCheckpointData }
  | { kind: "clue"; clue: ReturnType<typeof cluesForStory>[number] }
  | { kind: "ended" };

function resolvePhase(storyId: string): Resolved {
  const clues = cluesForStory(storyId);
  const checkpoints = checkpointsForStory(storyId);
  const progress = getStoryProgress(storyId);
  const solved = new Set(progress.solvedClues);
  const passed = new Set(progress.passedCheckpoints);

  const pending = checkpoints.find((cp) => solved.has(cp.afterClue) && !passed.has(cp.id));
  if (pending) return { kind: "checkpoint", checkpoint: pending };

  const nextClue = clues.find((c) => !solved.has(c.id));
  if (nextClue) return { kind: "clue", clue: nextClue };

  return { kind: "ended" };
}

export default function Quest() {
  const initial = getState();
  const [storyId, setStoryId] = useState<string | null>(initial.storyId);
  const [level, setLevel] = useState<string | null>(initial.level);
  const [version, setVersion] = useState(0);

  // A storyId left over from before a story was marked "soon" (or before it
  // existed at all) has no clue/checkpoint/intro content — treat it as
  // nothing selected rather than rendering a blank screen.
  const rawStory = storyId ? storyById(storyId) : undefined;
  const story = rawStory?.status === "ready" ? rawStory : undefined;
  const progress = story ? getStoryProgress(story.id) : null;
  const hasStarted = !!progress && (progress.solvedClues.length > 0 || progress.passedCheckpoints.length > 0);
  const [introDone, setIntroDone] = useState(hasStarted);

  const resolved = useMemo(() => (story ? resolvePhase(story.id) : null), [story, version]);
  const solvedClues = useMemo(
    () => (story ? cluesForStory(story.id).filter((c) => getStoryProgress(story.id).solvedClues.includes(c.id)) : []),
    [story, version]
  );

  function begin(s: QuestStory, l: string) {
    setStoryAndLevel(s.id, s.theme, l);
    setStoryId(s.id);
    setLevel(l);
    setIntroDone(getStoryProgress(s.id).solvedClues.length > 0 || getStoryProgress(s.id).passedCheckpoints.length > 0);
  }

  function changeStory() {
    setStoryId(null);
    setLevel(null);
  }

  if (!story || !level) {
    return (
      <div className="qst-shell">
        <div className="qst-scroll">
          <QuestStartScreen onBegin={begin} />
        </div>
      </div>
    );
  }

  const skin = SKIN_BY_THEME[story.theme];
  const intro = introForStory(story.id);

  return (
    <div className="qst-shell">
      <div className="qst-header">
        <div>
          <h3 className="lesson-title">{story.title}</h3>
          <p className="qst-stage-meta">{story.setting}</p>
        </div>
        <button className="btn-ghost" onClick={changeStory}>Change story/level</button>
      </div>

      <div className="qst-scroll">
        {!introDone && intro && (
          <div className="qst-stage">
            <div className="qst-stage-head">
              <QuestSprite skin={skin} pose="idle" size={72} />
            </div>
            <div className="qst-flavor">
              <Markdown>{intro.sceneText}</Markdown>
            </div>
            <div className="qst-cast">
              {intro.cast.map((c) => (
                <p key={c.name}>
                  <strong>{c.name}.</strong> {c.detail}
                </p>
              ))}
            </div>
            <button className="send" onClick={() => setIntroDone(true)}>
              {story.theme === "mystery" ? "Begin the Investigation →" : "Follow the Trail →"}
            </button>
          </div>
        )}

        {introDone && resolved?.kind === "clue" && (
          <QuestClue
            key={resolved.clue.id}
            clue={resolved.clue}
            index={cluesForStory(story.id).findIndex((c) => c.id === resolved.clue.id)}
            total={cluesForStory(story.id).length}
            level={level}
            skin={skin}
            onSolved={() => {
              markClueSolved(story.id, resolved.clue.id);
              setVersion((v) => v + 1);
            }}
          />
        )}

        {introDone && resolved?.kind === "checkpoint" && (
          <QuestCheckpoint
            key={resolved.checkpoint.id}
            checkpoint={resolved.checkpoint}
            skin={skin}
            onPassed={() => {
              markCheckpointPassed(story.id, resolved.checkpoint.id);
              setVersion((v) => v + 1);
            }}
          />
        )}

        {introDone && resolved?.kind === "ended" && (
          <div className="qst-stage">
            <div className="qst-stage-head">
              <QuestSprite skin={skin} pose="success" size={72} />
              <h3 className="qst-stage-title">
                {story.theme === "mystery" ? "Case Closed" : "Treasure Found"}
              </h3>
            </div>
            <p className="qst-flavor">You solved every clue in {story.title}.</p>
            <button className="send" onClick={changeStory}>Choose another story</button>
          </div>
        )}

        {introDone && (
          <QuestCaseFile
            title={story.theme === "mystery" ? "Case File" : "Field Notes"}
            clues={solvedClues}
          />
        )}
      </div>
    </div>
  );
}

function QuestStartScreen({ onBegin }: { onBegin: (story: QuestStory, level: string) => void }) {
  const [storyId, setStoryId] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const story = storyId ? storyById(storyId) : undefined;

  const mysteries = QUEST_STORIES.filter((s) => s.theme === "mystery");
  const treasures = QUEST_STORIES.filter((s) => s.theme === "treasure");

  return (
    <div className="qst-start">
      <h3 className="lesson-title">Math Quest</h3>
      <p className="dsub">
        Learn mathematics as a puzzle-story. Two full cases are ready to play now — more are on the way.
      </p>

      <StoryGroup title="🕵️ Murder mysteries" skin="detective" stories={mysteries} selected={storyId} onPick={setStoryId} />
      <StoryGroup title="🗺️ Treasure hunts" skin="explorer" stories={treasures} selected={storyId} onPick={setStoryId} />

      <p className="qst-level-prompt">Choose your level:</p>
      <div className="chips">
        {LEVELS.map((l) => (
          <button
            key={l}
            className={`chip ${level === l ? "active" : ""}`}
            onClick={() => setLevel(l)}
          >
            {levelLabel(l)}
          </button>
        ))}
      </div>

      <button
        className="send"
        disabled={!story || !level}
        onClick={() => story && level && onBegin(story, level)}
      >
        Begin
      </button>
    </div>
  );
}

function StoryGroup({
  title,
  skin,
  stories,
  selected,
  onPick,
}: {
  title: string;
  skin: QuestSkin;
  stories: QuestStory[];
  selected: string | null;
  onPick: (id: string) => void;
}) {
  return (
    <div className="qst-story-group">
      <h4>{title}</h4>
      <div className="qst-theme-grid">
        {stories.map((s) => (
          <button
            key={s.id}
            className={`qst-theme-card ${selected === s.id ? "active" : ""} ${s.status === "soon" ? "qst-soon" : ""}`}
            onClick={() => s.status === "ready" && onPick(s.id)}
            disabled={s.status === "soon"}
          >
            <QuestSprite skin={skin} pose="idle" size={56} />
            <strong>{s.title}</strong>
            <span>{s.blurb}</span>
            {s.status === "soon" && <span className="qst-soon-badge">Coming soon</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
