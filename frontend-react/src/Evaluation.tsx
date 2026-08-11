import { useEffect, useState } from "react";

interface PromptResult {
  prompt: string;
  duration_ms: number;
  has_visualization: boolean;
  checks_pass_rate: number;
  warning_count: number;
  source: string;
  timed_out: boolean;
  error?: string | null;
}

interface Report {
  total_prompts: number;
  avg_duration_ms: number;
  visualization_coverage: number;
  avg_checks_pass_rate: number;
  mode: string;
  run_label?: string | null;
  run_tags: string[];
  timeout_count: number;
  error_count: number;
  latency_histogram: Record<string, number>;
  results: PromptResult[];
}

interface RunSummary {
  id: string;
  mode: string;
  run_label?: string | null;
  run_tags: string[];
  total_prompts: number;
  avg_duration_ms: number;
  visualization_coverage: number;
  avg_checks_pass_rate: number;
  timeout_count: number;
  error_count: number;
  created_at: string;
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/**
 * Native port of the classic #tab-eval panel: run the prompt catalog (cached or
 * live against the model), label/tag the run, browse history, compare two runs,
 * and export.
 */
export default function Evaluation() {
  const [report, setReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<RunSummary[]>([]);
  const [label, setLabel] = useState("");
  const [tags, setTags] = useState("");
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [diff, setDiff] = useState<Record<string, unknown> | null>(null);

  async function loadHistory() {
    try {
      const d = await (await fetch("/api/eval/history?limit=25")).json();
      setHistory(d.runs || []);
    } catch {
      /* history is optional context */
    }
  }
  useEffect(() => {
    void loadHistory();
  }, []);

  async function run() {
    if (busy) return;
    setBusy(true);
    setDiff(null);
    setStatus(live ? "Running live against the model — this can take a while…" : "Running…");
    try {
      const q = new URLSearchParams({
        live: String(live),
        persist: "true",
        run_label: label,
        run_tags: tags,
      });
      const r = await fetch(`/api/eval/report?${q}`);
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setReport(d);
      setStatus(`Done — ${d.total_prompts} prompts.`);
      await loadHistory();
    } catch (e) {
      setStatus(`Run failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function compare() {
    if (!compareA || !compareB) return;
    setBusy(true);
    setStatus("Comparing…");
    try {
      const r = await fetch(
        `/api/eval/compare?run_a_id=${encodeURIComponent(compareA)}&run_b_id=${encodeURIComponent(compareB)}`
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setDiff(d);
      setStatus("");
    } catch (e) {
      setStatus(`Compare failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  const exportUrl = (format: "json" | "csv" | "md") =>
    `/api/eval/report/export?format=${format}&latest=true&run_label=${encodeURIComponent(label)}&run_tags=${encodeURIComponent(tags)}`;

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Run label (optional)"
          style={{ flex: 1 }}
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="tags,comma,separated"
          style={{ flex: "0 1 200px", minWidth: 140 }}
        />
        <label className="set-check set-check-inline">
          <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} />
          <span><strong>Live</strong></span>
        </label>
        <button className="send" onClick={() => void run()} disabled={busy}>
          {busy ? "Running…" : "Run eval"}
        </button>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Run the prompt catalog and track answer latency, visualization coverage, and
          quality-check pass rate. <strong>Live</strong> re-queries the model instead of
          scoring cached answers.
        </p>
        {status && <div className="status" style={{ marginBottom: 12 }}>{status}</div>}

        {report && (
          <>
            <div className="eval-stats">
              {[
                ["Prompts", String(report.total_prompts)],
                ["Avg latency", `${report.avg_duration_ms} ms`],
                ["Viz coverage", pct(report.visualization_coverage)],
                ["Checks passing", pct(report.avg_checks_pass_rate)],
                ["Timeouts", String(report.timeout_count)],
                ["Errors", String(report.error_count)],
              ].map(([k, v]) => (
                <div key={k} className="eval-stat">
                  <span className="eval-stat-v">{v}</span>
                  <span className="eval-stat-k">{k}</span>
                </div>
              ))}
            </div>

            <div className="set-actions" style={{ margin: "12px 0" }}>
              <span className="set-hint" style={{ marginRight: 4 }}>Export:</span>
              {(["json", "csv", "md"] as const).map((f) => (
                <a key={f} className="btn-ghost" href={exportUrl(f)} download>
                  {f.toUpperCase()}
                </a>
              ))}
            </div>

            <h4>Per-prompt results</h4>
            <div className="eval-table-wrap">
              <table className="eval-table">
                <thead>
                  <tr>
                    <th>Prompt</th>
                    <th>Latency</th>
                    <th>Viz</th>
                    <th>Checks</th>
                    <th>Warn</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {report.results.map((r, i) => (
                    <tr key={i} className={r.error || r.timed_out ? "eval-bad" : ""}>
                      <td title={r.prompt}>{r.prompt}</td>
                      <td>{r.timed_out ? "timeout" : `${r.duration_ms} ms`}</td>
                      <td>{r.has_visualization ? "✓" : "—"}</td>
                      <td>{pct(r.checks_pass_rate)}</td>
                      <td>{r.warning_count || "—"}</td>
                      <td>{r.error ? <span className="eval-err">{r.error}</span> : r.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <h4 style={{ marginTop: 20 }}>Run history</h4>
        {history.length === 0 ? (
          <p className="set-hint">No saved runs yet.</p>
        ) : (
          <>
            <div className="eval-table-wrap">
              <table className="eval-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Label</th>
                    <th>Mode</th>
                    <th>Prompts</th>
                    <th>Avg ms</th>
                    <th>Viz</th>
                    <th>Checks</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{new Date(h.created_at).toLocaleString()}</td>
                      <td>{h.run_label || "—"}{h.run_tags.length ? ` [${h.run_tags.join(", ")}]` : ""}</td>
                      <td>{h.mode}</td>
                      <td>{h.total_prompts}</td>
                      <td>{h.avg_duration_ms}</td>
                      <td>{pct(h.visualization_coverage)}</td>
                      <td>{pct(h.avg_checks_pass_rate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="set-actions" style={{ marginTop: 12 }}>
              <select value={compareA} onChange={(e) => setCompareA(e.target.value)}>
                <option value="">Run A…</option>
                {history.map((h) => (
                  <option key={h.id} value={h.id}>{h.run_label || h.id.slice(0, 8)} · {new Date(h.created_at).toLocaleDateString()}</option>
                ))}
              </select>
              <select value={compareB} onChange={(e) => setCompareB(e.target.value)}>
                <option value="">Run B…</option>
                {history.map((h) => (
                  <option key={h.id} value={h.id}>{h.run_label || h.id.slice(0, 8)} · {new Date(h.created_at).toLocaleDateString()}</option>
                ))}
              </select>
              <button className="btn-ghost" onClick={() => void compare()} disabled={busy || !compareA || !compareB}>
                Compare
              </button>
            </div>
            {diff && <pre className="eval-diff">{JSON.stringify(diff, null, 2)}</pre>}
          </>
        )}
      </div>
    </div>
  );
}
