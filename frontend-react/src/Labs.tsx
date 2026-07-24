import { useState } from "react";

// The classic interactive labs (Web Audio synthesis, Plotly, canvas) are large;
// rather than a risky one-shot rewrite, the React Labs menu opens each one in
// embed mode (?tab=<id>&embed=1 hides the classic chrome). They're fully usable
// here now; native React ports can follow lab by lab.
const LABS: { id: string; label: string; icon: string; desc: string }[] = [
  { id: "aibyhand", label: "AI by Hand", icon: "▦", desc: "Rebuild 19 AI/ML ideas the Feynman way, by hand." },
  { id: "musiclab", label: "Music Lab", icon: "♫", desc: "Hear the math of music: harmonics, strings, Mozart's dice." },
  { id: "calclab", label: "Calculus Lab", icon: "∫", desc: "Derivatives, integrals, and limits, visualized." },
  { id: "fftlab", label: "FFT Lab", icon: "∿", desc: "Decompose signals into frequencies; record your own." },
  { id: "cryptolab", label: "Crypto Lab", icon: "🔒", desc: "Ciphers, modular arithmetic, and public keys." },
  { id: "logiclab", label: "Logic Lab", icon: "⊢", desc: "Syllogisms, Boolean algebra, and digital circuits." },
  { id: "matrixlab", label: "Matrix Lab", icon: "▨", desc: "Matrix operations and linear transformations." },
];

export default function Labs() {
  const [active, setActive] = useState<string | null>(null);

  if (active) {
    const lab = LABS.find((l) => l.id === active)!;
    return (
      <div className="labs-frame-wrap">
        <div className="labs-frame-bar">
          <button className="btn" onClick={() => setActive(null)}>← All labs</button>
          <span className="labs-frame-title">{lab.icon} {lab.label}</span>
        </div>
        <iframe className="labs-frame" src={`/?tab=${active}&embed=1`} title={lab.label} />
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
