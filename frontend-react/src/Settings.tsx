import { useEffect, useState } from "react";
import {
  AgentInfo,
  AppSettings,
  HARDWARE_PRESETS,
  OllamaModel,
  PROVIDERS,
  SettingsPatch,
  getAgents,
  getModels,
  getSettings,
  pullModel,
  saveSettings,
  testLlm,
  testTarget,
} from "./settingsApi";

/**
 * Native port of the classic #tab-settings panel: provider choice, hardware
 * presets, local model management, feature toggles, media models, and the agent
 * roster. Library/RAG management lives in its own Library tab, so it isn't
 * duplicated here.
 */
/**
 * Fields the user can edit here. `cloud_keys_set` is read-only and the API keys
 * are write-only, so both are handled separately.
 */
const EDITABLE: (keyof AppSettings)[] = [
  "llm_provider",
  "cloud_llm_model",
  "local_ai_enabled",
  "local_llm_model",
  "local_media_enabled",
  "local_diffusion_model",
  "local_music_model",
  "local_media_device",
  "local_multi_agent_enabled",
  "local_web_rag_enabled",
  "fast_mode_enabled",
  "local_music_timeout_seconds",
  "local_music_fast_mode",
  "local_diffusion_timeout_seconds",
];

export default function Settings() {
  const [s, setS] = useState<AppSettings | null>(null);
  // GET /api/settings returns *effective* settings — with fast mode on, the
  // backend substitutes a fast local_llm_model into the response. Writing the
  // whole object back would persist that derived value over the user's real
  // choice, so we diff against what we loaded and send only genuine edits.
  const [baseline, setBaseline] = useState<AppSettings | null>(null);
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [recommended, setRecommended] = useState<Record<string, unknown>[]>([]);
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [preset, setPreset] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [pulling, setPulling] = useState("");

  // Local edits are held in `s` and flushed by Save, so a slow PUT never makes
  // the controls feel laggy.
  const patch = (p: Partial<AppSettings>) => setS((prev) => (prev ? { ...prev, ...p } : prev));

  async function loadAll() {
    try {
      const [settings, m, a] = await Promise.all([
        getSettings(),
        getModels().catch(() => ({ available: [], recommended: [] })),
        getAgents().catch(() => ({ agents: [] })),
      ]);
      setS(settings);
      setBaseline(settings);
      setModels(m.available);
      setRecommended(m.recommended);
      setAgents(a.agents);
    } catch (e) {
      setStatus(`Could not load settings: ${(e as Error).message}`);
    }
  }
  useEffect(() => {
    void loadAll();
  }, []);

  function applyPreset(id: string) {
    setPreset(id);
    const hw = HARDWARE_PRESETS.find((p) => p.id === id);
    if (hw) patch({ local_llm_model: hw.model, local_media_device: hw.device });
  }

  async function save() {
    if (!s || !baseline || busy) return;
    const body: SettingsPatch = {};
    for (const key of EDITABLE) {
      if (s[key] !== baseline[key]) {
        (body as Record<string, unknown>)[key] = s[key];
      }
    }
    // Keys are write-only: send one only when the user typed a fresh value.
    if (apiKey.trim()) {
      (body as Record<string, unknown>)[`${s.llm_provider}_api_key`] = apiKey.trim();
    }
    if (Object.keys(body).length === 0) {
      setStatus("No changes.");
      return;
    }

    setBusy(true);
    setStatus("Saving…");
    try {
      const saved = await saveSettings(body);
      setS(saved);
      setBaseline(saved);
      setApiKey("");
      setStatus("Saved.");
    } catch (e) {
      setStatus(`Save failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function runTest(target: "ollama" | "diffusion" | "music") {
    setBusy(true);
    setStatus(`Testing ${target}…`);
    try {
      const r = await testTarget(target);
      setStatus(`${target}: ${r.success ? "✓" : "✗"} ${r.message || ""}`);
    } catch (e) {
      setStatus(`${target} test failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function runProviderTest() {
    setBusy(true);
    setStatus("Testing provider…");
    try {
      const r = await testLlm();
      setStatus(`Provider: ${r.available ? "✓ reachable" : "✗ unavailable"} ${r.message || ""}`);
    } catch (e) {
      setStatus(`Provider test failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function pull(name: string) {
    if (!name || pulling) return;
    setPulling(name);
    setStatus(`Pulling ${name}… this can take several minutes.`);
    try {
      const r = await pullModel(name);
      setStatus(r.message || (r.success ? `Pulled ${name}.` : `Pull failed.`));
      const m = await getModels();
      setModels(m.available);
    } catch (e) {
      setStatus(`Pull failed: ${(e as Error).message}`);
    } finally {
      setPulling("");
    }
  }

  if (!s) {
    return (
      <div className="lesson">
        <div className="lesson-body">
          <div className="empty">{status || "Loading settings…"}</div>
        </div>
      </div>
    );
  }

  const isCloud = s.llm_provider !== "ollama";
  const presetDesc = HARDWARE_PRESETS.find((p) => p.id === preset)?.desc;

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <strong style={{ flex: 1 }}>Settings</strong>
        <span className="status">{status}</span>
        <button className="send" onClick={() => void save()} disabled={busy}>
          Save
        </button>
      </div>

      <div className="lesson-body">
        <p className="dsub">Manage local models and generation options.</p>

        <section className="set-group">
          <h4>Reasoning provider</h4>
          <label className="set-row">
            <span>Provider</span>
            <select
              value={s.llm_provider}
              onChange={(e) => patch({ llm_provider: e.target.value })}
            >
              {PROVIDERS.map(([id, label]) => (
                <option key={id} value={id}>{label}</option>
              ))}
            </select>
          </label>

          {isCloud && (
            <>
              <label className="set-row">
                <span>Model</span>
                <input
                  value={s.cloud_llm_model ?? ""}
                  onChange={(e) => patch({ cloud_llm_model: e.target.value })}
                  placeholder="e.g. claude-sonnet-5"
                />
              </label>
              <label className="set-row">
                <span>API key</span>
                <input
                  type="password"
                  autoComplete="off"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={s.cloud_keys_set?.[s.llm_provider] ? "•••••• (saved — type to replace)" : "Paste your API key"}
                />
              </label>
            </>
          )}
          <div className="set-actions">
            <button className="btn-ghost" onClick={() => void runProviderTest()} disabled={busy}>
              Test connection
            </button>
          </div>
        </section>

        <section className="set-group">
          <h4>Local model</h4>
          <label className="set-row">
            <span>Hardware preset</span>
            <select value={preset} onChange={(e) => applyPreset(e.target.value)}>
              <option value="">— Select your hardware —</option>
              {HARDWARE_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </label>
          {presetDesc && <p className="set-hint">{presetDesc}</p>}

          <label className="set-row">
            <span>Model</span>
            <select
              value={s.local_llm_model}
              onChange={(e) => patch({ local_llm_model: e.target.value })}
            >
              {/* A preset can name a model that isn't pulled yet — keep it selectable. */}
              {!models.some((m) => m.name === s.local_llm_model) && (
                <option value={s.local_llm_model}>{s.local_llm_model} (not installed)</option>
              )}
              {models.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name} · {m.size_gb.toFixed(1)} GB{m.loaded ? " · loaded" : ""}
                </option>
              ))}
            </select>
          </label>
          {s.effective_llm_model && s.effective_llm_model !== s.local_llm_model && (
            <p className="set-hint">
              Fast mode is running <strong>{s.effective_llm_model}</strong> instead. Your choice
              above is kept and restored when you turn fast mode off.
            </p>
          )}
          <div className="set-actions">
            <button className="btn-ghost" onClick={() => void runTest("ollama")} disabled={busy}>
              Test model
            </button>
            <button className="btn-ghost" onClick={() => void loadAll()} disabled={busy}>
              Refresh
            </button>
            {!models.some((m) => m.name === s.local_llm_model) && (
              <button
                className="btn-ghost"
                onClick={() => void pull(s.local_llm_model)}
                disabled={!!pulling}
              >
                {pulling === s.local_llm_model ? "Pulling…" : `Pull ${s.local_llm_model}`}
              </button>
            )}
          </div>

          {recommended.length > 0 && (
            <details className="set-details">
              <summary>Recommended models ({recommended.length})</summary>
              <ul className="set-reco">
                {recommended.map((r, i) => {
                  const name = String(r.name ?? r.model ?? "");
                  const installed = models.some((m) => m.name === name);
                  return (
                    <li key={i}>
                      <span>
                        <strong>{name}</strong>
                        {r.description ? <em> — {String(r.description)}</em> : null}
                      </span>
                      {installed ? (
                        <span className="set-ok">installed</span>
                      ) : (
                        <button className="link" onClick={() => void pull(name)} disabled={!!pulling}>
                          {pulling === name ? "pulling…" : "pull"}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            </details>
          )}
        </section>

        <section className="set-group">
          <h4>Features</h4>
          {([
            ["local_ai_enabled", "Local AI reasoning", "Route uncurated questions to the local model."],
            ["local_multi_agent_enabled", "Multi-agent pipeline",
              s.fast_mode_enabled && s.effective_multi_agent_enabled === false
                ? "Suspended while fast mode is on; your setting is kept."
                : "Use the JSON-plan planner with visualization codegen."],
            ["local_web_rag_enabled", "Web RAG enrichment", "Pull in web context for long-tail topics."],
            ["fast_mode_enabled", "Fast mode", "Trade some depth for lower latency."],
          ] as [keyof AppSettings, string, string][]).map(([key, label, hint]) => (
            <label key={key} className="set-check">
              <input
                type="checkbox"
                checked={Boolean(s[key])}
                onChange={(e) => patch({ [key]: e.target.checked } as Partial<AppSettings>)}
              />
              <span>
                <strong>{label}</strong>
                <em>{hint}</em>
              </span>
            </label>
          ))}
        </section>

        <section className="set-group">
          <h4>Media generation</h4>
          <label className="set-check">
            <input
              type="checkbox"
              checked={s.local_media_enabled}
              onChange={(e) => patch({ local_media_enabled: e.target.checked })}
            />
            <span>
              <strong>Enable media generation</strong>
              <em>Diffusion images and generated music (needs a GPU for reasonable speed).</em>
            </span>
          </label>

          <label className="set-row">
            <span>Device</span>
            <select
              value={s.local_media_device}
              onChange={(e) => patch({ local_media_device: e.target.value })}
            >
              {["cpu", "mps", "cuda"].map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <label className="set-row">
            <span>Diffusion model</span>
            <input
              value={s.local_diffusion_model}
              onChange={(e) => patch({ local_diffusion_model: e.target.value })}
              placeholder="stabilityai/sdxl-turbo"
            />
          </label>
          <label className="set-row">
            <span>Diffusion timeout (s)</span>
            <input
              type="number"
              min={1}
              value={s.local_diffusion_timeout_seconds}
              onChange={(e) => patch({ local_diffusion_timeout_seconds: +e.target.value })}
            />
          </label>
          <label className="set-row">
            <span>Music model</span>
            <input
              value={s.local_music_model}
              onChange={(e) => patch({ local_music_model: e.target.value })}
              placeholder="facebook/musicgen-small"
            />
          </label>
          <label className="set-row">
            <span>Music timeout (s)</span>
            <input
              type="number"
              min={1}
              value={s.local_music_timeout_seconds}
              onChange={(e) => patch({ local_music_timeout_seconds: +e.target.value })}
            />
          </label>
          <label className="set-check">
            <input
              type="checkbox"
              checked={s.local_music_fast_mode}
              onChange={(e) => patch({ local_music_fast_mode: e.target.checked })}
            />
            <span><strong>Music fast mode</strong><em>Shorter, quicker clips.</em></span>
          </label>
          <div className="set-actions">
            <button className="btn-ghost" onClick={() => void runTest("diffusion")} disabled={busy}>
              Test diffusion
            </button>
            <button className="btn-ghost" onClick={() => void runTest("music")} disabled={busy}>
              Test music
            </button>
          </div>
        </section>

        <section className="set-group">
          <h4>Agents</h4>
          {agents.length === 0 ? (
            <p className="set-hint">No agents reporting.</p>
          ) : (
            <ul className="set-agents">
              {agents.map((a) => (
                <li key={a.id}>
                  <span className={`set-dot set-dot-${a.status}`} aria-hidden="true" />
                  <span className="set-agent-name">{a.name}</span>
                  <span className="set-agent-meta">
                    {a.status}
                    {a.run_count != null ? ` · ${a.run_count} runs` : ""}
                    {a.last_run_ms != null ? ` · ${a.last_run_ms} ms` : ""}
                  </span>
                  {a.last_error && <span className="set-agent-err">{a.last_error}</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
