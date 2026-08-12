import { useEffect, useMemo, useState } from "react";
import Plot, { buildLayout } from "./Plot";
import {
  OPERATIONS,
  applyOperation,
  applyToVector,
  byHandSteps,
  checkWork,
  projectXY,
  transformSquare,
  UNIT_SQUARE,
  zeros,
  type Matrix,
  type Operation,
  type Vec,
} from "./matrix";

const DIMS = [2, 3, 4];

/** A worked starting point, so the lab is never staring at a grid of zeros. */
const EXAMPLE: { a: Matrix; b: Matrix; v: Vec } = {
  a: [
    [2, 1],
    [0, 3],
  ],
  b: [
    [1, -1],
    [2, 1],
  ],
  v: [1, 2],
};

function resize(m: Matrix, rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, (_, i) =>
    Array.from({ length: cols }, (_, j) => m[i]?.[j] ?? 0)
  );
}

function Grid({
  title,
  value,
  onChange,
  readOnly,
}: {
  title: string;
  value: Matrix;
  onChange?: (m: Matrix) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="mx-card">
      <div className="mx-title">{title}</div>
      <div className="mx-grid" style={{ gridTemplateColumns: `repeat(${value[0]?.length ?? 1}, 1fr)` }}>
        {value.map((row, i) =>
          row.map((cell, j) => (
            <input
              key={`${i}-${j}`}
              type="number"
              className="mx-cell"
              value={Number.isFinite(cell) ? cell : 0}
              readOnly={readOnly}
              aria-label={`${title} row ${i + 1} column ${j + 1}`}
              onChange={(e) => {
                if (!onChange) return;
                const next = value.map((r) => r.slice());
                next[i][j] = Number(e.target.value);
                onChange(next);
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}

function VectorGrid({
  title,
  value,
  onChange,
  hint,
}: {
  title: string;
  value: Vec;
  onChange?: (v: Vec) => void;
  hint?: string;
}) {
  return (
    <div className="mx-card">
      <div className="mx-title">{title}</div>
      <div className="mx-grid" style={{ gridTemplateColumns: `repeat(${value.length}, 1fr)` }}>
        {value.map((cell, i) => (
          <input
            key={i}
            type="number"
            className="mx-cell"
            value={Number.isFinite(cell) ? cell : 0}
            aria-label={`${title} component ${i + 1}`}
            onChange={(e) => {
              if (!onChange) return;
              const next = value.slice();
              next[i] = Number(e.target.value);
              onChange(next);
            }}
          />
        ))}
      </div>
      {hint && <div className="set-hint">{hint}</div>}
    </div>
  );
}

/** Matrix & Vector Lab — operations, by-hand practice, and the transform drawn. */
export default function MatrixLab({ onAsk }: { onAsk: (question: string) => void }) {
  const [aRows, setARows] = useState(2);
  const [aCols, setACols] = useState(2);
  const [bRows, setBRows] = useState(2);
  const [bCols, setBCols] = useState(2);
  const [a, setA] = useState<Matrix>(EXAMPLE.a);
  const [b, setB] = useState<Matrix>(EXAMPLE.b);
  const [v, setV] = useState<Vec>(EXAMPLE.v);
  const [op, setOp] = useState<Operation>("add");
  const [practice, setPractice] = useState(true);
  const [predC, setPredC] = useState<Matrix>(zeros(2, 2));
  const [predCv, setPredCv] = useState<Vec>([0, 0]);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [anim, setAnim] = useState<{ state: "idle" | "running" | "done" | "error"; url?: string; format?: string; message?: string; seconds: number }>({ state: "idle", seconds: 0 });
  const [animWhich, setAnimWhich] = useState<"A" | "B" | "C">("A");

  // Keep the grids in step with the chosen dimensions.
  useEffect(() => setA((m) => resize(m, aRows, aCols)), [aRows, aCols]);
  useEffect(() => setB((m) => resize(m, bRows, bCols)), [bRows, bCols]);
  useEffect(() => setV((vec) => Array.from({ length: aCols }, (_, i) => vec[i] ?? 0)), [aCols]);

  const result = useMemo(() => {
    try {
      const c = applyOperation(a, b, op);
      const cv = c[0].length === v.length ? applyToVector(c, v) : null;
      return { c, cv, error: null as string | null };
    } catch (e) {
      return { c: null, cv: null, error: (e as Error).message };
    }
  }, [a, b, op, v]);

  // The prediction grids have to match whatever shape C currently is.
  useEffect(() => {
    if (!result.c) return;
    setPredC((m) => resize(m, result.c!.length, result.c![0].length));
    setPredCv((vec) => Array.from({ length: result.c!.length }, (_, i) => vec[i] ?? 0));
    setFeedback(null);
    setRevealed(false);
  }, [result.c?.length, result.c?.[0]?.length, op]);

  const answersVisible = !practice || revealed;

  function check() {
    if (!result.c || !result.cv) return;
    const { wrong } = checkWork(predC, predCv, result.c, result.cv);
    if (wrong.length === 0) {
      setFeedback({ ok: true, text: "Correct — every entry matches. Answers unlocked." });
      setRevealed(true);
    } else {
      const hints = wrong
        .slice(0, 3)
        .map((w) => `${w.label}: expected ${w.expected.toFixed(2)}, you put ${w.entered.toFixed(2)}`);
      setFeedback({
        ok: false,
        text: `${wrong.length} value${wrong.length === 1 ? "" : "s"} to fix. ${hints.join(" · ")}`,
      });
    }
  }

  // ── the transform, drawn ──────────────────────────────────────────────────
  const plot = useMemo(() => {
    if (!result.c) return null;
    const c = result.c;
    const square = UNIT_SQUARE;
    let tsquare: [number, number][] = [];
    try {
      tsquare = transformSquare(c);
    } catch {
      tsquare = [];
    }
    const arrow = (vec: number[] | null, color: string, name: string) => {
      if (!vec) return null;
      const [x, y] = projectXY(vec);
      return {
        x: [0, x], y: [0, y], mode: "lines+markers", name,
        line: { color, width: 3 }, marker: { color, size: 8 },
      };
    };
    const av = a[0].length === v.length ? applyToVector(a, v) : null;
    const bv = b[0].length === v.length ? applyToVector(b, v) : null;
    const traces = [
      {
        x: square.map((p) => p[0]), y: square.map((p) => p[1]), mode: "lines",
        line: { color: "#94a3b8", dash: "dot", width: 2 }, name: "unit square",
      },
      ...(tsquare.length
        ? [{
            x: tsquare.map((p) => p[0]), y: tsquare.map((p) => p[1]), mode: "lines",
            fill: "toself", fillcolor: "rgba(245,158,11,0.18)",
            line: { color: "#f59e0b", width: 2 }, name: "C · unit square",
          }]
        : []),
      arrow(v, "#475569", "v"),
      arrow(av, "#2563eb", "A·v"),
      arrow(bv, "#7c3aed", "B·v"),
      arrow(result.cv, "#dc2626", "C·v"),
    ].filter(Boolean);

    const values = traces.flatMap((t) => [
      ...((t as { x: number[] }).x || []),
      ...((t as { y: number[] }).y || []),
    ]);
    const maxAbs = Math.max(2, ...values.map(Math.abs).filter(Number.isFinite));
    const range = [-Math.ceil(maxAbs + 1), Math.ceil(maxAbs + 1)];
    return { traces, range };
  }, [a, b, v, result]);

  async function animate() {
    const matrix = animWhich === "A" ? a : animWhich === "B" ? b : result.c;
    if (!matrix) return;
    setAnim({ state: "running", seconds: 0 });
    const started = Date.now();
    const ticker = setInterval(
      () => setAnim((s) => (s.state === "running" ? { ...s, seconds: Math.round((Date.now() - started) / 1000) } : s)),
      1000
    );
    try {
      const r = await fetch("/api/matrix/animate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matrix, title: `Matrix ${animWhich} transformation` }),
      });
      const d = await r.json();
      const data = d.visualization?.data;
      if (d.status === "completed" && data?.url) {
        setAnim({ state: "done", url: data.url, format: data.format || "gif", seconds: 0 });
      } else {
        setAnim({ state: "error", message: d.message || "The render produced no output.", seconds: 0 });
      }
    } catch (e) {
      setAnim({ state: "error", message: (e as Error).message, seconds: 0 });
    } finally {
      clearInterval(ticker);
    }
  }

  const dimSelect = (label: string, rows: number, cols: number, setR: (n: number) => void, setC: (n: number) => void) => (
    <label className="cal-select">
      <span>{label}</span>
      <select value={rows} onChange={(e) => setR(Number(e.target.value))} aria-label={`${label} rows`}>
        {DIMS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <span>×</span>
      <select value={cols} onChange={(e) => setC(Number(e.target.value))} aria-label={`${label} columns`}>
        {DIMS.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </label>
  );

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <strong style={{ flex: 1 }}>Matrix &amp; Vector Lab</strong>
        <button
          className="link"
          onClick={() =>
            onAsk("Explain matrix multiplication and how a matrix transforms vectors and shapes geometrically")
          }
        >
          Explore this in Learn →
        </button>
      </div>

      <div className="lesson-body">
        <p className="dsub">
          Set the shapes, do the arithmetic by hand, then watch what the matrix does to the plane.
        </p>

        <div className="cal-controls">
          {dimSelect("A", aRows, aCols, setARows, setACols)}
          {dimSelect("B", bRows, bCols, setBRows, setBCols)}
          <label className="cal-select">
            <span>operation</span>
            <select value={op} onChange={(e) => setOp(e.target.value as Operation)}>
              {OPERATIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </label>
          <label className="set-check set-check-inline">
            <input type="checkbox" checked={practice} onChange={(e) => setPractice(e.target.checked)} />
            <span><strong>Practise by hand first</strong></span>
          </label>
          <button
            className="btn-ghost"
            onClick={() => {
              setARows(2); setACols(2); setBRows(2); setBCols(2);
              setA(EXAMPLE.a); setB(EXAMPLE.b); setV(EXAMPLE.v);
            }}
          >
            Load example
          </button>
        </div>

        <div className="mx-row">
          <Grid title="Matrix A" value={a} onChange={setA} />
          <Grid title="Matrix B" value={b} onChange={setB} />
          <VectorGrid title="Vector v" value={v} onChange={setV}
                      hint={`length follows A's columns (${aCols})`} />
        </div>

        {result.error && <div className="lg-bad">{result.error}</div>}

        {result.c && (
          <>
            {practice && !revealed && (
              <div className="mx-practice">
                <h4>Your turn</h4>
                <p className="set-hint" style={{ margin: "0 0 10px" }}>
                  Work out C and C·v on paper, type them in, then check. The answers stay hidden
                  until they match.
                </p>
                <div className="mx-row">
                  <Grid title="Your C" value={predC} onChange={setPredC} />
                  <VectorGrid title="Your C·v" value={predCv} onChange={setPredCv} />
                </div>
                <div className="set-actions">
                  <button className="send" onClick={check}>Check my work</button>
                  <button className="btn-ghost" onClick={() => setRevealed(true)}>Show me</button>
                </div>
              </div>
            )}

            {/* Outside the practice panel on purpose: a correct answer reveals
                the results and unmounts that panel, which would take the
                confirmation with it just as it was earned. */}
            {feedback && (
              <div className={`lg-verdict ${feedback.ok ? "lg-tautology" : "lg-contradiction"}`}>
                {feedback.text}
              </div>
            )}

            {answersVisible && (
              <>
                <div className="mx-row">
                  <Grid title={`C (${OPERATIONS.find(([o]) => o === op)![1]})`} value={result.c} readOnly />
                  {result.cv && <VectorGrid title="C · v" value={result.cv} />}
                </div>
                <details className="mx-steps">
                  <summary>The arithmetic, term by term</summary>
                  <pre>{byHandSteps(a, b, op, v).join("\n")}</pre>
                </details>
              </>
            )}

            {plot && (
              <>
                <h4 style={{ marginTop: 18 }}>What the transform does</h4>
                {/* Equal aspect only reads correctly in a roughly square frame —
                    in a wide one Plotly stretches x to keep the ratio and the
                    shape shrinks into the middle. */}
                <div className="mx-plot">
                  <Plot
                    data={plot.traces}
                    height={440}
                    layout={buildLayout({
                      legend: { orientation: "h", y: 1.12 },
                      xaxis: { range: plot.range, title: "x", scaleanchor: "y", scaleratio: 1 },
                      yaxis: { range: plot.range, title: "y" },
                    })}
                    ariaLabel="Unit square and vectors before and after the transform"
                  />
                </div>
                <p className="set-hint">
                  {result.c.length === 3
                    ? "3×3 results are read as homogeneous coordinates and projected onto x-y."
                    : "The shaded quadrilateral is the unit square after C; its area is |det C|."}
                </p>
              </>
            )}

            <div className="mx-anim">
              <h4>Animate the transformation</h4>
              <p className="set-hint" style={{ margin: "0 0 8px" }}>
                Renders a 3Blue1Brown-style Manim clip of the grid deforming under the matrix.
              </p>
              <div className="set-actions">
                <select value={animWhich} onChange={(e) => setAnimWhich(e.target.value as "A" | "B" | "C")}>
                  <option value="A">Matrix A</option>
                  <option value="B">Matrix B</option>
                  <option value="C">Result C</option>
                </select>
                <button className="send" onClick={() => void animate()} disabled={anim.state === "running"}>
                  {anim.state === "running" ? `Rendering… ${anim.seconds}s` : "Generate animation"}
                </button>
              </div>
              {anim.state === "error" && <div className="lg-bad">{anim.message}</div>}
              {anim.state === "done" && anim.url && (
                <figure className="viz" style={{ marginTop: 12 }}>
                  {anim.format === "gif" ? (
                    <img className="viz-img" src={anim.url} alt="Matrix transformation animation" />
                  ) : (
                    <video className="viz-img" src={anim.url} controls autoPlay loop muted />
                  )}
                </figure>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
