import { useEffect, useMemo, useRef, useState } from "react";
import Markdown from "./Markdown";
import Plot, { buildLayout } from "./Plot";
import {
  DE_MODELS,
  FUNCTIONS,
  MISSIONS,
  OPT_PROBLEMS,
  RIEMANN_FUNCTIONS,
  circlePoints,
  hohmann,
  linspace,
  projectile,
  riemann,
  transferEllipse,
  type RiemannMethod,
} from "./calculus";
import { COPY, LEVELS, type Level } from "./calculusData";

type Game = "slope" | "riemann" | "optimize" | "diffeq" | "projectile" | "orbital";

const GAMES: [Game, string][] = [
  ["slope", "Slope Explorer"],
  ["riemann", "Riemann Sums"],
  ["optimize", "Optimization"],
  ["diffeq", "Differential Equations"],
  ["projectile", "Projectile"],
  ["orbital", "Orbital Mechanics"],
];

const INK = "#1c1917";
const RED = "#b91c1c";
const BLUE = "#2563eb";
const GREEN = "#16a34a";

function GameShell({
  game,
  onAsk,
  children,
}: {
  game: Game;
  onAsk: (q: string) => void;
  children: React.ReactNode;
}) {
  const copy = COPY[game];
  const [level, setLevel] = useState<Level>("kids");
  if (!copy) return <>{children}</>;
  return (
    <>
      <h3 className="lesson-title">{copy.title}</h3>
      <p className="dsub">{copy.subtitle}</p>
      {children}
      <div className="lg-levels">
        <div className="chips">
          {LEVELS.map((l) => (
            <button key={l} className={`chip ${level === l ? "active" : ""}`} onClick={() => setLevel(l)}>
              {l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
          {copy.prompt && (
            <button className="link" style={{ marginLeft: "auto" }} onClick={() => onAsk(copy.prompt)}>
              Explore this in Learn →
            </button>
          )}
        </div>
        <div className="lg-level-body"><Markdown>{copy.levels[level] || ""}</Markdown></div>
      </div>
    </>
  );
}

function Slider({
  label, value, min, max, step, onChange, format,
}: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; format?: (v: number) => string;
}) {
  return (
    <label className="cal-slider">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={(e) => onChange(Number(e.target.value))} />
      <output>{format ? format(value) : value}</output>
    </label>
  );
}

function SlopeGame() {
  const [key, setKey] = useState("x2");
  const [a, setA] = useState(1);
  const [h, setH] = useState(1);
  const [showSecant, setShowSecant] = useState(true);
  const fn = FUNCTIONS[key];

  // ln(x) is only defined for x > 0, so the point has to stay in its domain.
  const [xMin, xMax] = fn.range;
  const aClamped = Math.min(Math.max(a, xMin + 0.05), xMax - 0.05);

  const { data, fa, slope, secSlope } = useMemo(() => {
    const xs = linspace(xMin, xMax, 240);
    const fa = fn.f(aClamped);
    const slope = fn.fp(aClamped);
    const tangX = [aClamped - 1.5, aClamped + 1.5];
    const traces: unknown[] = [
      { x: xs, y: xs.map(fn.f), mode: "lines", line: { color: INK, width: 2 }, name: fn.label },
      {
        x: tangX, y: tangX.map((x) => fa + slope * (x - aClamped)), mode: "lines",
        line: { color: RED, width: 2, dash: "dash" }, name: `tangent (slope ${slope.toFixed(3)})`,
      },
      { x: [aClamped], y: [fa], mode: "markers", marker: { color: RED, size: 10 }, name: "point" },
    ];
    const b = aClamped + h;
    const secSlope = (fn.f(b) - fa) / h;
    if (showSecant) {
      const secX = [aClamped - 0.5, b + 0.5];
      traces.push(
        {
          x: secX, y: secX.map((x) => fa + secSlope * (x - aClamped)), mode: "lines",
          line: { color: "#4338ca", width: 1.5, dash: "dot" }, name: `secant (Δy/Δx ${secSlope.toFixed(3)})`,
        },
        { x: [b], y: [fn.f(b)], mode: "markers", marker: { color: "#4338ca", size: 8 }, name: "x+h" }
      );
    }
    return { data: traces, fa, slope, secSlope };
  }, [fn, aClamped, h, showSecant, xMin, xMax]);

  return (
    <div className="cal-game">
      <div className="cal-controls">
        <label className="cal-select">
          <span>f(x)</span>
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {Object.entries(FUNCTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <Slider label="x" value={aClamped} min={xMin} max={xMax} step={0.05} onChange={setA}
                format={(v) => v.toFixed(2)} />
        <Slider label="h" value={h} min={0.05} max={2} step={0.05} onChange={setH}
                format={(v) => v.toFixed(2)} />
        <label className="set-check set-check-inline">
          <input type="checkbox" checked={showSecant} onChange={(e) => setShowSecant(e.target.checked)} />
          <span><strong>Show secant</strong></span>
        </label>
      </div>

      <Plot data={data} layout={buildLayout({ showlegend: true, legend: { x: 0, y: 1 } })}
            ariaLabel="Function with tangent and secant lines" />

      <div className="cal-readout">
        f({aClamped.toFixed(2)}) = <strong>{fa.toFixed(4)}</strong> · tangent slope f′({aClamped.toFixed(2)}) ={" "}
        <strong>{slope.toFixed(4)}</strong>
        {showSecant && (
          <> · secant slope = <strong>{secSlope.toFixed(4)}</strong> (h = {h.toFixed(2)}, gap{" "}
            {Math.abs(secSlope - slope).toFixed(4)})</>
        )}
      </div>
    </div>
  );
}

function RiemannGame() {
  const [key, setKey] = useState("x2");
  const [n, setN] = useState(8);
  const [method, setMethod] = useState<RiemannMethod>("left");
  const [a, setA] = useState(0);
  const [b, setB] = useState(2);
  const fn = RIEMANN_FUNCTIONS[key];

  const result = useMemo(() => riemann(fn, a, b, Math.max(1, n), method), [fn, a, b, n, method]);
  const data = useMemo(() => {
    const xs = linspace(a - 0.5, b + 0.5, 300);
    return [{ x: xs, y: xs.map(fn.f), mode: "lines", line: { color: INK, width: 2.5 }, name: fn.label }];
  }, [fn, a, b]);
  const layout = useMemo(
    () =>
      buildLayout({
        showlegend: false,
        shapes: result.bars.map((r) => ({
          type: "rect", x0: r.x0, x1: r.x1, y0: 0, y1: r.height,
          fillcolor: "rgba(185,28,28,0.25)", line: { color: RED, width: 1 },
        })),
      }),
    [result]
  );

  return (
    <div className="cal-game">
      <div className="cal-controls">
        <label className="cal-select">
          <span>f(x)</span>
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {Object.entries(RIEMANN_FUNCTIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <label className="cal-select">
          <span>method</span>
          <select value={method} onChange={(e) => setMethod(e.target.value as RiemannMethod)}>
            <option value="left">Left endpoint</option>
            <option value="right">Right endpoint</option>
            <option value="mid">Midpoint</option>
            <option value="trapezoid">Trapezoid</option>
          </select>
        </label>
        <label className="cal-select">
          <span>a</span>
          <input type="number" step="0.5" value={a} onChange={(e) => setA(Number(e.target.value))} />
        </label>
        <label className="cal-select">
          <span>b</span>
          <input type="number" step="0.5" value={b} onChange={(e) => setB(Number(e.target.value))} />
        </label>
        <Slider label="n" value={n} min={1} max={200} step={1} onChange={setN} />
      </div>

      <Plot data={data} layout={layout} ariaLabel="Riemann sum rectangles under a curve" />

      <div className="cal-readout">
        Riemann sum ({method}, n = {n}) = <strong>{result.sum.toFixed(6)}</strong>
        {result.exact !== null && (
          <> · exact integral = <strong>{result.exact.toFixed(6)}</strong> · error ={" "}
            <strong>{result.error!.toFixed(6)}</strong></>
        )}
        {result.exact === null && <> · no closed form for this one — the sum is all you get</>}
      </div>
    </div>
  );
}

function OptimizeGame() {
  const [key, setKey] = useState("fence");
  const prob = OPT_PROBLEMS[key];
  const [x, setX] = useState(prob.xRange[0] + (prob.xRange[1] - prob.xRange[0]) / 3);
  const [found, setFound] = useState(false);
  const [revealed, setRevealed] = useState(false);

  // Each problem has its own domain (and its own answer), so a new problem
  // means a fresh search — reset the handle and hide the optimum again.
  useEffect(() => {
    setX(prob.xRange[0] + (prob.xRange[1] - prob.xRange[0]) / 3);
    setFound(false);
    setRevealed(false);
  }, [prob]);

  const deriv = prob.objDeriv(x);
  const atZero = Math.abs(deriv) < 0.05;
  const showAnswer = found || revealed;

  // Once you've actually landed on the turning point, keep the star and the
  // reveal — don't punish someone for sliding away afterward to explore.
  useEffect(() => {
    if (atZero) setFound(true);
  }, [atZero]);

  const data = useMemo(() => {
    const xs = linspace(prob.xRange[0], prob.xRange[1], 240);
    const traces: unknown[] = [
      { x: xs, y: xs.map(prob.obj), mode: "lines", line: { color: INK, width: 2 }, name: prob.yLabel },
      { x: [x], y: [prob.obj(x)], mode: "markers", marker: { color: RED, size: 12 }, name: "current" },
    ];
    if (showAnswer) {
      traces.push({
        x: [prob.optimal], y: [prob.obj(prob.optimal)], mode: "markers",
        marker: { color: GREEN, size: 12, symbol: "star" }, name: "optimum",
      });
    }
    return traces;
  }, [prob, x, showAnswer]);

  return (
    <div className="cal-game">
      <p className="set-hint" style={{ margin: "0 0 8px" }}>
        Drag the slider until the derivative reads (essentially) zero — that's the turning point, and
        it's hidden on the plot until you find it.
      </p>
      <div className="cal-controls">
        <label className="cal-select">
          <span>problem</span>
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {Object.entries(OPT_PROBLEMS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <Slider label={prob.xLabel} value={x} min={prob.xRange[0]} max={prob.xRange[1]} step={0.1}
                onChange={setX} format={(v) => v.toFixed(1)} />
      </div>

      <Plot data={data}
            layout={buildLayout({
              showlegend: false,
              xaxis: { title: prob.xLabel, range: prob.xRange, autorange: false },
              yaxis: { title: prob.yLabel },
            })}
            ariaLabel={showAnswer
              ? "Objective function with the current value and the optimum"
              : "Objective function with the current value; the optimum is still hidden"} />

      <div className="cal-readout">
        {prob.describe(x)} · derivative = <strong>{deriv.toFixed(3)}</strong>{" "}
        {atZero
          ? "— essentially zero, so this is the turning point"
          : deriv > 0
          ? "— still climbing, increase x"
          : "— past the peak, decrease x"}
      </div>

      {showAnswer ? (
        <div className={`lg-verdict ${found ? "lg-tautology" : "lg-contingent"}`} style={{ marginTop: 10 }}>
          {found && !revealed
            ? "🎉 "
            : ""}
          Optimum at {prob.xLabel.split(" ")[0]} = {prob.optimal.toFixed(3)}, where the derivative crosses zero.
        </div>
      ) : (
        <div className="set-actions" style={{ marginTop: 10 }}>
          <button className="btn-ghost" onClick={() => setRevealed(true)}>Reveal the optimum</button>
        </div>
      )}
    </div>
  );
}

function DiffeqGame() {
  const [key, setKey] = useState("growth");
  const model = DE_MODELS[key];
  const [params, setParams] = useState<Record<string, number>>(() =>
    Object.fromEntries(model.params.map((p) => [p.id, p.value]))
  );

  useEffect(() => {
    setParams(Object.fromEntries(model.params.map((p) => [p.id, p.value])));
  }, [model]);

  const series = useMemo(() => {
    // Guard against rendering with the previous model's parameters mid-swap.
    if (model.params.some((p) => params[p.id] === undefined)) return [];
    return model.run(params, model.tMax);
  }, [model, params]);

  const data = series.map((s) => ({
    x: s.t, y: s.y, mode: "lines", name: s.name,
    line: { color: s.color, width: 2, ...(s.dash ? { dash: "dash" } : {}) },
  }));

  return (
    <div className="cal-game">
      <div className="cal-controls">
        <label className="cal-select">
          <span>model</span>
          <select value={key} onChange={(e) => setKey(e.target.value)}>
            {Object.entries(DE_MODELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <button className="btn-ghost"
                onClick={() => setParams(Object.fromEntries(model.params.map((p) => [p.id, p.value])))}>
          Reset
        </button>
      </div>

      <div className="cal-controls">
        {model.params.map((p) => (
          <Slider key={p.id} label={p.label} value={params[p.id] ?? p.value}
                  min={p.min} max={p.max} step={p.step}
                  onChange={(v) => setParams((prev) => ({ ...prev, [p.id]: v }))}
                  format={(v) => (p.step < 1 ? v.toFixed(2) : String(v))} />
        ))}
      </div>

      <Plot data={data}
            layout={buildLayout({ showlegend: true, legend: { x: 0.72, y: 1 }, xaxis: { title: "time t" } })}
            ariaLabel="Solution curves of the differential equation" />

      <div className="cal-readout">
        {model.params.every((p) => params[p.id] !== undefined) && model.info(params)}
      </div>
    </div>
  );
}

function ProjectileGame() {
  const [angle, setAngle] = useState(45);
  const [speed, setSpeed] = useState(20);
  const [g, setG] = useState(9.81);
  const [frame, setFrame] = useState<number | null>(null);
  const raf = useRef<number | null>(null);

  const shot = useMemo(() => projectile(angle, speed, g), [angle, speed, g]);

  // Stop any run in flight when the parameters change or we unmount.
  useEffect(() => {
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  function launch() {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    let i = 0;
    const step = () => {
      i += 2;
      if (i >= shot.x.length) {
        setFrame(shot.x.length - 1);
        raf.current = null;
        return;
      }
      setFrame(i);
      raf.current = requestAnimationFrame(step);
    };
    setFrame(0);
    raf.current = requestAnimationFrame(step);
  }

  const upto = frame === null ? shot.x.length - 1 : frame;
  const trajectory = [
    { x: shot.x, y: shot.y, mode: "lines", line: { color: "#d6d3d1", width: 1 }, name: "path" },
    {
      x: shot.x.slice(0, upto + 1), y: shot.y.slice(0, upto + 1), mode: "lines",
      line: { color: RED, width: 2 }, name: "flown",
    },
    { x: [shot.x[upto]], y: [shot.y[upto]], mode: "markers", marker: { color: RED, size: 12 }, name: "ball" },
  ];
  const graphs = [
    { x: shot.t, y: shot.speed, mode: "lines", name: "speed |v|", line: { color: BLUE, width: 1.5 } },
    { x: shot.t, y: shot.vy, mode: "lines", name: "vertical vᵧ", line: { color: RED, width: 1.5 } },
    {
      x: shot.t, y: shot.t.map(() => -g), mode: "lines", name: "gravity aᵧ",
      line: { color: GREEN, width: 1.5, dash: "dot" },
    },
    {
      x: [shot.t[upto], shot.t[upto]], y: [-g - 5, speed + 5], mode: "lines",
      line: { color: "#a8a29e", width: 1, dash: "dash" }, showlegend: false,
    },
  ];

  return (
    <div className="cal-game">
      <div className="cal-controls">
        <Slider label="angle θ" value={angle} min={5} max={85} step={1} onChange={setAngle}
                format={(v) => `${v}°`} />
        <Slider label="speed v₀" value={speed} min={5} max={50} step={1} onChange={setSpeed}
                format={(v) => `${v} m/s`} />
        <Slider label="gravity g" value={g} min={1.6} max={25} step={0.01} onChange={setG}
                format={(v) => `${v.toFixed(2)} m/s²`} />
        <button className="send" onClick={launch}>Launch</button>
      </div>

      <Plot data={trajectory}
            layout={buildLayout({
              showlegend: false,
              xaxis: { title: "x (m)", range: [-2, shot.range + 5], autorange: false },
              yaxis: { title: "y (m)", range: [-1, shot.maxHeight + 5], autorange: false },
            })}
            ariaLabel="Projectile trajectory" />

      <Plot data={graphs} height={260}
            layout={buildLayout({
              showlegend: true, legend: { x: 0, y: 1, font: { size: 10 } },
              xaxis: { title: "time (s)" }, yaxis: { title: "m/s or m/s²" },
            })}
            ariaLabel="Speed, vertical velocity and acceleration against time" />

      <div className="cal-readout">
        Range <strong>{shot.range.toFixed(2)} m</strong> · max height{" "}
        <strong>{shot.maxHeight.toFixed(2)} m</strong> · flight time{" "}
        <strong>{shot.flightTime.toFixed(2)} s</strong>
        <div className="set-hint">
          Velocity is the derivative of position; acceleration is the derivative of velocity, and here it
          is the constant −g.
        </div>
      </div>
    </div>
  );
}

function OrbitalGame() {
  const [dest, setDest] = useState("moon");
  const [boost, setBoost] = useState(1);
  const mission = MISSIONS[dest];

  const h = useMemo(() => hohmann(mission.r1, mission.r2, mission.mu, boost), [mission, boost]);
  const ellipse = useMemo(
    () => transferEllipse(mission.r1, mission.r2 * boost, 200),
    [mission, boost]
  );

  const data = useMemo(() => {
    const start = circlePoints(mission.r1);
    const target = circlePoints(mission.r2 * boost);
    return [
      { x: start.x, y: start.y, mode: "lines", line: { color: BLUE, width: 1.5 }, name: "start orbit" },
      {
        x: target.x, y: target.y, mode: "lines", line: { color: "#a8a29e", width: 1.5, dash: "dot" },
        name: "target orbit",
      },
      { x: ellipse.x, y: ellipse.y, mode: "lines", line: { color: RED, width: 2.5 }, name: "transfer" },
      { x: [0], y: [0], mode: "markers", marker: { color: "#f59e0b", size: 14 }, name: "central body" },
      {
        x: [ellipse.x[0]], y: [ellipse.y[0]], mode: "markers",
        marker: { color: GREEN, size: 10 }, name: "burn 1",
      },
      {
        x: [ellipse.x[ellipse.x.length - 1]], y: [ellipse.y[ellipse.y.length - 1]], mode: "markers",
        marker: { color: GREEN, size: 10, symbol: "square" }, name: "burn 2",
      },
    ];
  }, [mission, boost, ellipse]);

  const days = h.transferSeconds / 86400;

  return (
    <div className="cal-game">
      <div className="cal-controls">
        <label className="cal-select">
          <span>mission</span>
          <select value={dest} onChange={(e) => setDest(e.target.value)}>
            {Object.entries(MISSIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </label>
        <Slider label="target radius ×" value={boost} min={0.6} max={1.6} step={0.01}
                onChange={setBoost} format={(v) => v.toFixed(2)} />
      </div>

      <Plot data={data} height={400}
            layout={buildLayout({
              showlegend: true, legend: { x: 0, y: 1, font: { size: 10 } },
              xaxis: { range: [-mission.viewRange, mission.viewRange], autorange: false, title: "km" },
              yaxis: { range: [-mission.viewRange, mission.viewRange], autorange: false,
                       scaleanchor: "x", scaleratio: 1 },
            })}
            ariaLabel="Hohmann transfer ellipse between two circular orbits" />

      <div className="cal-readout">
        <div>
          Burn 1 Δv = <strong>{h.dv1.toFixed(3)} km/s</strong> · Burn 2 Δv ={" "}
          <strong>{h.dv2.toFixed(3)} km/s</strong> · total ={" "}
          <strong>{(Math.abs(h.dv1) + Math.abs(h.dv2)).toFixed(3)} km/s</strong>
        </div>
        <div>
          Transfer time <strong>{days < 1 ? `${(days * 24).toFixed(1)} hours` : `${days.toFixed(1)} days`}</strong>{" "}
          · semi-major axis {(h.a / 1000).toFixed(0)}×10³ km
        </div>
        <div className="set-hint">
          Vis-viva: v² = μ(2/r − 1/a). Two burns — one to enter the ellipse, one to circularise at the
          far end — is the cheapest way between circular orbits.
        </div>
      </div>
    </div>
  );
}

/** Calculus Lab — six interactive views of derivatives, integrals and motion. */
export default function CalculusLab({ onAsk }: { onAsk: (question: string) => void }) {
  const [game, setGame] = useState<Game>("slope");
  return (
    <div className="lesson">
      <div className="lesson-bar">
        <div className="chips" style={{ margin: 0 }}>
          {GAMES.map(([id, label]) => (
            <button key={id} className={`chip ${game === id ? "active" : ""}`} onClick={() => setGame(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="lesson-body">
        <GameShell game={game} onAsk={onAsk}>
          {game === "slope" && <SlopeGame />}
          {game === "riemann" && <RiemannGame />}
          {game === "optimize" && <OptimizeGame />}
          {game === "diffeq" && <DiffeqGame />}
          {game === "projectile" && <ProjectileGame />}
          {game === "orbital" && <OrbitalGame />}
        </GameShell>
      </div>
    </div>
  );
}
