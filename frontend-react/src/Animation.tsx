import { useState } from "react";
import { animate, type ManimViz } from "./animateApi";

/** On-demand Manim animation panel — a button that renders a clip for a topic. */
export default function Animation({ topic }: { topic: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [viz, setViz] = useState<ManimViz | null>(null);
  const [err, setErr] = useState("");

  async function run() {
    setState("loading");
    setErr("");
    try {
      const v = await animate(topic);
      if (v) {
        setViz(v);
        setState("done");
      } else {
        setState("error");
        setErr("No animation could be produced.");
      }
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
