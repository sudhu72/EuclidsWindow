// On-demand Manim animation. The backend pipeline (template -> LLM -> guaranteed
// generic fallback) always returns a rendered clip, so this reliably yields a
// visual for any topic.

export interface ManimViz {
  viz_type: string;
  title?: string;
  data: { url?: string; format?: string };
}

export async function animate(topic: string): Promise<ManimViz | null> {
  const resp = await fetch("/api/ai/animate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question: topic, quality: "low", output_format: "gif" }),
  });
  if (!resp.ok) {
    const detail = (await resp.json().catch(() => ({}))).message;
    throw new Error(detail || `HTTP ${resp.status}`);
  }
  const d = await resp.json();
  const viz = d.visualization as ManimViz | null;
  return viz && viz.data?.url ? viz : null;
}
