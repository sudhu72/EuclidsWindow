// Math Quest API client. The graph fetch hits the new /api/quest/graph
// endpoint; the gate-question and full-tutorial calls reuse the existing
// lesson pipeline (lessonApi.ts) unmodified; progress sync reuses the
// existing, previously-uncalled /api/progress endpoints.
import { authHeaders } from "./auth";

export type QuestTheme = "mystery" | "treasure";

export interface QuestNode {
  slug: string;
  name: string;
  description: string;
  level: number;
  category: string;
  euclid_ref?: string | null;
  prerequisites: string[];
  x: number;
  y: number;
  flavor_title: string;
  flavor_intro: string;
  flavor_hint: string;
  flavor_success: string;
}

export interface QuestEdge {
  source: string;
  target: string;
}

export interface QuestChapter {
  level: number;
  title: string;
}

export interface QuestGraph {
  theme: QuestTheme;
  nodes: QuestNode[];
  edges: QuestEdge[];
  chapters: QuestChapter[];
}

export async function fetchQuestGraph(theme: QuestTheme): Promise<QuestGraph> {
  const resp = await fetch(`/api/quest/graph?theme=${theme}`);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.json();
}

export interface ProgressEntry {
  concept_slug: string;
  status: "not_started" | "in_progress" | "completed";
  score?: number | null;
  last_accessed: string;
}

/** Logged-in players only — anonymous play never calls these. */
export async function fetchProgress(): Promise<ProgressEntry[]> {
  const resp = await fetch("/api/progress", { headers: { ...authHeaders() } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const body = await resp.json();
  return body.progress ?? [];
}

export async function putProgress(
  slug: string,
  status: ProgressEntry["status"],
  score?: number
): Promise<void> {
  await fetch(`/api/progress/${encodeURIComponent(slug)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status, score }),
  }).catch(() => {
    /* fire-and-forget — localStorage already has the authoritative copy */
  });
}
