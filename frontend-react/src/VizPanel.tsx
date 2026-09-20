import { useEffect, useState } from "react";
import Visualization from "./Visualization";
import RenderJobs from "./RenderJobs";
import { getSettings } from "./settingsApi";
import {
  generateImage,
  generateMusic,
  pollVizJob,
  visualizeOnDemand,
  vizAgent,
  type VizJob,
  type VizPayload,
} from "./vizApi";

/**
 * The Learn tab's visualization tools, ported from the classic tutor panel:
 * the deterministic planner, the VizAgent (derives a chart from answer text),
 * and optional diffusion image / generated music.
 *
 * Renders are queued server-side, so the planner returns a job id and this
 * polls it — long renders never block the panel.
 */
export default function VizPanel({
  topic,
  answerText,
}: {
  topic: string;
  answerText?: string;
}) {
  const [viz, setViz] = useState<VizPayload | null>(null);
  const [job, setJob] = useState<VizJob | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [media, setMedia] = useState<{ kind: "image" | "music"; url: string } | null>(null);
  // Image/Music need local diffusion + music-gen models, off by default and
  // GPU-bound — showing them as normal buttons when that's disabled just
  // means every click 503s. Hide rather than disable-with-no-explanation.
  const [mediaEnabled, setMediaEnabled] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setMediaEnabled(s.local_media_enabled))
      .catch(() => setMediaEnabled(false));
  }, []);

  const reset = () => {
    setViz(null);
    setJob(null);
    setMedia(null);
  };

  async function renderDiagram() {
    if (!topic.trim() || busy) return;
    setBusy(true);
    reset();
    setStatus("Planning a diagram…");
    try {
      const r = await visualizeOnDemand(topic);
      if (r.visualization) {
        setViz(r.visualization);
        setStatus("");
      } else if (r.visualization_job_id) {
        setStatus("Rendering…");
        const done = await pollVizJob(r.visualization_job_id, setJob);
        setJob(done);
        if (done.visualization) setViz(done.visualization);
        setStatus(done.error ? `Render failed: ${done.error}` : "");
      } else {
        setStatus(r.error || r.message || "Nothing to draw for this topic.");
      }
    } catch (e) {
      setStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function autoVisualize() {
    if (!answerText?.trim() || busy) return;
    setBusy(true);
    reset();
    setStatus("Reading the answer for something to draw…");
    try {
      const r = await vizAgent(topic, answerText);
      if (r.visualization) {
        setViz(r.visualization);
        setStatus(`Built from the answer (${r.source}).`);
      } else {
        setStatus("Nothing in that answer lends itself to a diagram.");
      }
    } catch (e) {
      setStatus(`Failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function makeMedia(kind: "image" | "music") {
    if (!topic.trim() || busy) return;
    setBusy(true);
    reset();
    setStatus(kind === "image" ? "Generating an image…" : "Composing…");
    try {
      const r = kind === "image" ? await generateImage(topic) : await generateMusic(topic);
      setMedia({ kind, url: r.url });
      setStatus(r.model ? `${kind === "image" ? "Image" : "Music"} via ${r.model}.` : "");
    } catch (e) {
      // Media generation is off by default and needs a GPU — say so plainly.
      setStatus(`${kind === "image" ? "Image" : "Music"} generation failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="vizpanel">
      <div className="vizpanel-actions">
        <button className="btn-ghost" onClick={() => void renderDiagram()} disabled={busy || !topic.trim()}>
          Render diagram
        </button>
        <button
          className="btn-ghost"
          onClick={() => void autoVisualize()}
          disabled={busy || !answerText?.trim()}
          title={answerText?.trim() ? "" : "Ask something first — this draws from the answer"}
        >
          Auto-visualize
        </button>
        {mediaEnabled && (
          <button className="btn-ghost" onClick={() => void makeMedia("image")} disabled={busy || !topic.trim()}>
            Image
          </button>
        )}
        {mediaEnabled && (
          <button className="btn-ghost" onClick={() => void makeMedia("music")} disabled={busy || !topic.trim()}>
            Music
          </button>
        )}
        {status && <span className="status">{status}</span>}
      </div>

      {job && job.status !== "completed" && !viz && (
        <div className="viz-progress">
          <div className="viz-progress-bar" style={{ width: `${Math.max(6, job.progress)}%` }} />
          <span className="viz-progress-label">{job.status} · {job.progress}%</span>
        </div>
      )}

      {viz && <Visualization viz={viz} />}

      {media?.kind === "image" && (
        <figure className="viz">
          <figcaption className="viz-title">Generated image</figcaption>
          <img className="viz-img" src={media.url} alt={topic} />
        </figure>
      )}
      {media?.kind === "music" && (
        <figure className="viz">
          <figcaption className="viz-title">Generated music</figcaption>
          <audio className="viz-audio" src={media.url} controls />
        </figure>
      )}

      <RenderJobs />
    </section>
  );
}
