// Settings -> Model tuning: the RAFT pipeline run by the host tuning helper
// (scripts/lora/agent.py) through /api/tuning/*.

export interface TuningOptions {
  books: { source: string; chunks: number }[];
  local_models: string[];
  claude_available: boolean;
  claude_judge: string;
  defaults: { teacher: string; judges: string[]; per_source: number; eval_n: number };
  current_model?: string;
}

export interface TuningStep {
  name: string;
  status: "pending" | "running" | "done" | "error";
  detail: string;
}

export interface GateSummary {
  tuned: string;
  base: string;
  n: number;
  judges: Record<string, { tuned: number; base: number; tie: number }>;
  base_stats: { cites_when_excerpts: string; fabricated_citations: number; loops: number };
  tuned_stats: { cites_when_excerpts: string; fabricated_citations: number; loops: number };
  verdict: "PROMOTE" | "KEEP BASE";
}

export interface TuningRun {
  id: string;
  status: "running" | "done" | "error" | "cancelled";
  progress: number;
  options: { sources: string[]; per_source: number; teacher: string; judges: string[]; eval_n: number };
  steps: TuningStep[];
  log_tail: string[];
  error?: string;
  test?: GateSummary;
  result?: { model: string; verdict: string; checkpoint: string; test: GateSummary };
}

export interface TuningStatus {
  online: boolean;
  hint?: string;
  run: TuningRun | null;
  history: { id: string; status: string; result?: { model: string; verdict: string } }[];
}

async function json<T>(resp: Response): Promise<T> {
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error((data as { detail?: string }).detail || `HTTP ${resp.status}`);
  return data as T;
}

const post = (path: string, body: unknown = {}) =>
  fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

export const getTuningOptions = async () => json<TuningOptions>(await fetch("/api/tuning/options"));
export const getTuningStatus = async () => json<TuningStatus>(await fetch("/api/tuning/status"));
export const startTuning = async (opts: TuningRun["options"]) => json<TuningRun>(await post("/api/tuning/start", opts));
export const cancelTuning = async () => json<{ cancelling: boolean }>(await post("/api/tuning/cancel"));
export const promoteTuned = async () => json<{ local_llm_model: string }>(await post("/api/tuning/promote"));

/** Model family, for spotting judges that would favour their own family.
 *  euclid-tutor models are LoRA tunes of Qwen3-4B. */
export const family = (model: string) =>
  model.startsWith("claude") ? "claude" :
  model.startsWith("euclid-tutor") ? "qwen" :
  model.split(":")[0].replace(/[\d.]+$/, "").toLowerCase();

/**
 * Rough cost and time for a run, from measured runs on an M-series Mac:
 * Claude teacher ~$0.08/question and ~6 s/question; a local 8B teacher
 * (thinking on) ~40 s/question; training ~16 s/step; export ~6 min per
 * checkpoint; each gate prompt ~50 s with local judges.
 */
export function estimate(o: TuningRun["options"]) {
  const questions = Math.round(o.sources.length * o.per_source * 0.85);
  const claudeTeacher = o.teacher.startsWith("claude");
  const claudeJudges = o.judges.filter((j) => j.startsWith("claude")).length;
  const judgeCalls = 2 * o.eval_n * 3; // both orders x (2 checkpoints on valid + 1 on test)
  const cost = (claudeTeacher ? questions * 0.08 : 0) + claudeJudges * judgeCalls * 0.004;
  const steps = 2 * Math.max(20, Math.round((questions * 0.8) / 4 / 10) * 10);
  const minutes =
    (questions * (claudeTeacher ? 6 : 40)) / 60 + (steps * 16) / 60 + 12 + (o.eval_n * 3 * 50) / 60;
  return { questions, cost, hours: minutes / 60 };
}
