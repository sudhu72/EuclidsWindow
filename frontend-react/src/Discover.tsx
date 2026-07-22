import { useState } from "react";
import { discover, type Discovery } from "./discoverApi";
import Markdown from "./Markdown";

const LEVELS = ["kids", "teen", "college", "adult"];

const STAGES: [keyof Discovery, string][] = [
  ["know", "① What you already know"],
  ["question", "② The question that makes you invent it"],
  ["byhand", "③ Do it by hand"],
  ["discover", "④ Discover the rule"],
  ["explain", "⑤ Explain it simply (Feynman)"],
];

function Chips({ items, cls, onPick }: { items: string[]; cls: string; onPick: (t: string) => void }) {
  if (!items.length) return null;
  return (
    <>
      {items.map((c, i) => (
        <button key={i} className={`dchip ${cls}`} onClick={() => onPick(c)}>
          {c}
        </button>
      ))}
    </>
  );
}

export default function Discover() {
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("teen");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<Discovery | null>(null);

  async function run(t?: string) {
    const q = (t ?? topic).trim();
    if (!q || busy) return;
    setTopic(q);
    setBusy(true);
    setData(null);
    setStatus("Working out a discovery path from first principles…");
    try {
      const d = await discover(q, level);
      setData(d);
      setStatus("");
    } catch (e) {
      setStatus(`Discovery failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Any topic, e.g. why a determinant measures area"
          onKeyDown={(e) => e.key === "Enter" && void run()}
        />
        <select value={level} onChange={(e) => setLevel(e.target.value)}>
          {LEVELS.map((l) => (
            <option key={l} value={l}>
              {l[0].toUpperCase() + l.slice(1)}
            </option>
          ))}
        </select>
        <button className="send" onClick={() => void run()} disabled={busy || !topic.trim()}>
          {busy ? "Discovering…" : "💡 Discover"}
        </button>
        <span className="status">{status}</span>
      </div>

      {!data && !busy && (
        <div className="empty">
          Rebuild any idea the Feynman way — from what you already know, to a tiny example worked
          by hand, to deriving the rule yourself, with connections up and down the map of
          mathematics. Click any connection to keep climbing.
        </div>
      )}

      {data && (
        <div className="lesson-body">
          <h3 className="lesson-title">{data.topic}</h3>
          <p className="dsub">Rebuild it from first principles — you could have discovered this.</p>

          {STAGES.map(([key, label]) => (
            <div className="dstage" key={key}>
              <div className="dstage-h">{label}</div>
              <div className="dstage-b">
                <Markdown>{String(data[key] || "")}</Markdown>
              </div>
            </div>
          ))}

          <div className="dstage dconnect">
            <div className="dstage-h">⑥ Connections (basic → advanced)</div>
            <div className="dstage-b dchips">
              {data.prerequisites.length > 0 && (
                <div>
                  <b>Rests on:</b> <Chips items={data.prerequisites} cls="pre" onPick={run} />
                </div>
              )}
              {data.unlocks.length > 0 && (
                <div>
                  <b>Unlocks:</b> <Chips items={data.unlocks} cls="post" onPick={run} />
                </div>
              )}
              {data.related.length > 0 && (
                <div>
                  <b>Related in the map:</b> <Chips items={data.related} cls="rel" onPick={run} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
