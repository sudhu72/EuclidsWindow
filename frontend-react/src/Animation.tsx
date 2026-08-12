import { useState } from "react";
import {
  animate,
  pollAnimation,
  queueAnimation,
  type AnimationJob,
  type ManimViz,
} from "./animateApi";

/**
 * On-demand Manim animation for a topic.
 *
 * Queues the render and polls it, so a slow clip reports progress instead of
 * holding a request open for minutes. If the backend declines to queue one
 * (no animation id came back), it falls back to the synchronous pipeline,
 * which always produces something.
 */
export default function Animation({ topic }: { topic: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [viz, setViz] = useState<ManimViz | null>(null);
  const [job, setJob] = useState<AnimationJob | null>(null);
  const [err, setErr] = useState("");

  async function run() {
    setState("loading");
    setErr("");
    setJob(null);
    setViz(null);
    try {
      const id = await queueAnimation(topic);
      if (id) {
        const done = await pollAnimation(id, setJob);
        if (done.status === "completed" && done.url) {
          setViz({
            viz_type: "manim",
            title: done.scene_name || topic,
            data: { url: done.url, format: done.format || "gif" },
          });
          setState("done");
          return;
        }
        if (done.error) throw new Error(done.error);
      }
      // Nothing queued — render inline instead.
      const v = await animate(topic);
      if (!v) throw new Error("No animation could be produced.");
      setViz(v);
      setState("done");
    } catch (e) {
      setState("error");
      setErr((e as Error).message);
    }
  }

  const url = viz?.data?.url;

  return (
    <div className="anim">
      {state !== "done" && (
        <button className="btn anim-btn" onClick={() => void run()} disabled={state === "loading"}>
          {state === "loading" ? "🎬 Rendering animation…" : "🎬 Animate this"}
        </button>
      )}

      {state === "loading" && job && (
        <div className="viz-progress">
          <div className="viz-progress-bar" style={{ width: `${Math.max(6, job.progress)}%` }} />
          <span className="viz-progress-label">{job.status} · {job.progress}%</span>
        </div>
      )}

      {state === "error" && <div className="anim-err">Animation failed: {err}</div>}

      {state === "done" && url && (
        <div className="anim-media">
          {viz?.data?.format === "gif" ? (
            <img src={url} alt={viz?.title || "animation"} />
          ) : (
            <video src={url} controls autoPlay loop muted />
          )}
          <button className="link" onClick={() => setState("idle")}>
            re-render
          </button>
        </div>
      )}
    </div>
  );
}
