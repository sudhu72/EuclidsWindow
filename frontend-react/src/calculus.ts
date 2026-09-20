// The mathematics behind the Calculus Lab — functions, numeric integration,
// optimisation objectives, ODE integrators and orbital mechanics. No UI here,
// so every piece can be checked on its own.

export interface Fn {
  f: (x: number) => number;
  fp: (x: number) => number;
  label: string;
  /** Sensible plotting window; ln and eˣ need their own. */
  range: [number, number];
}

export const FUNCTIONS: Record<string, Fn> = {
  x2: { f: (x) => x * x, fp: (x) => 2 * x, label: "x²", range: [-3.5, 3.5] },
  x3: { f: (x) => x ** 3, fp: (x) => 3 * x * x, label: "x³", range: [-3.5, 3.5] },
  sin: { f: Math.sin, fp: Math.cos, label: "sin(x)", range: [-3.5, 3.5] },
  ex: { f: Math.exp, fp: Math.exp, label: "eˣ", range: [-3, 2.5] },
  ln: {
    f: (x) => Math.log(Math.max(x, 0.001)),
    fp: (x) => 1 / Math.max(x, 0.001),
    label: "ln(x)",
    range: [0.05, 5],
  },
};

export interface RiemannFn {
  f: (x: number) => number;
  label: string;
  /** Closed form of the integral, where one exists. */
  exact: ((a: number, b: number) => number) | null;
}

export const RIEMANN_FUNCTIONS: Record<string, RiemannFn> = {
  x2: { f: (x) => x * x, label: "x²", exact: (a, b) => (b ** 3 - a ** 3) / 3 },
  sin: {
    f: (x) => Math.sin(x) + 1,
    label: "sin(x)+1",
    exact: (a, b) => -Math.cos(b) + Math.cos(a) + (b - a),
  },
  sqrt: {
    f: (x) => Math.sqrt(Math.max(x, 0)),
    label: "√x",
    exact: (a, b) => (2 / 3) * (b ** 1.5 - Math.max(a, 0) ** 1.5),
  },
  gauss: { f: (x) => Math.exp(-x * x), label: "e^(−x²)", exact: null },
};

export type RiemannMethod = "left" | "right" | "mid" | "trapezoid";

export interface RiemannResult {
  sum: number;
  bars: { x0: number; x1: number; height: number }[];
  exact: number | null;
  error: number | null;
}

export function riemann(
  fn: RiemannFn,
  a: number,
  b: number,
  n: number,
  method: RiemannMethod
): RiemannResult {
  const dx = (b - a) / n;
  const bars: RiemannResult["bars"] = [];
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const x0 = a + i * dx;
    const height =
      method === "left"
        ? fn.f(x0)
        : method === "right"
        ? fn.f(x0 + dx)
        : method === "mid"
        ? fn.f(x0 + dx / 2)
        : (fn.f(x0) + fn.f(x0 + dx)) / 2;
    sum += height * dx;
    bars.push({ x0, x1: x0 + dx, height });
  }
  const exact = fn.exact ? fn.exact(a, b) : null;
  return { sum, bars, exact, error: exact === null ? null : Math.abs(sum - exact) };
}

export interface OptProblem {
  label: string;
  xLabel: string;
  yLabel: string;
  xRange: [number, number];
  obj: (x: number) => number;
  objDeriv: (x: number) => number;
  optimal: number;
  describe: (x: number) => string;
}

export const OPT_PROBLEMS: Record<string, OptProblem> = {
  fence: {
    label: "Max area with 100 m of fencing",
    xLabel: "width x (m)",
    yLabel: "area (m²)",
    xRange: [0.1, 49.9],
    obj: (x) => x * (50 - x),
    objDeriv: (x) => 50 - 2 * x,
    optimal: 25,
    describe: (x) => `Rectangle ${x.toFixed(1)} × ${(50 - x).toFixed(1)} m = ${(x * (50 - x)).toFixed(1)} m²`,
  },
  box: {
    label: "Max volume from a 30×30 sheet",
    xLabel: "cut size x (cm)",
    yLabel: "volume (cm³)",
    xRange: [0.1, 14.9],
    obj: (x) => x * (30 - 2 * x) ** 2,
    objDeriv: (x) => (30 - 2 * x) ** 2 - 4 * x * (30 - 2 * x),
    optimal: 5,
    describe: (x) => {
      const s = 30 - 2 * x;
      return `Box ${s.toFixed(1)}×${s.toFixed(1)}×${x.toFixed(1)} cm → ${(x * s * s).toFixed(1)} cm³`;
    },
  },
  can: {
    label: "Min surface area for 1000 cm³",
    xLabel: "radius r (cm)",
    yLabel: "surface area (cm²)",
    xRange: [1, 15],
    obj: (r) => 2 * Math.PI * r * r + 2000 / r,
    objDeriv: (r) => 4 * Math.PI * r - 2000 / (r * r),
    optimal: Math.cbrt(500 / Math.PI),
    describe: (r) => {
      const h = 1000 / (Math.PI * r * r);
      return `Can r=${r.toFixed(2)} cm, h=${h.toFixed(2)} cm → ${(2 * Math.PI * r * r + 2 * Math.PI * r * h).toFixed(1)} cm²`;
    },
  },
};

export interface DeParam {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
}

export interface DeSeries {
  name: string;
  color: string;
  t: number[];
  y: number[];
  dash?: boolean;
}

export interface DeModel {
  label: string;
  tMax: number;
  params: DeParam[];
  run: (p: Record<string, number>, tMax: number) => DeSeries[];
  info: (p: Record<string, number>) => string;
}

export const DE_MODELS: Record<string, DeModel> = {
  growth: {
    label: "Exponential growth / decay",
    tMax: 30,
    params: [
      { id: "k", label: "k (rate)", min: -2, max: 2, step: 0.1, value: 0.5 },
      { id: "y0", label: "y₀", min: 0.1, max: 10, step: 0.1, value: 1 },
    ],
    run: ({ k, y0 }, tMax) => {
      const t: number[] = [];
      const y: number[] = [];
      const dt = tMax / 500;
      let v = y0;
      for (let time = 0; time <= tMax; time += dt) {
        t.push(time);
        y.push(v);
        v += k * v * dt;
        if (Math.abs(v) > 1e6) break;
      }
      return [{ name: "y(t)", color: "#b91c1c", t, y }];
    },
    info: ({ k, y0 }) =>
      `dy/dt = ${k.toFixed(1)}·y → y(t) = ${y0.toFixed(1)}·e^(${k.toFixed(1)}t) — ` +
      (k > 0 ? "exponential growth" : k < 0 ? "exponential decay" : "constant"),
  },
  logistic: {
    label: "Logistic growth",
    tMax: 30,
    params: [
      { id: "r", label: "r (growth rate)", min: 0.1, max: 3, step: 0.1, value: 1 },
      { id: "K", label: "K (carrying capacity)", min: 10, max: 1000, step: 10, value: 100 },
      { id: "y0", label: "y₀", min: 1, max: 50, step: 1, value: 5 },
    ],
    run: ({ r, K, y0 }, tMax) => {
      const t: number[] = [];
      const y: number[] = [];
      const dt = tMax / 500;
      let v = y0;
      for (let time = 0; time <= tMax; time += dt) {
        t.push(time);
        y.push(v);
        v += r * v * (1 - v / K) * dt;
      }
      return [
        { name: "y(t)", color: "#b91c1c", t, y },
        { name: "K", color: "#a8a29e", t: [0, tMax], y: [K, K], dash: true },
      ];
    },
    info: ({ r, K }) =>
      `dy/dt = ${r.toFixed(1)}·y·(1 − y/${K.toFixed(0)}) — S-shaped, saturating at K = ${K.toFixed(0)}`,
  },
  predator: {
    label: "Lotka-Volterra (predator–prey)",
    tMax: 30,
    params: [
      { id: "alpha", label: "α (prey growth)", min: 0.1, max: 3, step: 0.1, value: 1.1 },
      { id: "beta", label: "β (predation)", min: 0.01, max: 1, step: 0.01, value: 0.4 },
      { id: "delta", label: "δ (predator growth)", min: 0.01, max: 1, step: 0.01, value: 0.1 },
      { id: "gamma", label: "γ (predator death)", min: 0.1, max: 2, step: 0.1, value: 0.4 },
      { id: "x0", label: "prey₀", min: 1, max: 50, step: 1, value: 10 },
      { id: "p0", label: "predators₀", min: 1, max: 50, step: 1, value: 5 },
    ],
    run: ({ alpha, beta, delta, gamma, x0, p0 }, tMax) => {
      let x = x0;
      let y = p0;
      const t: number[] = [];
      const prey: number[] = [];
      const pred: number[] = [];
      const dt = tMax / 2000;
      for (let time = 0; time <= tMax; time += dt) {
        t.push(time);
        prey.push(x);
        pred.push(y);
        const dx = (alpha * x - beta * x * y) * dt;
        const dy = (delta * x * y - gamma * y) * dt;
        x = Math.max(x + dx, 0);
        y = Math.max(y + dy, 0);
      }
      return [
        { name: "prey", color: "#2563eb", t, y: prey },
        { name: "predators", color: "#b91c1c", t, y: pred },
      ];
    },
    info: ({ alpha, beta, delta, gamma }) =>
      `dx/dt = ${alpha.toFixed(1)}x − ${beta.toFixed(2)}xy, dy/dt = ${delta.toFixed(2)}xy − ${gamma.toFixed(1)}y — populations oscillate`,
  },
  sir: {
    label: "SIR epidemic",
    tMax: 200,
    params: [
      { id: "beta", label: "β (infection rate)", min: 0.01, max: 1, step: 0.01, value: 0.3 },
      { id: "gamma", label: "γ (recovery rate)", min: 0.01, max: 0.5, step: 0.01, value: 0.1 },
      { id: "N", label: "N (population)", min: 100, max: 10000, step: 100, value: 1000 },
      { id: "I0", label: "I₀ (initially infected)", min: 1, max: 100, step: 1, value: 1 },
    ],
    run: ({ beta, gamma, N, I0 }, tMax) => {
      let S = N - I0;
      let I = I0;
      let R = 0;
      const t: number[] = [];
      const ss: number[] = [];
      const ii: number[] = [];
      const rr: number[] = [];
      const dt = tMax / 2000;
      for (let time = 0; time <= tMax; time += dt) {
        t.push(time);
        ss.push(S);
        ii.push(I);
        rr.push(R);
        const dS = (-beta * S * I) / N * dt;
        const dI = ((beta * S * I) / N - gamma * I) * dt;
        const dR = gamma * I * dt;
        S += dS;
        I += dI;
        R += dR;
      }
      return [
        { name: "susceptible", color: "#2563eb", t, y: ss },
        { name: "infected", color: "#b91c1c", t, y: ii },
        { name: "recovered", color: "#16a34a", t, y: rr },
      ];
    },
    info: ({ beta, gamma }) => {
      const r0 = beta / gamma;
      return (
        `dS/dt = −βSI/N, dI/dt = βSI/N − γI, dR/dt = γI — R₀ = β/γ = ${r0.toFixed(2)} ` +
        (r0 > 1 ? "(the epidemic spreads)" : "(it dies out)")
      );
    },
  },
};

export interface Projectile {
  t: number[];
  x: number[];
  y: number[];
  vy: number[];
  speed: number[];
  range: number;
  maxHeight: number;
  flightTime: number;
}

export function projectile(angleDeg: number, v0: number, g: number, steps = 200): Projectile {
  const theta = (angleDeg * Math.PI) / 180;
  const vx = v0 * Math.cos(theta);
  const vy0 = v0 * Math.sin(theta);
  const flightTime = (2 * vy0) / g;
  const dt = flightTime / steps;

  const t: number[] = [];
  const x: number[] = [];
  const y: number[] = [];
  const vy: number[] = [];
  const speed: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const time = i * dt;
    const vyt = vy0 - g * time;
    t.push(time);
    x.push(vx * time);
    y.push(vy0 * time - 0.5 * g * time * time);
    vy.push(vyt);
    speed.push(Math.hypot(vx, vyt));
  }
  return { t, x, y, vy, speed, range: vx * flightTime, maxHeight: (vy0 * vy0) / (2 * g), flightTime };
}

export interface Mission {
  label: string;
  /** Starting circular-orbit radius, km. */
  r1: number;
  /** Target orbit radius, km. */
  r2: number;
  /** Gravitational parameter GM of the central body, km³/s². */
  mu: number;
  viewRange: number;
}

const AU_KM = 1.496e8;
const GM_SUN = 1.327e11;

export const MISSIONS: Record<string, Mission> = {
  moon: { label: "Earth → Moon", r1: 6571, r2: 384400, mu: 3.986e5, viewRange: 5e5 },
  mars: { label: "Earth → Mars", r1: AU_KM, r2: 1.524 * AU_KM, mu: GM_SUN, viewRange: 2.5e8 },
};

export interface Hohmann {
  a: number;
  vCirc1: number;
  vTrans1: number;
  vTrans2: number;
  vCirc2: number;
  dv1: number;
  dv2: number;
  /** Half the transfer ellipse's period, in seconds. */
  transferSeconds: number;
}

/** Classic two-burn Hohmann transfer between circular orbits. */
export function hohmann(r1: number, r2: number, mu: number, boost = 1): Hohmann {
  const target = r2 * boost;
  const a = (r1 + target) / 2;
  const vCirc1 = Math.sqrt(mu / r1);
  const vTrans1 = Math.sqrt(mu * (2 / r1 - 1 / a));
  const vTrans2 = Math.sqrt(mu * (2 / target - 1 / a));
  const vCirc2 = Math.sqrt(mu / target);
  return {
    a,
    vCirc1,
    vTrans1,
    vTrans2,
    vCirc2,
    dv1: vTrans1 - vCirc1,
    dv2: vCirc2 - vTrans2,
    transferSeconds: Math.PI * Math.sqrt((a * a * a) / mu),
  };
}

/** Half the transfer ellipse, with the central body at the focus (origin). */
export function transferEllipse(r1: number, r2: number, points = 200) {
  const a = (r1 + r2) / 2;
  const c = a - r1;
  const b = Math.sqrt(Math.max(a * a - c * c, 0));
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i <= points; i++) {
    const theta = (Math.PI * i) / points;
    x.push(a * Math.cos(theta) - c);
    y.push(b * Math.sin(theta));
  }
  return { x, y, a, b, c };
}

export function circlePoints(r: number, points = 120) {
  const x: number[] = [];
  const y: number[] = [];
  for (let i = 0; i <= points; i++) {
    const th = (2 * Math.PI * i) / points;
    x.push(r * Math.cos(th));
    y.push(r * Math.sin(th));
  }
  return { x, y };
}

export const linspace = (a: number, b: number, n: number): number[] =>
  Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
