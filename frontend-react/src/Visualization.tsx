import { useEffect, useRef, useState } from "react";
import type { VizPayload } from "./vizApi";

/**
 * Renders a VisualizationPayload — the four shapes the backend emits.
 *
 * Plotly and Mermaid are heavy, so both are `import()`ed on first use: Vite
 * splits them into their own chunks and the app only pays for them when a
 * visualization actually appears.
 */
export default function Visualization({ viz }: { viz: VizPayload }) {
  return (
    <figure className="viz">
      <figcaption className="viz-title">{viz.title}</figcaption>
      <VizBody viz={viz} />
    </figure>
  );
}

function VizBody({ viz }: { viz: VizPayload }) {
  switch (viz.viz_type) {
    case "svg":
      return <ImageViz url={String(viz.data.url || "")} alt={viz.title} />;
    case "manim":
      return <ManimViz viz={viz} />;
    case "plotly":
      return <PlotlyViz viz={viz} />;
    case "mermaid":
      return <MermaidViz code={String(viz.data.mermaid_code || "")} />;
    default:
      return <div className="viz-empty">Unsupported visualization type.</div>;
  }
}

const absolute = (url: string) => (url.startsWith("http") ? url : url);

function ImageViz({ url, alt }: { url: string; alt: string }) {
  if (!url) return <div className="viz-empty">No image data.</div>;
  return <img className="viz-img" src={absolute(url)} alt={alt} />;
}

function ManimViz({ viz }: { viz: VizPayload }) {
  const url = String(viz.data.url || "");
  if (!url) return <div className="viz-empty">No animation data.</div>;
  if (viz.data.format === "gif") return <ImageViz url={url} alt={viz.title} />;
  return (
    <video className="viz-img" src={absolute(url)} controls loop muted playsInline>
      Your browser cannot play this animation.
    </video>
  );
}

function PlotlyViz({ viz }: { viz: VizPayload }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    const node = ref.current;
    if (!node) return;
    void (async () => {
      try {
        const Plotly = (await import("plotly.js-dist-min")).default;
        if (cancelled || !ref.current) return;
        const layout = { ...((viz.data.layout as Record<string, unknown>) || {}) };
        // The default template is enormous and the backend never means to send it.
        delete (layout as { template?: unknown }).template;
        await Plotly.newPlot(
          ref.current,
          viz.data.data as Plotly.Data[],
          layout,
          { displayModeBar: false, responsive: true }
        );
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
      if (node) {
        void import("plotly.js-dist-min").then(({ default: Plotly }) => Plotly.purge(node));
      }
    };
  }, [viz]);

  if (error) return <div className="viz-empty">Chart could not be rendered: {error}</div>;
  return <div className="viz-plot" ref={ref} />;
}

function MermaidViz({ code }: { code: string }) {
  const [svg, setSvg] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!code) return;
    void (async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "neutral",
          securityLevel: "strict",
          // Without this, a parse failure paints an error block at the page bottom.
          suppressErrorRendering: true,
        });
        const id = `mmd-${Math.random().toString(36).slice(2, 10)}`;
        const { svg: out } = await mermaid.render(id, code);
        if (!cancelled) setSvg(out);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (!code) return <div className="viz-empty">No diagram data.</div>;
  // Fall back to the source, which is still readable, rather than nothing.
  if (failed) return <pre className="viz-code">{code}</pre>;
  if (!svg) return <div className="viz-empty">Drawing diagram…</div>;
  // Mermaid output is generated from backend-authored diagram source and
  // rendered with securityLevel "strict", which strips scripts and inline events.
  return <div className="viz-mermaid" dangerouslySetInnerHTML={{ __html: svg }} />;
}
