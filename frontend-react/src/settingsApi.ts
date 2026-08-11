// Settings + model-management client. Mirrors the FastAPI schemas in
// backend/app/models.py (AppSettingsResponse / AppSettingsUpdate / Ollama*).

export interface AppSettings {
  llm_provider: string;
  cloud_llm_model: string | null;
  cloud_keys_set: Record<string, boolean>;
  local_ai_enabled: boolean;
  local_llm_model: string;
  local_codegen_model: string | null;
  local_fast_model: string | null;
  local_media_enabled: boolean;
  local_diffusion_model: string;
  local_music_model: string;
  local_media_device: string;
  local_multi_agent_enabled: boolean;
  local_web_rag_enabled: boolean;
  fast_mode_enabled: boolean;
  local_music_timeout_seconds: number;
  local_music_fast_mode: boolean;
  local_diffusion_timeout_seconds: number;
}

/** Every field is optional — the endpoint patches only what it's sent. */
export type SettingsPatch = Partial<
  Omit<AppSettings, "cloud_keys_set"> & {
    anthropic_api_key: string;
    openai_api_key: string;
    xai_api_key: string;
    gemini_api_key: string;
  }
>;

export interface OllamaModel {
  name: string;
  size_gb: number;
  loaded: boolean;
}

export interface ModelsResponse {
  available: OllamaModel[];
  recommended: Record<string, unknown>[];
}

export interface AgentInfo {
  id: string;
  name: string;
  status: string;
  details?: string | null;
  run_count?: number | null;
  last_run_ms?: number | null;
  last_error?: string | null;
  last_run_at?: string | null;
}

export const PROVIDERS: [string, string][] = [
  ["ollama", "Local Ollama (free, private, offline)"],
  ["anthropic", "Anthropic Claude (paid API)"],
  ["openai", "OpenAI (paid API)"],
  ["xai", "xAI Grok (paid API)"],
  ["gemini", "Google Gemini (paid API)"],
];

export interface HardwarePreset {
  id: string;
  label: string;
  model: string;
  device: string;
  desc: string;
}

/** Kept in sync with HARDWARE_PRESETS in the classic frontend's app.js. */
export const HARDWARE_PRESETS: HardwarePreset[] = [
  {
    id: "cpu-light",
    label: "CPU only (low RAM / Docker VM)",
    model: "qwen2.5:1.5b",
    device: "cpu",
    desc: "Small model (~1 GB). Best for Docker on Mac, low-RAM machines, or Raspberry Pi.",
  },
  {
    id: "cpu",
    label: "CPU only (16+ GB RAM)",
    model: "phi4-mini",
    device: "cpu",
    desc: "3.8B model with strong reasoning. Good for 16+ GB RAM native CPU setups.",
  },
  {
    id: "apple-silicon",
    label: "Apple Silicon (M1/M2/M3/M4)",
    model: "phi4-mini-reasoning",
    device: "mps",
    desc: "Chain-of-thought reasoning via Metal GPU. Fast on M1/M2/M3/M4 (~15-25 tok/s).",
  },
  {
    id: "gpu",
    label: "NVIDIA GPU (6-8 GB VRAM)",
    model: "qwen2.5-math:7b",
    device: "cuda",
    desc: "Math-specialized 7B. Excellent quality on 6-8 GB VRAM (~25 tok/s).",
  },
  {
    id: "gpu-large",
    label: "NVIDIA GPU (12+ GB VRAM)",
    model: "deepseek-r1:14b",
    device: "cuda",
    desc: "Top-tier reasoning 14B. Needs 12+ GB VRAM (~12 tok/s).",
  },
];

async function json<T>(resp: Response): Promise<T> {
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error((data as { detail?: string }).detail || `HTTP ${resp.status}`);
  }
  return data as T;
}

export const getSettings = async () => json<AppSettings>(await fetch("/api/settings"));

export const saveSettings = async (patch: SettingsPatch) =>
  json<AppSettings>(
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
  );

export const getModels = async () => json<ModelsResponse>(await fetch("/api/settings/models"));

export const pullModel = async (model: string) =>
  json<{ success: boolean; message: string }>(
    await fetch("/api/settings/models/pull", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model }),
    })
  );

export const testTarget = async (target: "ollama" | "diffusion" | "music") =>
  json<{ success: boolean; message?: string }>(
    await fetch("/api/settings/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target }),
    })
  );

export const testLlm = async () =>
  json<{ available: boolean; message?: string }>(
    await fetch("/api/settings/test-llm", { method: "POST" })
  );

export const getAgents = async () =>
  json<{ agents: AgentInfo[] }>(await fetch("/api/agents"));
