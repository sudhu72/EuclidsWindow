// Math Quest — top-level: a story + level start screen, then the case-board
// / treasure-map graph, with a stage panel overlaid when a node is open.
import { useEffect, useState } from "react";
import { fetchQuestGraph, fetchProgress, putProgress, type QuestGraph, type QuestNode, type QuestTheme } from "./questApi";
import { getState, setStoryAndLevel, getCompletedSlugs, markCompleted, mergeCompleted } from "./questProgress";
import { useAuth } from "./auth";
import { levelLabel } from "./levelLabels";
import { QUEST_STORIES, storyById, type QuestStory } from "./questStories";
import QuestMap from "./QuestMap";
import QuestStage from "./QuestStage";
import QuestSprite, { type QuestSkin } from "./QuestSprite";

const LEVELS = ["kids", "teen", "college", "adult"];

const SKIN_BY_THEME: Record<QuestTheme, QuestSkin> = {
  mystery: "detective",
  treasure: "explorer",
};

export default function Quest({ onAsk }: { onAsk?: (question: string) => void }) {
  const { user } = useAuth();
  const initial = getState();
  const [storyId, setStoryId] = useState<string | null>(initial.storyId);
  const [level, setLevel] = useState<string | null>(initial.level);
  const [graph, setGraph] = useState<QuestGraph | null>(null);
  const [completed, setCompleted] = useState<Set<string>>(getCompletedSlugs());
  const [selected, setSelected] = useState<QuestNode | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string | null>(null);
  const [status, setStatus] = useState("");

  const story = storyId ? storyById(storyId) : undefined;

  useEffect(() => {
    if (!story) return;
    setStatus("Loading the case board…");
    fetchQuestGraph(story.theme)
      .then((g) => {
        setGraph(g);
        setStatus("");
      })
      .catch((e) => setStatus(`Couldn't load: ${(e as Error).message}`));
  }, [story]);

  useEffect(() => {
    if (!user) return;
    fetchProgress()
      .then((entries) => {
        const done = entries.filter((e) => e.status === "completed").map((e) => e.concept_slug);
        if (done.length) {
          mergeCompleted(done);
          setCompleted(getCompletedSlugs());
        }
      })
      .catch(() => {
        /* anonymous-equivalent fallback — localStorage already has what we have */
      });
  }, [user]);

  function begin(s: QuestStory, l: string) {
    setStoryAndLevel(s.id, s.theme, l);
    setStoryId(s.id);
    setLevel(l);
  }

  function onSolved(slug: string, score: number) {
    markCompleted(slug, score);
    setCompleted(getCompletedSlugs());
    if (user) putProgress(slug, "completed", score);
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

  return (
    <div className="qst-shell">
      <div className="qst-header">
        <div>
          <h3 className="lesson-title">{story.title}</h3>
          <p className="qst-stage-meta">{story.setting}</p>
        </div>
        <button
          className="btn-ghost"
          onClick={() => {
            setStoryId(null);
            setLevel(null);
          }}
        >
          Change story/level
        </button>
      </div>

      {status && <p className="status">{status}</p>}

      <div className="qst-scroll">
        {graph && !selected && (
          <QuestMap
            graph={graph}
            completed={completed}
            currentSlug={currentSlug}
            onSelect={(n) => {
              setCurrentSlug(n.slug);
              setSelected(n);
            }}
          />
        )}

        {selected && (
          <QuestStage
            node={selected}
            level={level}
            skin={skin}
            onSolved={onSolved}
            onClose={() => setSelected(null)}
            onAsk={onAsk}
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
        Learn all of mathematics as a story. Pick a case to crack or a trail to follow, then how
        deep to go — you can change either later.
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
            className={`qst-theme-card ${selected === s.id ? "active" : ""}`}
            onClick={() => onPick(s.id)}
          >
            <QuestSprite skin={skin} pose="idle" size={56} />
            <strong>{s.title}</strong>
            <span>{s.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
