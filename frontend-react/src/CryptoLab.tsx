import { useMemo, useState } from "react";
import Markdown from "./Markdown";
import {
  ALPHA,
  ENGLISH_FREQ,
  bestCaesarShift,
  caesar,
  letterFrequencies,
  modPow,
  rsaKeys,
} from "./crypto";
import { COPY, LEVELS, SAMPLE_TEXTS, type Level } from "./cryptoData";

type Game = "caesar" | "frequency" | "rsa" | "diffiehellman";

const GAMES: [Game, string][] = [
  ["caesar", "Caesar Cipher"],
  ["frequency", "Frequency Analysis"],
  ["rsa", "RSA Playground"],
  ["diffiehellman", "Diffie-Hellman"],
];

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
      <div className="lg-prereq">
        <Markdown>{copy.prereq}</Markdown>
        {copy.prompt && (
          <button className="link" onClick={() => onAsk(copy.prompt)}>
            Explore this in Learn →
          </button>
        )}
      </div>
      {children}
      <div className="lg-levels">
        <div className="chips">
          {LEVELS.map((l) => (
            <button
              key={l}
              className={`chip ${level === l ? "active" : ""}`}
              onClick={() => setLevel(l)}
            >
              {l[0].toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
        <div className="lg-level-body">
          <Markdown>{copy.levels[level] || ""}</Markdown>
        </div>
      </div>
    </>
  );
}

// ── Caesar wheel geometry ───────────────────────────────────────────────────
const CX = 170;
const CY = 170;
const R_OUTER = 155;
const R_INNER = 112;
const R_OUTER_TEXT = 137;
const R_INNER_TEXT = 95;
const R_DIVIDER = 133;
const STEP = 360 / 26;

const polar = (r: number, angleDeg: number): [number, number] => {
  const rad = (angleDeg * Math.PI) / 180;
  return [CX + r * Math.cos(rad), CY + r * Math.sin(rad)];
};

function wedge(rInner: number, rOuter: number, angleDeg: number, span: number): string {
  const [x1o, y1o] = polar(rOuter, angleDeg - span / 2);
  const [x2o, y2o] = polar(rOuter, angleDeg + span / 2);
  const [x1i, y1i] = polar(rInner, angleDeg + span / 2);
  const [x2i, y2i] = polar(rInner, angleDeg - span / 2);
  return (
    `M${x1o},${y1o} A${rOuter},${rOuter} 0 0,1 ${x2o},${y2o} ` +
    `L${x1i},${y1i} A${rInner},${rInner} 0 0,0 ${x2i},${y2i} Z`
  );
}

function CaesarGame() {
  const [shift, setShift] = useState(3);
  const [encrypt, setEncrypt] = useState(true);
  const [text, setText] = useState("THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG");
  const [picked, setPicked] = useState<number | null>(null);
  const [brute, setBrute] = useState(false);

  const effectiveK = encrypt ? shift : (26 - shift) % 26;
  const output = caesar(text.toUpperCase(), shift, encrypt);
  const cipherAlphabet = ALPHA.map((_, i) => ALPHA[(i + effectiveK) % 26]).join("");

  const mapping =
    picked === null
      ? null
      : { from: picked, to: (picked + effectiveK) % 26 };

  return (
    <div className="lg-game">
      <div className="cl-caesar">
        <div className="cl-wheel-col">
          <svg className="cl-wheel" viewBox="0 0 340 340" role="img" aria-label="Caesar cipher wheel">
            <defs>
              <marker id="cl-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto" fill="#16a34a">
                <polygon points="0 0, 8 3, 0 6" />
              </marker>
            </defs>

            <circle cx={CX} cy={CY} r={R_OUTER} fill="#fafaf9" stroke="#1c1917" strokeWidth={2.5} />
            <circle cx={CX} cy={CY} r={R_DIVIDER} fill="none" stroke="#d6d3d1" strokeWidth={1} />
            <circle cx={CX} cy={CY} r={R_INNER} fill="#fef3c7" stroke="#1c1917" strokeWidth={2} />

            {mapping && (
              <>
                <path
                  d={wedge(R_DIVIDER, R_OUTER, mapping.from * STEP - 90, STEP)}
                  fill="rgba(37,99,235,0.15)"
                  stroke="#2563eb"
                  strokeWidth={1.5}
                />
                <path
                  d={wedge(30, R_INNER, (mapping.to + effectiveK) * STEP - 90, STEP)}
                  fill="rgba(185,28,28,0.15)"
                  stroke="#b91c1c"
                  strokeWidth={1.5}
                />
                <line
                  x1={polar(R_DIVIDER - 4, mapping.from * STEP - 90)[0]}
                  y1={polar(R_DIVIDER - 4, mapping.from * STEP - 90)[1]}
                  x2={polar(R_INNER + 4, (mapping.to + effectiveK) * STEP - 90)[0]}
                  y2={polar(R_INNER + 4, (mapping.to + effectiveK) * STEP - 90)[1]}
                  stroke="#16a34a"
                  strokeWidth={2.5}
                  strokeDasharray="4,3"
                  markerEnd="url(#cl-arrow)"
                />
              </>
            )}

            {ALPHA.map((letter, i) => {
              const a = i * STEP - 90;
              const [tx, ty] = polar(R_OUTER, a);
              const [tx2, ty2] = polar(R_OUTER - 8, a);
              const [lx, ly] = polar(R_OUTER_TEXT, a);
              return (
                <g key={letter}>
                  <line x1={tx} y1={ty} x2={tx2} y2={ty2} stroke="#a8a29e" strokeWidth={1} />
                  <text
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={14}
                    fontWeight={600}
                    fontFamily="monospace"
                    fill={mapping?.from === i ? "#2563eb" : "#1c1917"}
                    style={{ cursor: "pointer" }}
                    onClick={() => setPicked(picked === i ? null : i)}
                  >
                    {letter}
                  </text>
                </g>
              );
            })}

            {/* The inner ring turns; that rotation IS the key. */}
            <g
              style={{
                transform: `rotate(${-effectiveK * STEP}deg)`,
                transformOrigin: `${CX}px ${CY}px`,
                transition: "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              {ALPHA.map((letter, i) => {
                const [x, y] = polar(R_INNER_TEXT, i * STEP - 90);
                return (
                  <text
                    key={letter}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={13}
                    fontWeight={700}
                    fontFamily="monospace"
                    fill={mapping?.to === i ? "#b91c1c" : "#92400e"}
                  >
                    {letter}
                  </text>
                );
              })}
            </g>

            <circle cx={CX} cy={CY} r={30} fill="#1c1917" />
            <text x={CX} y={CY + 1} textAnchor="middle" dominantBaseline="central"
                  fill="#fafaf9" fontSize={20} fontWeight={700}>
              k={shift}
            </text>
          </svg>

          <div className="cl-wheel-label">
            {mapping ? (
              <>
                <div>
                  <strong style={{ color: "#2563eb" }}>{ALPHA[mapping.from]}</strong> ({mapping.from}) →{" "}
                  <strong style={{ color: "#b91c1c" }}>{ALPHA[mapping.to]}</strong> ({mapping.to})
                </div>
                <div className="cl-wheel-formula">
                  ({mapping.from} {encrypt ? "+" : "−"} {shift}) mod 26 = {mapping.to}
                </div>
              </>
            ) : (
              "Click any outer letter to trace its mapping"
            )}
          </div>
        </div>

        <div className="cl-caesar-col">
          <label className="set-row">
            <span>Shift k = {shift}</span>
            <input type="range" min={0} max={25} value={shift}
                   onChange={(e) => setShift(Number(e.target.value))} />
          </label>
          <label className="set-row">
            <span>Mode</span>
            <select value={encrypt ? "encrypt" : "decrypt"}
                    onChange={(e) => setEncrypt(e.target.value === "encrypt")}>
              <option value="encrypt">Encrypt</option>
              <option value="decrypt">Decrypt</option>
            </select>
          </label>

          <textarea className="pad-text" rows={3} value={text}
                    onChange={(e) => setText(e.target.value)} placeholder="Message…" />
          <textarea className="pad-text cl-out" rows={3} value={output} readOnly aria-label="Result" />

          <div className="cl-alphabet">
            <div>Plain:&nbsp; <span>{ALPHA.join("")}</span></div>
            <div>Cipher: <span className="cl-cipher">{cipherAlphabet}</span></div>
            <div className="set-hint">E(x) = (x {encrypt ? "+" : "−"} {shift}) mod 26</div>
          </div>

          <div className="set-actions">
            <button className="btn-ghost" onClick={() => setBrute((v) => !v)}>
              {brute ? "Hide" : "Brute-force all 26 shifts"}
            </button>
          </div>
          {brute && (
            <pre className="cl-brute">
              {Array.from({ length: 26 }, (_, k) =>
                `k=${String(k).padStart(2, " ")}: ${caesar(text.toUpperCase(), k, false)}`
              ).join("\n")}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function FrequencyGame() {
  const [text, setText] = useState(SAMPLE_TEXTS.caesar);
  const [userShift, setUserShift] = useState(0);
  const [checked, setChecked] = useState<"idle" | "correct" | "close" | "wrong">("idle");
  const [revealed, setRevealed] = useState<{ shift: number; chi2: number } | null>(null);

  const { freqs, total } = useMemo(() => letterFrequencies(text), [text]);
  const max = Math.max(...ALPHA.map((l) => Math.max(freqs[l], ENGLISH_FREQ[l])), 1);
  const top = useMemo(
    () => ALPHA.slice().sort((a, b) => freqs[b] - freqs[a]).slice(0, 5),
    [freqs]
  );
  const best = useMemo(() => bestCaesarShift(text), [text]);
  const preview = useMemo(() => caesar(text.toUpperCase(), userShift, false), [text, userShift]);

  function resetPuzzle(t: string) {
    setText(t);
    setUserShift(0);
    setChecked("idle");
    setRevealed(null);
  }

  function checkGuess() {
    const diff = Math.min(
      Math.abs(userShift - best.shift),
      26 - Math.abs(userShift - best.shift)
    );
    setChecked(diff === 0 ? "correct" : diff <= 2 ? "close" : "wrong");
  }

  const W = 720;
  const H = 190;
  const pad = 26;
  const barW = (W - pad * 2) / 26;

  return (
    <div className="lg-game">
      <div className="set-actions">
        <select onChange={(e) => resetPuzzle(SAMPLE_TEXTS[e.target.value] ?? text)} defaultValue="caesar">
          <option value="caesar">Sample: Caesar-shifted</option>
          <option value="subst">Sample: substitution cipher</option>
        </select>
      </div>

      <textarea className="pad-text" rows={3} value={text}
                onChange={(e) => resetPuzzle(e.target.value)}
                placeholder="Paste ciphertext…" />

      {/* Overlaid rather than two separate charts — the task is comparing the
          two distributions, which is far easier when they share an axis. */}
      <svg className="cl-chart" viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label="Ciphertext letter frequencies against English">
        {[0, 5, 10].map((v) => (
          <g key={v}>
            <line x1={pad} y1={H - 24 - (v / max) * (H - 44)} x2={W - pad}
                  y2={H - 24 - (v / max) * (H - 44)} stroke="#e7e5e4" />
            <text x={4} y={H - 21 - (v / max) * (H - 44)} fontSize={9} fill="#a8a29e">{v}%</text>
          </g>
        ))}
        {ALPHA.map((l, i) => {
          const x = pad + i * barW;
          const ch = (freqs[l] / max) * (H - 44);
          const eh = (ENGLISH_FREQ[l] / max) * (H - 44);
          return (
            <g key={l}>
              <rect x={x + 1} y={H - 24 - ch} width={barW / 2 - 1} height={ch} fill="#b91c1c" />
              <rect x={x + barW / 2} y={H - 24 - eh} width={barW / 2 - 1} height={eh}
                    fill="#2563eb" opacity={0.55} />
              <text x={x + barW / 2} y={H - 10} fontSize={9} textAnchor="middle"
                    fontFamily="monospace" fill="#57534e">{l}</text>
            </g>
          );
        })}
      </svg>
      <div className="cl-legend">
        <span><i className="cl-swatch" style={{ background: "#b91c1c" }} /> ciphertext</span>
        <span><i className="cl-swatch" style={{ background: "#2563eb", opacity: 0.55 }} /> English</span>
      </div>

      <p className="set-hint" style={{ marginTop: 8 }}>
        Analysed <strong>{total}</strong> letters. Most frequent: <strong>{top.join(", ")}</strong>.
        In English the top five are <strong>E, T, A, O, I</strong>.
      </p>

      <h5 style={{ margin: "14px 0 6px" }}>Crack it yourself</h5>
      <p className="set-hint" style={{ margin: "0 0 8px" }}>
        The tallest red bar is almost certainly standing in for E — that tells you the shift.
        Try it below and see if the decrypted text turns into real English.
      </p>
      <label className="set-row">
        <span>Your guess: k = {userShift}</span>
        <input type="range" min={0} max={25} value={userShift}
               onChange={(e) => { setUserShift(Number(e.target.value)); setChecked("idle"); }} />
      </label>
      <textarea className="pad-text cl-out" rows={3} value={preview.slice(0, 240)} readOnly
                aria-label="Decrypted preview at your guessed shift" />

      <div className="set-actions" style={{ marginTop: 8 }}>
        <button className="send" onClick={checkGuess}>Check my guess</button>
        <button className="btn-ghost" onClick={() => setRevealed(best)}>Reveal the shift</button>
      </div>

      {checked === "correct" && (
        <div className="lg-verdict lg-tautology" style={{ marginTop: 10 }}>
          🎉 That's it — k = {userShift} turns this back into real English.
        </div>
      )}
      {checked === "close" && (
        <div className="lg-verdict lg-contingent" style={{ marginTop: 10 }}>
          Close — off by a couple. Read the preview above: does it *almost* look like English, just
          shifted a letter or two? Nudge the slider until it clicks.
        </div>
      )}
      {checked === "wrong" && (
        <div className="lg-verdict lg-contradiction" style={{ marginTop: 10 }}>
          Not yet. Look at the chart: whichever red bar is tallest is standing in for E — count how
          far it is from the real E to find the shift.
        </div>
      )}

      {revealed && (
        <div className="lg-verdict lg-contingent" style={{ marginTop: 10 }}>
          <strong>Best shift: k = {revealed.shift}</strong> (χ² = {revealed.chi2.toFixed(1)})
          <pre className="cl-brute" style={{ marginTop: 8 }}>
            {caesar(text.toUpperCase(), revealed.shift, false).slice(0, 240)}
          </pre>
        </div>
      )}
    </div>
  );
}

function RsaGame() {
  const [p, setP] = useState(61);
  const [q, setQ] = useState(53);
  const [m, setM] = useState(42);

  const result = useMemo(() => rsaKeys(p, q), [p, q]);
  const keys = result.keys;
  const cipher = keys && m < keys.n ? modPow(m, keys.e, keys.n) : null;
  const back = keys && cipher !== null ? modPow(cipher, keys.d, keys.n) : null;

  return (
    <div className="lg-game">
      <div className="set-actions">
        <label className="set-row" style={{ margin: 0 }}>
          <span style={{ flexBasis: 60 }}>p</span>
          <input type="number" value={p} onChange={(e) => setP(Number(e.target.value))} />
        </label>
        <label className="set-row" style={{ margin: 0 }}>
          <span style={{ flexBasis: 60 }}>q</span>
          <input type="number" value={q} onChange={(e) => setQ(Number(e.target.value))} />
        </label>
        <label className="set-row" style={{ margin: 0 }}>
          <span style={{ flexBasis: 90 }}>message m</span>
          <input type="number" value={m} onChange={(e) => setM(Number(e.target.value))} />
        </label>
      </div>

      {result.error && <div className="lg-bad">{result.error}</div>}

      {keys && (
        <>
          <ol className="cl-steps">
            <li>n = p × q = {keys.p} × {keys.q} = <strong>{keys.n}</strong></li>
            <li>φ(n) = (p−1)(q−1) = {keys.p - 1} × {keys.q - 1} = <strong>{keys.phi}</strong></li>
            <li>Choose e = <strong>{keys.e}</strong> — gcd(e, φ) = 1 ✓</li>
            <li>
              d = e⁻¹ mod φ(n) = <strong>{keys.d}</strong>
              {" "}— e·d mod φ = {keys.check} {keys.check === 1 ? "✓" : "✗"}
            </li>
          </ol>
          <div className="cl-keys">
            <span className="cl-pub">Public key: (n={keys.n}, e={keys.e})</span>
            <span className="cl-priv">Private key: d={keys.d}</span>
          </div>

          {m >= keys.n ? (
            <div className="lg-bad">Message m = {m} must be smaller than n = {keys.n}.</div>
          ) : (
            <div className={`lg-verdict ${back === m ? "lg-tautology" : "lg-contradiction"}`}>
              <div>Encrypt: c = mᵉ mod n = {m}^{keys.e} mod {keys.n} = <strong>{cipher}</strong></div>
              <div>Decrypt: m = c^d mod n = {cipher}^{keys.d} mod {keys.n} = <strong>{back}</strong></div>
              <p style={{ margin: "6px 0 0" }}>
                {back === m
                  ? "✓ The round trip returns the original message."
                  : "✗ Round trip failed — check the primes."}{" "}
                <span className="set-hint">
                  This works because m^(ed) ≡ m^(1+kφ(n)) ≡ m (mod n), by Euler&rsquo;s theorem.
                </span>
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DiffieGame() {
  const [p, setP] = useState(23);
  const [g, setG] = useState(5);
  const [a, setA] = useState(6);
  const [b, setB] = useState(15);

  const valid = p >= 2;
  const A = valid ? modPow(g, a, p) : 0;
  const B = valid ? modPow(g, b, p) : 0;
  const sA = valid ? modPow(B, a, p) : 0;
  const sB = valid ? modPow(A, b, p) : 0;

  return (
    <div className="lg-game">
      <div className="set-actions">
        {([
          ["prime p", p, setP],
          ["base g", g, setG],
          ["Alice a", a, setA],
          ["Bob b", b, setB],
        ] as [string, number, (n: number) => void][]).map(([label, value, set]) => (
          <label key={label} className="set-row" style={{ margin: 0 }}>
            <span style={{ flexBasis: 74 }}>{label}</span>
            <input type="number" value={value} onChange={(e) => set(Number(e.target.value))} />
          </label>
        ))}
      </div>

      {!valid ? (
        <div className="lg-bad">p must be at least 2.</div>
      ) : (
        <>
          <div className="cl-dh">
            <div className="cl-dh-side">
              <h5>Alice</h5>
              <p>Secret a = <strong>{a}</strong></p>
              <p>A = g<sup>a</sup> mod p = {g}^{a} mod {p}</p>
              <p className="cl-pub">A = {A} → sent to Bob</p>
            </div>
            <div className="cl-dh-mid">
              <h5>Public channel</h5>
              <p>p = {p}, g = {g}</p>
              <p className="cl-pub">A = {A}</p>
              <p className="cl-priv">B = {B}</p>
              <p className="set-hint">
                Eve sees p, g, A and B — but recovering a or b means solving the discrete
                logarithm, which nobody knows how to do quickly.
              </p>
            </div>
            <div className="cl-dh-side">
              <h5>Bob</h5>
              <p>Secret b = <strong>{b}</strong></p>
              <p>B = g<sup>b</sup> mod p = {g}^{b} mod {p}</p>
              <p className="cl-priv">B = {B} → sent to Alice</p>
            </div>
          </div>

          <div className={`lg-verdict ${sA === sB ? "lg-tautology" : "lg-contradiction"}`}>
            <div>Alice computes s = B<sup>a</sup> mod p = {B}^{a} mod {p} = <strong>{sA}</strong></div>
            <div>Bob computes&nbsp; s = A<sup>b</sup> mod p = {A}^{b} mod {p} = <strong>{sB}</strong></div>
            <p style={{ margin: "6px 0 0" }}>
              {sA === sB
                ? `✓ Both arrived at g^(ab) mod p = ${sA} without ever sending it.`
                : "✗ Mismatch — check the parameters."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

/** Cryptology Lab — Caesar, frequency analysis, RSA and Diffie-Hellman. */
export default function CryptoLab({ onAsk }: { onAsk: (question: string) => void }) {
  const [game, setGame] = useState<Game>("caesar");

  return (
    <div className="lesson">
      <div className="lesson-bar">
        <div className="chips" style={{ margin: 0 }}>
          {GAMES.map(([id, label]) => (
            <button key={id} className={`chip ${game === id ? "active" : ""}`}
                    onClick={() => setGame(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="lesson-body">
        <GameShell game={game} onAsk={onAsk}>
          {game === "caesar" && <CaesarGame />}
          {game === "frequency" && <FrequencyGame />}
          {game === "rsa" && <RsaGame />}
          {game === "diffiehellman" && <DiffieGame />}
        </GameShell>
      </div>
    </div>
  );
}
