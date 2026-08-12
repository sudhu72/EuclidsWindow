// On-demand Manim animation.
//
// Two routes exist. /api/ai/animate runs the pipeline (template -> LLM ->
// generic fallback) synchronously and always returns a clip, which is fine for
// short renders but holds the request open. /api/ai/visualize with
// style="animation" queues the same work and hands back an animation id to poll
// through /api/animations/{id}, so a slow render reports progress instead of
// blocking. Named pre-built scenes go through /api/animations/render.

export interface ManimViz {
  viz_type: string;
  title?: string;
  data: { url?: string; format?: string; scene_name?: string };
}

export interface AnimationJob {
  id: string;
  status: string; // pending | rendering | completed | error
  progress: number;
  scene_name?: string | null;
  url?: string | null;
  format?: string | null;
  error?: string | null;
}

/** Terminal states for an animation job — note "completed", not "done". */
const TERMINAL = new Set(["completed", "error", "not_found", "failed"]);

async function json<T>(resp: Response): Promise<T> {
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(
      (data as { detail?: string; message?: string }).detail ||
        (data as { message?: string }).message ||
        `HTTP ${resp.status}`
    );
  }
  return data as T;
}

/** Synchronous render — kept for short clips and as the queue's fallback. */
export async function animate(topic: string): Promise<ManimViz | null> {
  const d = await json<{ visualization?: ManimViz | null }>(
    await fetch("/api/ai/animate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: topic, quality: "low", output_format: "gif" }),
    })
  );
  const viz = d.visualization ?? null;
  return viz && viz.data?.url ? viz : null;
}

/** Queue an animation for a topic. Returns the id to poll, if one was queued. */
export async function queueAnimation(topic: string): Promise<string | null> {
  const d = await json<{ animation_id?: string | null }>(
    await fetch("/api/ai/visualize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: topic,
        style: "animation",
        quality: "low",
        output_format: "gif",
        async_render: true,
      }),
    })
  );
  return d.animation_id ?? null;
}

/** Render a named pre-built Manim scene. */
export const renderScene = async (
  sceneName: string,
  quality = "low",
  outputFormat = "gif",
  background = true
) =>
  json<AnimationJob>(
    await fetch("/api/animations/render", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scene_name: sceneName,
        quality,
        output_format: outputFormat,
        background,
      }),
    })
  );

export const getAnimation = async (id: string) =>
  json<AnimationJob>(await fetch(`/api/animations/${encodeURIComponent(id)}`));

export const listAnimationJobs = async (limit = 12) =>
  json<{ jobs: AnimationJob[] }>(await fetch(`/api/animations/jobs?limit=${limit}`));

export const deleteAnimation = async (id: string) =>
  json<{ deleted: boolean }>(
    await fetch(`/api/animations/${encodeURIComponent(id)}`, { method: "DELETE" })
  );

/** Poll an animation job to a terminal state. */
export async function pollAnimation(
  id: string,
  onProgress: (job: AnimationJob) => void,
  intervalMs = 2000,
  timeoutMs = 300000
): Promise<AnimationJob> {
  const started = Date.now();
  for (;;) {
    const job = await getAnimation(id);
    onProgress(job);
    if (TERMINAL.has(job.status)) return job;
    if (Date.now() - started > timeoutMs) {
      return { ...job, status: "error", error: "Timed out waiting for the render." };
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
}
