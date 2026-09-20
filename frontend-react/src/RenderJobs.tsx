import { useEffect, useState } from "react";
import { deleteAnimation, listAnimationJobs } from "./animateApi";
import { listVizJobs } from "./vizApi";

interface Job {
  id: string;
  kind: "animation" | "diagram";
  status: string;
  progress: number;
  label: string;
  url?: string | null;
  error?: string | null;
}

const STATUS_CLASS: Record<string, string> = {
  completed: "rj-ok",
  error: "rj-bad",
  failed: "rj-bad",
  rendering: "rj-busy",
  running: "rj-busy",
  pending: "rj-wait",
  queued: "rj-wait",
};

/**
 * The classic panel's "Render Jobs" list: animation and diagram renders in one
 * place, newest first, so a queued render is visible after you navigate away
 * from the panel that started it.
 */
export default function RenderJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("");

  async function load() {
    try {
      const [anim, diag] = await Promise.all([
        listAnimationJobs(12).catch(() => ({ jobs: [] })),
        listVizJobs(12).catch(() => ({ jobs: [] })),
      ]);
      const merged: Job[] = [
        ...anim.jobs.map((j) => ({
          id: j.id,
          kind: "animation" as const,
          status: j.status,
          progress: j.progress ?? 0,
          label: j.scene_name || j.id,
          url: j.url,
          error: j.error,
        })),
        ...diag.jobs.map((j) => ({
          id: j.id,
          kind: "diagram" as const,
          status: j.status,
          progress: j.progress ?? 0,
          label: j.question || j.visualization?.title || j.id,
          url: null,
          error: j.error,
        })),
      ].slice(0, 20);
      setJobs(merged);
      setStatus(merged.length ? "" : "No renders yet.");
    } catch (e) {
      setStatus(`Could not load jobs: ${(e as Error).message}`);
    }
  }

  // Refresh while open so in-flight renders tick along; stop when closed.
  useEffect(() => {
    if (!open) return;
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [open]);

  async function remove(id: string) {
    await deleteAnimation(id).catch(() => undefined);
    await load();
  }

  return (
    <details className="rj" open={open} onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary>Render jobs{jobs.length ? ` (${jobs.length})` : ""}</summary>
      {status && <div className="set-hint" style={{ margin: "8px 0 0" }}>{status}</div>}
      <ul className="rj-list">
        {jobs.map((j) => (
          <li key={`${j.kind}-${j.id}`} className="rj-item">
            <span className={`rj-dot ${STATUS_CLASS[j.status] || ""}`} aria-hidden="true" />
            <span className="rj-kind">{j.kind === "animation" ? "🎬" : "📊"}</span>
            <span className="rj-label" title={j.label}>{j.label}</span>
            <span className="rj-status">
              {j.status}
              {j.status === "rendering" || j.status === "running" ? ` ${j.progress}%` : ""}
            </span>
            {j.url && (
              <a className="link" href={j.url} target="_blank" rel="noreferrer noopener">open</a>
            )}
            {j.kind === "animation" && (
              <button className="link" onClick={() => void remove(j.id)}>delete</button>
            )}
            {j.error && <span className="rj-err">{j.error}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}
