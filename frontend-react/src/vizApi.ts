// Visualization endpoints shared by the Learn panel: the deterministic planner,
// the VizAgent, media generation, and the async diagram job queue.

export type VizType = "svg" | "plotly" | "manim" | "mermaid";

export interface VizPayload {
  viz_id: string;
  viz_type: VizType;
  title: string;
  data: Record<string, unknown>;
}

export interface VizJob {
  id: string;
  status: string;
  progress: number;
  question?: string | null;
  visualization?: VizPayload | null;
  error?: string | null;
}

async function json<T>(resp: Response): Promise<T> {
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error((data as { detail?: string }).detail || `HTTP ${resp.status}`);
  return data as T;
}

/** Deterministic visual planner — keyword-matched, no LLM. */
export const visualizeOnDemand = async (question: string, asyncRender = true) =>
  json<{
    message: string;
    visualization?: VizPayload | null;
    visualization_job_id?: string | null;
    animation_id?: string | null;
    status?: string | null;
    error?: string | null;
  }>(
    await fetch("/api/ai/visualize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, style: "diagram", async_render: asyncRender }),
    })
  );

/** VizAgent — derives a chart/diagram from answer text, heuristics then LLM. */
export const vizAgent = async (question: string, answerText: string, useLlm = true) =>
  json<{ visualization?: VizPayload | null; source: string }>(
    await fetch("/api/ai/viz-agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer_text: answerText, use_llm: useLlm }),
    })
  );

export const getVizJob = async (id: string) =>
  json<VizJob>(await fetch(`/api/visualizations/jobs/${encodeURIComponent(id)}`));

export const listVizJobs = async (limit = 12) =>
  json<{ jobs: VizJob[] }>(await fetch(`/api/visualizations/jobs?limit=${limit}`));

export const generateImage = async (prompt: string) =>
  json<{ url: string; model?: string | null }>(
    await fetch("/api/ai/media/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    })
  );

export const generateMusic = async (prompt: string, durationSeconds = 10) =>
  json<{ url: string; model?: string | null }>(
    await fetch("/api/ai/media/music", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, duration_seconds: durationSeconds }),
    })
  );

/**
 * Statuses a diagram job can end on. The backend's vocabulary is
 * queued | running | completed | error, plus not_found for an unknown id —
 * note "completed", not "done".
 */
const TERMINAL_STATUSES = new Set(["completed", "error", "not_found"]);

/** Poll a diagram job to completion. Resolves with the finished job. */
export async function pollVizJob(
  id: string,
  onProgress: (job: VizJob) => void,
  intervalMs = 1500,
  timeoutMs = 240000
): Promise<VizJob> {
  const started = Date.now();
  for (;;) {
    const job = await getVizJob(id);
    onProgress(job);
    if (TERMINAL_STATUSES.has(job.status)) return job;
    if (Date.now() - started > timeoutMs) {
      return { ...job, status: "error", error: "Timed out waiting for the render." };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
