// Local progress store for Math Quest. Mirrors auth.tsx's plain-function,
// no-React-dependency convention so any component can read/write directly.
// Anonymous play never touches the backend; logged-in play additionally
// syncs completions to the existing /api/progress endpoints (questApi.ts).
import type { QuestNode, QuestTheme } from "./questApi";

const STORE_KEY = "ew_quest_progress";

export interface QuestProgressState {
  theme: QuestTheme | null;
  storyId: string | null;
  level: string | null;
  completed: Record<string, { score?: number; at: string }>;
}

function emptyState(): QuestProgressState {
  return { theme: null, storyId: null, level: null, completed: {} };
}

function load(): QuestProgressState {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed };
  } catch {
    return emptyState();
  }
}

function save(state: QuestProgressState): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* private browsing / storage disabled — progress just won't persist */
  }
}

export function getState(): QuestProgressState {
  return load();
}

export function setStoryAndLevel(storyId: string, theme: QuestTheme, level: string): void {
  const state = load();
  state.storyId = storyId;
  state.theme = theme;
  state.level = level;
  save(state);
}

export function getCompletedSlugs(): Set<string> {
  return new Set(Object.keys(load().completed));
}

export function isCompleted(slug: string): boolean {
  return slug in load().completed;
}

export function markCompleted(slug: string, score?: number): void {
  const state = load();
  state.completed[slug] = { score, at: new Date().toISOString() };
  save(state);
}

/** Merge in completions from the backend (call once after login). */
export function mergeCompleted(slugs: string[]): void {
  const state = load();
  for (const slug of slugs) {
    if (!(slug in state.completed)) {
      state.completed[slug] = { at: new Date().toISOString() };
    }
  }
  save(state);
}

/** A node is unlocked once every one of its prerequisites is completed. */
export function isUnlocked(node: QuestNode, completed: Set<string>): boolean {
  return node.prerequisites.every((p) => completed.has(p));
}
