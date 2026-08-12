import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface ApiNode {
  id: string;
  name: string;
  degree: number;
  viz?: string | null;
  source?: string | null;
}

interface SimNode extends ApiNode {
  x: number;
  y: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimLink {
  source: SimNode | string;
  target: SimNode | string;
}

const WIDTH = 1000;
const HEIGHT = 680;
/** Right-hand margin left free so node labels are not clipped at the edge. */
const LABEL_ROOM = 150;

// Tableau10, matching the classic explorer's palette.
const PALETTE = [
  "#4e79a7", "#f28e2b", "#e15759", "#76b7b2", "#59a14f",
  "#edc948", "#b07aa1", "#ff9da7", "#9c755f", "#bab0ac",
];

const idOf = (x: SimNode | string) => (typeof x === "string" ? x : x.id);
const radius = (d: ApiNode) => 5 + Math.min(d.degree, 12);

/**
 * Force-directed concept-graph explorer.
 *
 * d3-force runs the simulation; React owns the DOM. That split avoids pulling in
 * d3-selection and keeps the SVG declarative — the simulation writes x/y onto
 * the node objects and a tick counter re-renders.
 *
 * Concepts that have a Cogito Gallery visualization get a gold ring and open it
 * on click; the rest hand the concept to the tutor.
 */
export default function ConceptGraph({ onAsk }: { onAsk: (question: string) => void }) {
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [links, setLinks] = useState<SimLink[]>([]);
  const [status, setStatus] = useState("Loading the concept graph…");
  const [query, setQuery] = useState("");
  const [hover, setHover] = useState<string | null>(null);
  const [picked, setPicked] = useState<SimNode | null>(null);
  const [view, setView] = useState({ k: 1, x: 0, y: 0 });

  // Bumped on every simulation tick to pull fresh x/y into the render.
  const [, setTick] = useState(0);
  const simRef = useRef<{ stop: () => void; alphaTarget: (n: number) => { restart: () => void } } | null>(null);
  const dragRef = useRef<{ node: SimNode | null; moved: boolean }>({ node: null, moved: false });
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let stopped = false;
    void (async () => {
      let data: { nodes: ApiNode[]; edges: { source: string; target: string }[] };
      try {
        const r = await fetch("/api/graph");
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        data = await r.json();
      } catch (e) {
        setStatus(`Concept graph unavailable: ${(e as Error).message}`);
        return;
      }
      if (stopped) return;

      const simNodes: SimNode[] = data.nodes.map((n) => ({
        ...n,
        x: WIDTH / 2 + (Math.random() - 0.5) * 200,
        y: HEIGHT / 2 + (Math.random() - 0.5) * 200,
      }));
      const simLinks: SimLink[] = data.edges.map((e) => ({ source: e.source, target: e.target }));

      const d3 = await import("d3-force");
      if (stopped) return;
      const sim = d3
        .forceSimulation(simNodes)
        .force("link", d3.forceLink<SimNode, SimLink>(simLinks).id((d) => d.id).distance(60).strength(0.25))
        .force("charge", d3.forceManyBody().strength(-140))
        .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
        .force("collide", d3.forceCollide(20))
        .on("tick", () => {
          // Keep everything inside the viewBox. Without this the outermost
          // concepts drift past the edge and their labels get clipped, which is
          // what the classic explorer did. Extra room on the right for labels.
          for (const n of simNodes) {
            const r = radius(n);
            n.x = Math.max(r, Math.min(WIDTH - r - LABEL_ROOM, n.x));
            n.y = Math.max(r + 6, Math.min(HEIGHT - r - 6, n.y));
          }
          setTick((t) => t + 1);
        });

      simRef.current = sim as unknown as typeof simRef.current;
      setNodes(simNodes);
      setLinks(simLinks);
      setStatus("");
    })();
    return () => {
      stopped = true;
      simRef.current?.stop();
    };
  }, []);

  // Adjacency for hover highlighting.
  const adjacency = useMemo(() => {
    const m = new Map<string, Set<string>>();
    nodes.forEach((n) => m.set(n.id, new Set()));
    links.forEach((l) => {
      m.get(idOf(l.source))?.add(idOf(l.target));
      m.get(idOf(l.target))?.add(idOf(l.source));
    });
    return m;
  }, [nodes, links]);

  const q = query.trim().toLowerCase();
  const dim = useCallback(
    (n: SimNode) => {
      if (q) return n.name.toLowerCase().includes(q) ? 1 : 0.1;
      if (!hover) return 1;
      return n.id === hover || adjacency.get(hover)?.has(n.id) ? 1 : 0.12;
    },
    [q, hover, adjacency]
  );

  // --- pan / zoom -----------------------------------------------------------
  function onWheel(e: React.WheelEvent<SVGSVGElement>) {
    e.preventDefault();
    setView((v) => {
      const k = Math.min(4, Math.max(0.2, v.k * (e.deltaY < 0 ? 1.12 : 0.89)));
      return { ...v, k };
    });
  }

  // --- node drag ------------------------------------------------------------
  const toSvg = (e: React.PointerEvent): [number, number] => {
    const r = svgRef.current?.getBoundingClientRect();
    if (!r) return [0, 0];
    return [
      ((e.clientX - r.left) / r.width) * WIDTH / view.k - view.x,
      ((e.clientY - r.top) / r.height) * HEIGHT / view.k - view.y,
    ];
  };

  const panRef = useRef<{ x: number; y: number; vx: number; vy: number } | null>(null);

  function bgDown(e: React.PointerEvent<SVGSVGElement>) {
    if (dragRef.current.node) return;
    panRef.current = { x: e.clientX, y: e.clientY, vx: view.x, vy: view.y };
  }

  function nodeDown(e: React.PointerEvent, n: SimNode) {
    e.stopPropagation();
    dragRef.current = { node: n, moved: false };
    const [x, y] = toSvg(e);
    n.fx = x;
    n.fy = y;
    simRef.current?.alphaTarget(0.3).restart();
  }
  function svgMove(e: React.PointerEvent) {
    const pan = panRef.current;
    if (pan && !dragRef.current.node) {
      const r = svgRef.current?.getBoundingClientRect();
      if (!r) return;
      // Convert screen delta into viewBox units, undoing the current zoom.
      setView((v) => ({
        ...v,
        x: pan.vx + ((e.clientX - pan.x) / r.width) * WIDTH / v.k,
        y: pan.vy + ((e.clientY - pan.y) / r.height) * HEIGHT / v.k,
      }));
      return;
    }
    const d = dragRef.current.node;
    if (!d) return;
    dragRef.current.moved = true;
    const [x, y] = toSvg(e);
    d.fx = x;
    d.fy = y;
  }
  function svgUp() {
    panRef.current = null;
    const { node, moved } = dragRef.current;
    if (node) {
      node.fx = null;
      node.fy = null;
      simRef.current?.alphaTarget(0);
      // A drag should not also count as a click on the node.
      if (!moved) activate(node);
    }
    dragRef.current = { node: null, moved: false };
  }

  function activate(n: SimNode) {
    setPicked(n);
    if (n.viz) window.open(n.viz, "_blank", "noopener");
  }

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a concept…"
        />
        <button className="btn-ghost" onClick={() => setView({ k: 1, x: 0, y: 0 })}>
          Reset view
        </button>
        <span className="status">
          {status || `${nodes.length} concepts · ${links.length} links`}
        </span>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Every curated concept and how they connect. Drag to rearrange, scroll to zoom, hover to
          isolate a neighbourhood. Gold rings have an interactive visualization.
        </p>

        <svg
          ref={svgRef}
          className="cg-svg"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          onWheel={onWheel}
          onPointerDown={bgDown}
          onPointerMove={svgMove}
          onPointerUp={svgUp}
          onPointerLeave={svgUp}
        >
          <g transform={`scale(${view.k}) translate(${view.x},${view.y})`}>
            <g stroke="#cbd5e1">
              {links.map((l, i) => {
                const s = l.source as SimNode;
                const t = l.target as SimNode;
                if (typeof s === "string" || typeof t === "string") return null;
                const lit = hover && (s.id === hover || t.id === hover);
                return (
                  <line
                    key={i}
                    x1={s.x}
                    y1={s.y}
                    x2={t.x}
                    y2={t.y}
                    strokeOpacity={hover ? (lit ? 0.9 : 0.04) : 0.6}
                  />
                );
              })}
            </g>
            {nodes.map((n, i) => (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                opacity={dim(n)}
                style={{ cursor: "pointer" }}
                onPointerDown={(e) => nodeDown(e, n)}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
              >
                <title>
                  {n.viz
                    ? `${n.name} · ${n.degree} links · ▶ opens an interactive visualization`
                    : `${n.name} · ${n.degree} links`}
                </title>
                <circle
                  r={radius(n)}
                  fill={PALETTE[(n.degree + i) % PALETTE.length]}
                  stroke={n.viz ? "#d9a62e" : "#fff"}
                  strokeWidth={n.viz ? 2.5 : 1.5}
                />
                <text
                  x={radius(n) + 3}
                  y={4}
                  fontSize={10}
                  fill="#334155"
                  style={{ pointerEvents: "none" }}
                >
                  {n.viz ? `▶ ${n.name}` : n.name}
                </text>
              </g>
            ))}
          </g>
        </svg>

        {picked && (
          <div className="cg-detail">
            <h4>{picked.name}</h4>
            <p className="set-hint" style={{ margin: "2px 0 10px" }}>
              {picked.degree} connection{picked.degree === 1 ? "" : "s"}
              {picked.source ? ` · from ${picked.source}` : ""}
            </p>
            <div className="set-actions">
              <button className="send" onClick={() => onAsk(`Explain ${picked.name}`)}>
                Learn this
              </button>
              {picked.viz && (
                <a className="btn-ghost" href={picked.viz} target="_blank" rel="noreferrer noopener">
                  Open visualization ↗
                </a>
              )}
              <button className="link" onClick={() => setPicked(null)}>close</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
