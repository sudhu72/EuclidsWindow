import { useEffect, useRef, useState } from "react";

/**
 * Thin Plotly wrapper. The library is dynamically imported so it stays in its
 * own chunk (it is also used by the Learn tab's visualizations), and the plot is
 * purged on unmount — Plotly attaches listeners and a WebGL context that
 * otherwise outlive the component.
 */
export default function Plot({
  data,
  layout,
  className,
  height = 340,
  ariaLabel,
}: {
  data: unknown[];
  layout?: Record<string, unknown>;
  className?: string;
  height?: number;
  ariaLabel?: string;
}) {
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
        await Plotly.react(ref.current, data as Plotly.Data[], buildLayout(layout, height), {
          responsive: true,
          staticPlot: true,
          displayModeBar: false,
        });
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, layout, height]);

  // Separate effect so the purge runs only when the component actually goes away.
  useEffect(() => {
    const node = ref.current;
    return () => {
      if (node) void import("plotly.js-dist-min").then(({ default: P }) => P.purge(node));
    };
  }, []);

  if (error) return <div className="viz-empty">Chart could not be drawn: {error}</div>;
  return <div ref={ref} className={className} style={{ height }} role="img" aria-label={ariaLabel} />;
}

const AXIS = { gridcolor: "#e7e5e4", zerolinecolor: "#a8a29e" };

/** House plot styling: transparent, tight margins, the app's serif. */
export function buildLayout(
  overrides: Record<string, unknown> = {},
  height?: number
): Record<string, unknown> {
  const { xaxis = {}, yaxis = {}, ...rest } = overrides as {
    xaxis?: object;
    yaxis?: object;
  };
  return {
    margin: { t: 10, r: 10, b: 42, l: 52 },
    paper_bgcolor: "transparent",
    plot_bgcolor: "transparent",
    font: { family: "Georgia, serif", color: "#1c1917", size: 12 },
    ...(height ? { height } : {}),
    ...rest,
    xaxis: { ...AXIS, ...xaxis },
    yaxis: { ...AXIS, ...yaxis },
  };
}
