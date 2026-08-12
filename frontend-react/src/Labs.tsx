import { useEffect, useState } from "react";
import AiByHand from "./AiByHand";
import LogicLab from "./LogicLab";
import CryptoLab from "./CryptoLab";
import CalculusLab from "./CalculusLab";
import MatrixLab from "./MatrixLab";

// Music Lab and the two FFT labs stay in vanilla JS on purpose — Web Audio
// timing, VexFlow engraving and live recording are where a React rewrite would
// most easily lose fidelity. They load from /embed, a shell that carries only
// those labs. Everything else here is native React.
const LABS: { id: string; label: string; icon: string; desc: string }[] = [
  { id: "aibyhand", label: "AI by Hand", icon: "▦", desc: "Rebuild 19 AI/ML ideas the Feynman way, by hand." },
  { id: "musiclab", label: "Music Lab", icon: "♫", desc: "Hear the math of music: harmonics, strings, Mozart's dice." },
  { id: "calclab", label: "Calculus Lab", icon: "∫", desc: "Tangents, Riemann sums, optimisation, ODEs, orbits." },
  { id: "fftlab", label: "FFT Lab", icon: "∿", desc: "Decompose signals into frequencies; record your own." },
  { id: "cryptolab", label: "Crypto Lab", icon: "⊕", desc: "Caesar wheel, frequency analysis, RSA, Diffie-Hellman." },
  { id: "logiclab", label: "Logic Lab", icon: "⊢", desc: "Truth tables, syllogisms, Knights & Knaves, logic gates." },
  { id: "matrixlab", label: "Matrix Lab", icon: "▨", desc: "Operations, by-hand practice, and the transform drawn." },
];

/** Labs that are native React; everything else still uses the embed bridge. */
const NATIVE = new Set(["aibyhand", "logiclab", "cryptolab", "calclab", "matrixlab"]);

export default function Labs({ onAsk }: { onAsk: (question: string) => void }) {
  const [active, setActive] = useState<string | null>(null);

  // The embedded labs have "Explore in Tutor" links. They cannot reach Learn
  // from inside the iframe, so the shell posts the question up to us.
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const data = e.data as { source?: string; type?: string; question?: string };
      if (data?.source === "euclid-embed" && data.type === "ask" && data.question) {
        onAsk(data.question);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onAsk]);

  if (active) {
    const lab = LABS.find((l) => l.id === active)!;
    if (NATIVE.has(active)) {
      return (
        <div className="labs-frame-wrap">
          <div className="labs-frame-bar">
            <button className="btn" onClick={() => setActive(null)}>← All labs</button>
            <span className="labs-frame-title">{lab.icon} {lab.label}</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", display: "flex" }}>
            {active === "aibyhand" ? (
              <AiByHand />
            ) : active === "logiclab" ? (
              <LogicLab onAsk={onAsk} />
            ) : active === "cryptolab" ? (
              <CryptoLab onAsk={onAsk} />
            ) : active === "calclab" ? (
              <CalculusLab onAsk={onAsk} />
            ) : (
              <MatrixLab onAsk={onAsk} />
            )}
          </div>
        </div>
      );
    }
    return (
      <div className="labs-frame-wrap">
        <div className="labs-frame-bar">
          <button className="btn" onClick={() => setActive(null)}>← All labs</button>
          <span className="labs-frame-title">{lab.icon} {lab.label}</span>
        </div>
        <iframe className="labs-frame" src={`/embed?tab=${active}`} title={lab.label} />
      </div>
    );
  }

  return (
    <div className="lesson">
      <div className="lesson-body">
        <div className="empty" style={{ margin: "8px auto 16px" }}>
          Interactive labs — explore the math behind music, signals, ciphers, calculus, and more.
        </div>
        <div className="labs-grid">
          {LABS.map((l) => (
            <button key={l.id} className="lab-card" onClick={() => setActive(l.id)}>
              <span className="lab-icon">{l.icon}</span>
              <span className="lab-name">{l.label}</span>
              <span className="lab-desc">{l.desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
