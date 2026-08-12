import { useEffect, useRef, useState } from "react";

interface Check {
  label?: string;
  passed?: boolean;
  detail?: string;
}

interface Validation {
  status: "pass" | "warn";
  pass_rate: number;
  checks: Check[];
  rag_feedback: string[];
  message?: string | null;
}

const WIDTH = 760;
const HEIGHT = 320;

/**
 * Math scratchpad: write with a mouse or trackpad, convert the drawing to text
 * (OCR), then check the working symbolically against the question.
 *
 * Strokes are kept as point lists rather than relying on canvas pixels, so undo
 * is exact and the grid can be repainted without disturbing the drawing.
 */
export default function Scratchpad({ question }: { question: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [strokes, setStrokes] = useState<{ pts: [number, number][]; erase: boolean }[]>([]);
  const drawingRef = useRef(false);
  const [erasing, setErasing] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [result, setResult] = useState<Validation | null>(null);

  // Repaint from the stroke list whenever it changes.
  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);

    ctx.strokeStyle = "#eceae8";
    ctx.lineWidth = 1;
    for (let x = 20; x < c.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, c.height);
      ctx.stroke();
    }
    for (let y = 20; y < c.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(c.width, y);
      ctx.stroke();
    }

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
      if (s.pts.length < 2) continue;
      ctx.strokeStyle = s.erase ? "#ffffff" : "#1c1917";
      ctx.lineWidth = s.erase ? 18 : 2.5;
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0], s.pts[0][1]);
      for (const [x, y] of s.pts.slice(1)) ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, [strokes]);

  const pos = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    // The canvas is scaled by CSS, so map client coords back to its own space.
    return [
      ((e.clientX - r.left) / r.width) * WIDTH,
      ((e.clientY - r.top) / r.height) * HEIGHT,
    ];
  };

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    // Capture keeps a stroke alive if the pointer leaves the canvas, but it
    // throws when the pointer isn't active — never let that lose the stroke.
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture is an optimisation, not a requirement */
    }
    // A ref, not state: the very next pointermove can arrive before React has
    // re-rendered, and a stale `false` would drop the start of the stroke.
    drawingRef.current = true;
    // Read the point now — `currentTarget` is only valid while the event is
    // being dispatched, and a state updater runs later, during render.
    const start = pos(e);
    setStrokes((s) => [...s, { pts: [start], erase: erasing }]);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const p = pos(e);
    setStrokes((s) => {
      const copy = s.slice();
      const last = copy[copy.length - 1];
      if (last) copy[copy.length - 1] = { ...last, pts: [...last.pts, p] };
      return copy;
    });
  }
  const up = () => {
    drawingRef.current = false;
  };

  async function recognize() {
    const c = canvasRef.current;
    if (!c || busy) return;
    if (strokes.length === 0) {
      setStatus("Write something first.");
      return;
    }
    setBusy(true);
    setStatus("Reading your handwriting…");
    try {
      const r = await fetch("/api/ai/handwriting/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_data: c.toDataURL("image/png") }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setText(d.text || "");
      setStatus(
        d.text
          ? `Recognized (confidence ${Math.round((d.confidence || 0) * 100)}%). Edit before checking.`
          : d.message || "Nothing legible was found."
      );
    } catch (e) {
      setStatus(`Recognition failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  async function validate() {
    if (!text.trim() || busy) return;
    setBusy(true);
    setResult(null);
    setStatus("Checking your working…");
    try {
      const r = await fetch("/api/ai/handwriting/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question || "Check this working", answer_text: text }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.detail || `HTTP ${r.status}`);
      setResult(d);
      setStatus("");
    } catch (e) {
      setStatus(`Check failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <details className="pad">
      <summary>Math scratchpad</summary>
      <p className="set-hint" style={{ margin: "8px 0" }}>
        Write with your mouse or trackpad, convert it to text, then have it checked.
      </p>

      <canvas
        ref={canvasRef}
        className="pad-canvas"
        width={WIDTH}
        height={HEIGHT}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      />

      <div className="set-actions">
        <button className={`btn-ghost ${erasing ? "" : "pad-on"}`} onClick={() => setErasing(false)}>
          Pen
        </button>
        <button className={`btn-ghost ${erasing ? "pad-on" : ""}`} onClick={() => setErasing(true)}>
          Eraser
        </button>
        <button className="btn-ghost" onClick={() => setStrokes((s) => s.slice(0, -1))} disabled={!strokes.length}>
          Undo
        </button>
        <button className="btn-ghost" onClick={() => { setStrokes([]); setResult(null); setStatus(""); }}>
          Clear
        </button>
        <button className="btn-ghost" onClick={() => void recognize()} disabled={busy}>
          Convert to text
        </button>
        {status && <span className="status">{status}</span>}
      </div>

      <textarea
        className="pad-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Converted text appears here — you can edit it before checking."
        rows={3}
      />
      <div className="set-actions">
        <button className="send" onClick={() => void validate()} disabled={busy || !text.trim()}>
          Validate answer
        </button>
      </div>

      {result && (
        <div className={`pad-result ${result.status === "pass" ? "pad-pass" : "pad-warn"}`}>
          <strong>
            {result.status === "pass" ? "✓ Looks right" : "⚠ Worth another look"} ·{" "}
            {Math.round((result.pass_rate || 0) * 100)}% of checks passed
          </strong>
          {result.message && <p className="pad-msg">{result.message}</p>}
          {result.checks?.length > 0 && (
            <ul className="pad-checks">
              {result.checks.map((c, i) => (
                <li key={i}>
                  {c.passed ? "✓" : "✗"} {c.label || c.detail || "check"}
                </li>
              ))}
            </ul>
          )}
          {result.rag_feedback?.length > 0 && (
            <div className="pad-rag">
              <strong>From your library:</strong>
              <ul>
                {result.rag_feedback.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </details>
  );
}
