// The high-level progress view for Math Quest — a "case board" / "treasure
// map" over the concept prerequisite DAG. Unlike ConceptGraph.tsx (undirected,
// d3-force physics), positions here are DETERMINISTIC: level -> row,
// index-within-level -> column, sent by the server. Only pan/zoom is
// interactive (no drag — dragging would fight a layout that must stay legible
// as a "path"), reusing ConceptGraph.tsx's pointer-event pan/zoom pattern.
import { useMemo, useRef, useState } from "react";
import type { QuestEdge, QuestGraph, QuestNode } from "./questApi";
import { isUnlocked } from "./questProgress";

const WIDTH = 1200;
const ROW_HEIGHT = 160;
const TOP_PAD = 70;
const NODE_R = 16;

const CATEGORY_COLORS: Record<string, string> = {
  foundations: "#78716c",
  arithmetic: "#4e79a7",
  number_theory: "#59a14f",
  algebra: "#f28e2b",
  geometry: "#e15759",
  trigonometry: "#b07aa1",
  calculus: "#76b7b2",
  probability: "#edc948",
  linear_algebra: "#ff9da7",
  discrete_math: "#9c755f",
  signal_processing: "#bab0ac",
  music_and_math: "#af7aa1",
  ml_mathematics: "#c2410c",
  advanced: "#1c1917",
  applied: "#2563eb",
};

function categoryColor(cat: string): string {
  return CATEGORY_COLORS[cat] ?? "#78716c";
}

interface Positioned extends QuestNode {
  px: number;
  py: number;
}

export default function QuestMap({
  graph,
  completed,
  currentSlug,
  onSelect,
}: {
  graph: QuestGraph;
  completed: Set<string>;
  currentSlug: string | null;
  onSelect: (node: QuestNode) => void;
}) {
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });
  const [hover, setHover] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  const byLevelCount = useMemo(() => {
    const counts = new Map<number, number>();
    for (const n of graph.nodes) counts.set(n.level, (counts.get(n.level) ?? 0) + 1);
    return counts;
  }, [graph.nodes]);

  const positioned = useMemo<Map<string, Positioned>>(() => {
    const m = new Map<string, Positioned>();
    for (const n of graph.nodes) {
      const count = byLevelCount.get(n.level) ?? 1;
      const px = ((n.x + 0.5) / count) * WIDTH;
      const py = TOP_PAD + n.level * ROW_HEIGHT;
      m.set(n.slug, { ...n, px, py });
    }
    return m;
  }, [graph.nodes, byLevelCount]);

  const height = TOP_PAD + (Math.max(...graph.nodes.map((n) => n.level), 0) + 1) * ROW_HEIGHT;

  const solvedCount = completed.size;
  const total = graph.nodes.length;

  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    setView((v) => ({ ...v, k: Math.min(3, Math.max(0.4, v.k * (e.deltaY < 0 ? 1.12 : 0.89))) }));
  }
  function bgDown(e: React.PointerEvent<SVGSVGElement>) {
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  }
  function svgMove(e: React.PointerEvent<SVGSVGElement>) {
    const pan = panRef.current;
    if (!pan) return;
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return;
    setView((v) => ({
      ...v,
      x: pan.vx + ((e.clientX - pan.x) / r.width) * WIDTH / v.k,
      y: pan.vy + ((e.clientY - pan.y) / r.height) * height / v.k,
    }));
  }
  function svgUp() {
    panRef.current = null;
  }

  return (
    <div className="qst-map-wrap">
      <div className="qst-map-bar">
        <span className="qst-progress-label">
          {solvedCount} / {total} solved
        </span>
        <div className="viz-progress" style={{ width: 160 }}>
          <div
            className="viz-progress-bar"
            style={{ width: `${total ? (solvedCount / total) * 100 : 0}%` }}
          />
        </div>
        <button className="btn-ghost" onClick={() => setView({ k: 1, x: 0, y: 0 })}>
          Reset view
        </button>
      </div>

      <svg
        ref={svgRef}
        className="qst-svg"
        viewBox={`0 0 ${WIDTH} ${height}`}
        onWheel={onWheel}
        onPointerDown={bgDown}
        onPointerMove={svgMove}
        onPointerUp={svgUp}
        onPointerLeave={svgUp}
      >
        <defs>
          <marker
            id="qst-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#d6d3d1" />
          </marker>
        </defs>
        <g transform={`scale(${view.k}) translate(${view.x},${view.y})`}>
          <g>
            {graph.edges.map((e: QuestEdge, i: number) => {
              const s = positioned.get(e.source);
              const t = positioned.get(e.target);
              if (!s || !t) return null;
              return (
                <line
                  key={i}
                  x1={s.px}
                  y1={s.py + NODE_R}
                  x2={t.px}
                  y2={t.py - NODE_R - 4}
                  stroke="#d6d3d1"
                  strokeWidth={1.5}
                  markerEnd="url(#qst-arrow)"
                />
              );
            })}
          </g>
          {[...positioned.values()].map((n) => {
            const done = completed.has(n.slug);
            const unlocked = done || isUnlocked(n, completed);
            const isCurrent = n.slug === currentSlug;
            return (
              <g
                key={n.slug}
                transform={`translate(${n.px},${n.py})`}
                style={{ cursor: unlocked ? "pointer" : "default" }}
                opacity={unlocked ? 1 : 0.45}
                onClick={() => unlocked && onSelect(n)}
                onMouseEnter={() => setHover(n.slug)}
                onMouseLeave={() => setHover(null)}
              >
                <title>
                  {unlocked
                    ? n.name
                    : `${n.name} — locked (finish its prerequisites first)`}
                </title>
                <circle
                  r={NODE_R}
                  fill={unlocked ? categoryColor(n.category) : "#d6d3d1"}
                  stroke={done ? "#d9a62e" : "#fff"}
                  strokeWidth={done ? 3.5 : 1.5}
                  className={isCurrent ? "qst-node-current" : undefined}
                />
                {!unlocked && (
                  <text textAnchor="middle" dy={4} fontSize={12} style={{ pointerEvents: "none" }}>
                    🔒
                  </text>
                )}
                {done && (
                  <text
                    textAnchor="middle"
                    dy={4}
                    fontSize={12}
                    fill="#fff"
                    style={{ pointerEvents: "none" }}
                  >
                    ✓
                  </text>
                )}
                <text
                  x={0}
                  y={NODE_R + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#44403c"
                  fontWeight={hover === n.slug ? 700 : 400}
                  style={{ pointerEvents: "none" }}
                >
                  {n.name}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
