/* =============================================================================
   Calculus Lab — Interactive games & visualizations for derivatives, integrals,
   optimization, differential equations, and projectile motion.
   Uses Plotly.js for charts; pure-browser, no backend needed.
   ============================================================================= */

(function () {
  "use strict";

  // =========================================================================
  //  Game selector (same pattern as Music Lab)
  // =========================================================================
  const gameBtns = document.querySelectorAll(".calc-game-btn");
  const gamePanels = document.querySelectorAll(".calc-game");

  gameBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      gameBtns.forEach((b) => {
        b.classList.remove("active");
        b.className = b.className.replace("btn-primary", "btn-secondary");
      });
      btn.classList.add("active");
      btn.className = btn.className.replace("btn-secondary", "btn-primary");
      const id = btn.dataset.game;
      gamePanels.forEach((p) => p.classList.toggle("active", p.id === "calc-" + id));
    });
  });

  // Math explanation tab switching
  document.querySelectorAll(".calc-math-tabs").forEach((tabs) => {
    tabs.querySelectorAll(".calc-math-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const panel = tabs.closest(".calc-math-panel");
        tabs.querySelectorAll(".calc-math-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        panel.querySelectorAll(".calc-math-content").forEach((c) => {
          c.classList.toggle("hidden", c.dataset.level !== tab.dataset.level);
        });
      });
    });
  });

  // Explore-in-Tutor links
  document.querySelectorAll("[data-calc-prompt]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const prompt = a.dataset.calcPrompt;
      if (window.switchToTab) window.switchToTab("tutor");
      const inp = document.getElementById("tutor-input");
      if (inp) {
        inp.value = prompt;
        if (window.sendTutorQuestion) window.sendTutorQuestion(prompt);
      }
    });
  });

  // =========================================================================
  //  Helper: evaluate chosen function & its derivative
  // =========================================================================
  const FN = {
    x2:   { f: (x) => x * x,             fp: (x) => 2 * x,            label: "x²",       tex: "x^2" },
    x3:   { f: (x) => x * x * x,         fp: (x) => 3 * x * x,       label: "x³",       tex: "x^3" },
    sin:  { f: (x) => Math.sin(x),        fp: (x) => Math.cos(x),     label: "sin(x)",   tex: "\\sin(x)" },
    ex:   { f: (x) => Math.exp(x),        fp: (x) => Math.exp(x),     label: "eˣ",       tex: "e^x" },
    ln:   { f: (x) => Math.log(Math.max(x, 0.001)), fp: (x) => 1 / Math.max(x, 0.001), label: "ln(x)", tex: "\\ln(x)" },
  };

  const RIEMANN_FN = {
    x2:   { f: (x) => x * x,                            label: "x²",              exact: (a, b) => (b ** 3 - a ** 3) / 3 },
    sin:  { f: (x) => Math.sin(x) + 1,                  label: "sin(x)+1",        exact: (a, b) => -Math.cos(b) + Math.cos(a) + (b - a) },
    sqrt: { f: (x) => Math.sqrt(Math.max(x, 0)),        label: "√x",              exact: (a, b) => (2 / 3) * (b ** 1.5 - Math.max(a, 0) ** 1.5) },
    ex:   { f: (x) => Math.exp(-x * x),                 label: "e^(-x²)",         exact: null },
  };

  const AXIS_STYLE = { gridcolor: "#d6d3d1", zerolinecolor: "#a8a29e" };
  function buildPlotLayout(overrides = {}) {
    const { xaxis: xaxisOverrides = {}, yaxis: yaxisOverrides = {}, ...rest } = overrides;
    return {
      margin: { t: 10, r: 10, b: 35, l: 45 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { family: "'EB Garamond', Georgia, serif", color: "#1c1917" },
      ...rest,
      xaxis: { ...AXIS_STYLE, ...xaxisOverrides },
      yaxis: { ...AXIS_STYLE, ...yaxisOverrides },
    };
  }

  const plotConfig = { responsive: true, staticPlot: true };

  // =========================================================================
  //  1  SLOPE EXPLORER
  // =========================================================================
  const slopeFnSel = document.getElementById("slope-fn");
  const slopeXSlider = document.getElementById("slope-x");
  const slopeXVal = document.getElementById("slope-x-val");
  const slopeHSlider = document.getElementById("slope-h");
  const slopeHVal = document.getElementById("slope-h-val");
  const slopeShowSecant = document.getElementById("slope-show-secant");
  const slopePlot = document.getElementById("slope-plot");
  const slopeReadout = document.getElementById("slope-readout");

  function drawSlope() {
    const key = slopeFnSel.value;
    const fn = FN[key];
    const a = parseFloat(slopeXSlider.value);
    const h = parseFloat(slopeHSlider.value);
    slopeXVal.textContent = a.toFixed(2);
    slopeHVal.textContent = h.toFixed(2);

    let xMin = -3.5, xMax = 3.5;
    if (key === "ln") { xMin = 0.05; xMax = 5; }
    if (key === "ex") { xMin = -3; xMax = 2.5; }

    const xs = [], ys = [];
    for (let x = xMin; x <= xMax; x += 0.05) { xs.push(x); ys.push(fn.f(x)); }

    const fa = fn.f(a);
    const slope = fn.fp(a);

    const tangXs = [a - 1.5, a + 1.5];
    const tangYs = tangXs.map((x) => fa + slope * (x - a));

    const traces = [
      { x: xs, y: ys, mode: "lines", line: { color: "#1c1917", width: 2 }, name: fn.label },
      { x: tangXs, y: tangYs, mode: "lines", line: { color: "#b91c1c", width: 2, dash: "dash" }, name: `tangent (slope=${slope.toFixed(3)})` },
      { x: [a], y: [fa], mode: "markers", marker: { color: "#b91c1c", size: 10 }, name: "point" },
    ];

    if (slopeShowSecant.checked) {
      const b = a + h;
      const fb = fn.f(b);
      const secSlope = (fb - fa) / h;
      const secXs = [a - 0.5, b + 0.5];
      const secYs = secXs.map((x) => fa + secSlope * (x - a));
      traces.push(
        { x: secXs, y: secYs, mode: "lines", line: { color: "#4338ca", width: 1.5, dash: "dot" }, name: `secant (Δy/Δx=${secSlope.toFixed(3)})` },
        { x: [b], y: [fb], mode: "markers", marker: { color: "#4338ca", size: 8 }, name: "x+h" }
      );
      slopeReadout.innerHTML =
        `<strong>f(${a.toFixed(2)}) = ${fa.toFixed(4)}</strong> &nbsp;|&nbsp; ` +
        `Tangent slope f′(${a.toFixed(2)}) = <strong>${slope.toFixed(4)}</strong> &nbsp;|&nbsp; ` +
        `Secant slope = <strong>${((fn.f(a + h) - fa) / h).toFixed(4)}</strong> (h=${h.toFixed(2)})`;
    } else {
      slopeReadout.innerHTML =
        `<strong>f(${a.toFixed(2)}) = ${fa.toFixed(4)}</strong> &nbsp;|&nbsp; ` +
        `Tangent slope f′(${a.toFixed(2)}) = <strong>${slope.toFixed(4)}</strong>`;
    }

    Plotly.react(slopePlot, traces, buildPlotLayout({ showlegend: true, legend: { x: 0, y: 1 } }), plotConfig);
  }

  slopeFnSel.addEventListener("change", drawSlope);
  slopeXSlider.addEventListener("input", drawSlope);
  slopeHSlider.addEventListener("input", drawSlope);
  slopeShowSecant.addEventListener("change", drawSlope);

  // Adjust x range for ln(x)
  slopeFnSel.addEventListener("change", () => {
    if (slopeFnSel.value === "ln") {
      slopeXSlider.min = 0.1; slopeXSlider.max = 5;
      if (parseFloat(slopeXSlider.value) <= 0) slopeXSlider.value = 1;
    } else {
      slopeXSlider.min = -3; slopeXSlider.max = 3;
    }
  });

  drawSlope();

  // =========================================================================
  //  2  RIEMANN SUMS
  // =========================================================================
  const riemannFnSel = document.getElementById("riemann-fn");
  const riemannN = document.getElementById("riemann-n");
  const riemannNVal = document.getElementById("riemann-n-val");
  const riemannMethod = document.getElementById("riemann-method");
  const riemannA = document.getElementById("riemann-a");
  const riemannB = document.getElementById("riemann-b");
  const riemannPlot = document.getElementById("riemann-plot");
  const riemannReadout = document.getElementById("riemann-readout");

  function drawRiemann() {
    const key = riemannFnSel.value;
    const fn = RIEMANN_FN[key];
    const n = parseInt(riemannN.value, 10);
    const a = parseFloat(riemannA.value);
    const b = parseFloat(riemannB.value);
    const method = riemannMethod.value;
    riemannNVal.textContent = n;

    const dx = (b - a) / n;
    const curveXs = [], curveYs = [];
    for (let x = a - 0.5; x <= b + 0.5; x += 0.02) { curveXs.push(x); curveYs.push(fn.f(x)); }

    const shapes = [];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const xi = a + i * dx;
      let h;
      if (method === "left") h = fn.f(xi);
      else if (method === "right") h = fn.f(xi + dx);
      else if (method === "mid") h = fn.f(xi + dx / 2);
      else h = (fn.f(xi) + fn.f(xi + dx)) / 2;

      sum += h * dx;
      shapes.push({
        type: "rect", x0: xi, x1: xi + dx, y0: 0, y1: h,
        fillcolor: "rgba(185,28,28,0.25)", line: { color: "#b91c1c", width: 1 },
      });
    }

    const traces = [
      { x: curveXs, y: curveYs, mode: "lines", line: { color: "#1c1917", width: 2.5 }, name: fn.label },
    ];

    let exactStr = "";
    if (fn.exact) {
      const exact = fn.exact(a, b);
      exactStr = ` &nbsp;|&nbsp; Exact integral = <strong>${exact.toFixed(6)}</strong> &nbsp;|&nbsp; Error = ${Math.abs(sum - exact).toFixed(6)}`;
    }

    riemannReadout.innerHTML =
      `Riemann sum (${method}, n=${n}) = <strong>${sum.toFixed(6)}</strong>${exactStr}`;

    Plotly.react(riemannPlot, traces, buildPlotLayout({ shapes, showlegend: false }), plotConfig);
  }

  riemannFnSel.addEventListener("change", drawRiemann);
  riemannN.addEventListener("input", drawRiemann);
  riemannMethod.addEventListener("change", drawRiemann);
  riemannA.addEventListener("change", drawRiemann);
  riemannB.addEventListener("change", drawRiemann);

  drawRiemann();

  // =========================================================================
  //  3  OPTIMIZATION PLAYGROUND
  // =========================================================================
  const optProblem = document.getElementById("opt-problem");
  const optX = document.getElementById("opt-x");
  const optXVal = document.getElementById("opt-x-val");
  const optFindMax = document.getElementById("opt-find-max");
  const optShape = document.getElementById("opt-shape");
  const optGraph = document.getElementById("opt-graph");
  const optReadout = document.getElementById("opt-readout");

  const OPT_PROBLEMS = {
    fence: {
      label: "Max area with 100 m fencing",
      xLabel: "width x (m)",
      yLabel: "Area (m²)",
      xRange: [0.1, 49.9],
      obj: (x) => x * (50 - x),
      objDeriv: (x) => 50 - 2 * x,
      optimal: 25,
      description: (x) => {
        const y = 50 - x;
        const area = x * y;
        return `Rectangle: ${x.toFixed(1)} × ${y.toFixed(1)} m = <strong>${area.toFixed(1)} m²</strong>`;
      },
      drawShape: (x) => {
        const y = 50 - x;
        const maxDim = 50;
        const scaleX = x / maxDim, scaleY = y / maxDim;
        const cx = 0.5, cy = 0.5;
        const x0 = cx - scaleX / 2, x1 = cx + scaleX / 2;
        const y0 = cy - scaleY / 2, y1 = cy + scaleY / 2;
        return [{
          x: [x0, x1, x1, x0, x0],
          y: [y0, y0, y1, y1, y0],
          fill: "toself", fillcolor: "rgba(185,28,28,0.15)",
          line: { color: "#b91c1c", width: 2 },
          mode: "lines", name: "",
        }];
      },
    },
    box: {
      label: "Max volume from 30×30 sheet",
      xLabel: "cut size x (cm)",
      yLabel: "Volume (cm³)",
      xRange: [0.1, 14.9],
      obj: (x) => x * (30 - 2 * x) * (30 - 2 * x),
      objDeriv: (x) => (30 - 2 * x) * (30 - 2 * x) + x * 2 * (30 - 2 * x) * (-2),
      optimal: 5,
      description: (x) => {
        const side = 30 - 2 * x;
        const vol = x * side * side;
        return `Box: ${side.toFixed(1)}×${side.toFixed(1)}×${x.toFixed(1)} cm → Volume = <strong>${vol.toFixed(1)} cm³</strong>`;
      },
      drawShape: (x) => {
        const s = 30 - 2 * x;
        const ns = s / 30, nx = x / 30;
        return [{
          x: [nx, nx + ns, nx + ns, nx, nx],
          y: [nx, nx, nx + ns, nx + ns, nx],
          fill: "toself", fillcolor: "rgba(185,28,28,0.15)",
          line: { color: "#b91c1c", width: 2 },
          mode: "lines", name: "base",
        }, {
          x: [0, 1, 1, 0, 0],
          y: [0, 0, 1, 1, 0],
          line: { color: "#a8a29e", width: 1, dash: "dot" },
          mode: "lines", name: "sheet",
        }];
      },
    },
    can: {
      label: "Min surface area for 1000 cm³",
      xLabel: "radius r (cm)",
      yLabel: "Surface Area (cm²)",
      xRange: [1, 15],
      obj: (r) => 2 * Math.PI * r * r + 2000 / r,
      objDeriv: (r) => 4 * Math.PI * r - 2000 / (r * r),
      optimal: Math.pow(500 / Math.PI, 1 / 3),
      description: (r) => {
        const h = 1000 / (Math.PI * r * r);
        const sa = 2 * Math.PI * r * r + 2 * Math.PI * r * h;
        return `Can: r=${r.toFixed(2)} cm, h=${h.toFixed(2)} cm → SA = <strong>${sa.toFixed(1)} cm²</strong>`;
      },
      drawShape: (r) => {
        const h = 1000 / (Math.PI * r * r);
        const maxR = 15, maxH = 1000 / (Math.PI * 1);
        const nr = r / maxR * 0.4, nh = Math.min(h / maxH, 1) * 0.9;
        const cy = 0.5;
        return [{
          x: [0.5 - nr, 0.5 + nr, 0.5 + nr, 0.5 - nr, 0.5 - nr],
          y: [cy - nh / 2, cy - nh / 2, cy + nh / 2, cy + nh / 2, cy - nh / 2],
          fill: "toself", fillcolor: "rgba(185,28,28,0.15)",
          line: { color: "#b91c1c", width: 2 },
          mode: "lines", name: "",
        }];
      },
    },
  };

  function drawOptimization() {
    const key = optProblem.value;
    const prob = OPT_PROBLEMS[key];
    const x = parseFloat(optX.value);
    optXVal.textContent = x.toFixed(1);

    // Objective function curve
    const xs = [], ys = [];
    for (let t = prob.xRange[0]; t <= prob.xRange[1]; t += 0.1) {
      xs.push(t); ys.push(prob.obj(t));
    }

    const currentY = prob.obj(x);
    const optY = prob.obj(prob.optimal);

    const optH = optGraph.clientHeight || 340;
    Plotly.react(optGraph, [
      { x: xs, y: ys, mode: "lines", line: { color: "#1c1917", width: 2 }, name: prob.yLabel },
      { x: [x], y: [currentY], mode: "markers", marker: { color: "#b91c1c", size: 12 }, name: "current" },
      { x: [prob.optimal], y: [optY], mode: "markers", marker: { color: "#16a34a", size: 10, symbol: "star" }, name: "optimum" },
    ], buildPlotLayout({
      showlegend: false,
      height: optH,
      xaxis: { title: prob.xLabel, range: [prob.xRange[0], prob.xRange[1]], autorange: false },
      yaxis: { title: prob.yLabel, autorange: true },
    }), plotConfig);

    const shapeH = optShape.clientHeight || 340;
    Plotly.react(optShape, prob.drawShape(x), buildPlotLayout({
      showlegend: false,
      height: shapeH,
      xaxis: { visible: false, range: [-0.05, 1.1], autorange: false },
      yaxis: { visible: false, range: [-0.05, 1.1], autorange: false, scaleanchor: "x" },
    }), plotConfig);

    optReadout.innerHTML = prob.description(x) +
      ` &nbsp;|&nbsp; f′(x) = ${prob.objDeriv(x).toFixed(3)} &nbsp;|&nbsp; Optimum at x = ${prob.optimal.toFixed(2)}`;
  }

  optProblem.addEventListener("change", () => {
    const prob = OPT_PROBLEMS[optProblem.value];
    optX.min = prob.xRange[0]; optX.max = prob.xRange[1];
    optX.value = (prob.xRange[0] + prob.xRange[1]) / 2;
    drawOptimization();
  });
  optX.addEventListener("input", drawOptimization);
  optFindMax.addEventListener("click", () => {
    const prob = OPT_PROBLEMS[optProblem.value];
    optX.value = prob.optimal;
    drawOptimization();
  });

  drawOptimization();

  // =========================================================================
  //  4  DIFFERENTIAL EQUATIONS SIMULATOR
  // =========================================================================
  const deModel = document.getElementById("de-model");
  const deParams = document.getElementById("de-params");
  const deRun = document.getElementById("de-run");
  const deReset = document.getElementById("de-reset");
  const dePlot = document.getElementById("de-plot");
  const deReadout = document.getElementById("de-readout");

  const DE_MODELS = {
    growth: {
      label: "Exponential Growth / Decay",
      params: [
        { id: "de-k", label: "k (rate)", min: -2, max: 2, step: 0.1, value: 0.5 },
        { id: "de-y0", label: "y₀", min: 0.1, max: 10, step: 0.1, value: 1 },
      ],
      run: (p, tMax) => {
        const k = p["de-k"], y0 = p["de-y0"];
        const ts = [], ys = [];
        const dt = tMax / 500;
        let y = y0;
        for (let t = 0; t <= tMax; t += dt) {
          ts.push(t); ys.push(y);
          y += k * y * dt;
          if (Math.abs(y) > 1e6) break;
        }
        return [{ x: ts, y: ys, name: "y(t)", line: { color: "#b91c1c", width: 2 } }];
      },
      info: (p) => {
        const k = p["de-k"];
        return `dy/dt = ${k.toFixed(1)}·y → y(t) = ${p["de-y0"].toFixed(1)}·e^(${k.toFixed(1)}t) — ` +
          (k > 0 ? "exponential growth" : k < 0 ? "exponential decay" : "constant");
      },
    },
    logistic: {
      label: "Logistic Growth",
      params: [
        { id: "de-k", label: "r (growth rate)", min: 0.1, max: 3, step: 0.1, value: 1 },
        { id: "de-K", label: "K (carrying capacity)", min: 10, max: 1000, step: 10, value: 100 },
        { id: "de-y0", label: "y₀", min: 1, max: 50, step: 1, value: 5 },
      ],
      run: (p, tMax) => {
        const r = p["de-k"], K = p["de-K"], y0 = p["de-y0"];
        const ts = [], ys = [];
        const dt = tMax / 500;
        let y = y0;
        for (let t = 0; t <= tMax; t += dt) {
          ts.push(t); ys.push(y);
          y += r * y * (1 - y / K) * dt;
        }
        return [
          { x: ts, y: ys, name: "y(t)", line: { color: "#b91c1c", width: 2 } },
          { x: [0, tMax], y: [K, K], name: "K", line: { color: "#a8a29e", width: 1, dash: "dash" } },
        ];
      },
      info: (p) => `dy/dt = ${p["de-k"].toFixed(1)}·y·(1 − y/${p["de-K"].toFixed(0)}) — S-shaped growth, saturates at K=${p["de-K"].toFixed(0)}`,
    },
    predator: {
      label: "Lotka-Volterra",
      params: [
        { id: "de-a", label: "α (prey growth)", min: 0.1, max: 3, step: 0.1, value: 1.1 },
        { id: "de-b", label: "β (predation rate)", min: 0.01, max: 1, step: 0.01, value: 0.4 },
        { id: "de-d", label: "δ (predator growth)", min: 0.01, max: 1, step: 0.01, value: 0.1 },
        { id: "de-g", label: "γ (predator death)", min: 0.1, max: 2, step: 0.1, value: 0.4 },
        { id: "de-x0", label: "Prey₀", min: 1, max: 50, step: 1, value: 10 },
        { id: "de-y0p", label: "Predator₀", min: 1, max: 50, step: 1, value: 5 },
      ],
      run: (p, tMax) => {
        const a = p["de-a"], b = p["de-b"], d = p["de-d"], g = p["de-g"];
        let x = p["de-x0"], y = p["de-y0p"];
        const ts = [], xs = [], ys = [];
        const dt = tMax / 2000;
        for (let t = 0; t <= tMax; t += dt) {
          ts.push(t); xs.push(x); ys.push(y);
          const dx = (a * x - b * x * y) * dt;
          const dy = (d * x * y - g * y) * dt;
          x = Math.max(x + dx, 0);
          y = Math.max(y + dy, 0);
        }
        return [
          { x: ts, y: xs, name: "Prey", line: { color: "#2563eb", width: 2 } },
          { x: ts, y: ys, name: "Predators", line: { color: "#b91c1c", width: 2 } },
        ];
      },
      info: (p) =>
        `dx/dt = ${p["de-a"].toFixed(1)}x − ${p["de-b"].toFixed(2)}xy, ` +
        `dy/dt = ${p["de-d"].toFixed(2)}xy − ${p["de-g"].toFixed(1)}y — populations oscillate`,
    },
    sir: {
      label: "SIR Epidemic",
      params: [
        { id: "de-beta", label: "β (infection rate)", min: 0.01, max: 1, step: 0.01, value: 0.3 },
        { id: "de-gamma", label: "γ (recovery rate)", min: 0.01, max: 0.5, step: 0.01, value: 0.1 },
        { id: "de-N", label: "N (population)", min: 100, max: 10000, step: 100, value: 1000 },
        { id: "de-I0", label: "I₀ (initial infected)", min: 1, max: 100, step: 1, value: 1 },
      ],
      run: (p, tMax) => {
        const beta = p["de-beta"], gamma = p["de-gamma"], N = p["de-N"];
        let S = N - p["de-I0"], I = p["de-I0"], R = 0;
        const ts = [], ss = [], is_ = [], rs = [];
        const dt = tMax / 2000;
        for (let t = 0; t <= tMax; t += dt) {
          ts.push(t); ss.push(S); is_.push(I); rs.push(R);
          const dS = -beta * S * I / N * dt;
          const dI = (beta * S * I / N - gamma * I) * dt;
          const dR = gamma * I * dt;
          S += dS; I += dI; R += dR;
        }
        return [
          { x: ts, y: ss, name: "Susceptible", line: { color: "#2563eb", width: 2 } },
          { x: ts, y: is_, name: "Infected", line: { color: "#b91c1c", width: 2 } },
          { x: ts, y: rs, name: "Recovered", line: { color: "#16a34a", width: 2 } },
        ];
      },
      info: (p) => {
        const r0 = (p["de-beta"] / p["de-gamma"]).toFixed(2);
        return `dS/dt = −βSI/N, dI/dt = βSI/N − γI, dR/dt = γI — R₀ = β/γ = ${r0}` +
          (r0 > 1 ? " (epidemic spreads)" : " (epidemic dies out)");
      },
    },
  };

  function buildDeParams() {
    const model = DE_MODELS[deModel.value];
    deParams.innerHTML = "";
    model.params.forEach((p) => {
      const lbl = document.createElement("label");
      lbl.style.display = "inline-flex";
      lbl.style.alignItems = "center";
      lbl.style.gap = "4px";
      lbl.style.fontSize = "13px";
      const inp = document.createElement("input");
      inp.type = "range"; inp.id = p.id;
      inp.min = p.min; inp.max = p.max; inp.step = p.step; inp.value = p.value;
      inp.style.width = "100px";
      const span = document.createElement("span");
      span.id = p.id + "-val"; span.textContent = p.value;
      inp.addEventListener("input", () => { span.textContent = parseFloat(inp.value).toFixed(2); });
      lbl.textContent = p.label + ": ";
      lbl.appendChild(inp);
      lbl.appendChild(span);
      deParams.appendChild(lbl);
    });
  }

  function runDE() {
    const model = DE_MODELS[deModel.value];
    const p = {};
    model.params.forEach((param) => {
      p[param.id] = parseFloat(document.getElementById(param.id).value);
    });

    const tMax = deModel.value === "sir" ? 200 : 30;
    const traces = model.run(p, tMax);

    Plotly.react(dePlot, traces, buildPlotLayout({
      showlegend: true, legend: { x: 0.7, y: 1 },
      xaxis: { title: "time t" },
      yaxis: { title: "" },
    }), plotConfig);

    deReadout.innerHTML = model.info(p);
  }

  deModel.addEventListener("change", () => { buildDeParams(); runDE(); });
  deRun.addEventListener("click", runDE);
  deReset.addEventListener("click", () => { buildDeParams(); runDE(); });

  buildDeParams();
  runDE();

  // =========================================================================
  //  5  PROJECTILE LAB
  // =========================================================================
  const projAngle = document.getElementById("proj-angle");
  const projAngleVal = document.getElementById("proj-angle-val");
  const projSpeed = document.getElementById("proj-speed");
  const projSpeedVal = document.getElementById("proj-speed-val");
  const projG = document.getElementById("proj-g");
  const projGVal = document.getElementById("proj-g-val");
  const projLaunch = document.getElementById("proj-launch");
  const projReset = document.getElementById("proj-reset");
  const projTrajectory = document.getElementById("proj-trajectory");
  const projGraphs = document.getElementById("proj-graphs");
  const projReadout = document.getElementById("proj-readout");

  let projAnim = null;

  function launchProjectile() {
    if (projAnim) { cancelAnimationFrame(projAnim); projAnim = null; }

    const theta = (parseFloat(projAngle.value) * Math.PI) / 180;
    const v0 = parseFloat(projSpeed.value);
    const g = parseFloat(projG.value);
    projAngleVal.textContent = projAngle.value;
    projSpeedVal.textContent = projSpeed.value;
    projGVal.textContent = projG.value;

    const vx = v0 * Math.cos(theta);
    const vy = v0 * Math.sin(theta);
    const tTotal = (2 * vy) / g;
    const range = vx * tTotal;
    const maxH = (vy * vy) / (2 * g);

    // Full trajectory
    const fullXs = [], fullYs = [];
    const dt = tTotal / 200;
    for (let t = 0; t <= tTotal; t += dt) {
      fullXs.push(vx * t);
      fullYs.push(vy * t - 0.5 * g * t * t);
    }

    // Time series for velocity & acceleration
    const ts = [], vys = [], speeds = [], acs = [];
    for (let t = 0; t <= tTotal; t += dt) {
      ts.push(t);
      const vyt = vy - g * t;
      vys.push(vyt);
      speeds.push(Math.sqrt(vx * vx + vyt * vyt));
      acs.push(-g);
    }

    // Animate the ball along the trajectory
    let frame = 0;
    const totalFrames = fullXs.length;

    function animate() {
      if (frame >= totalFrames) {
        projReadout.innerHTML =
          `Range = <strong>${range.toFixed(2)} m</strong> | Max height = <strong>${maxH.toFixed(2)} m</strong> | Flight time = <strong>${tTotal.toFixed(2)} s</strong>`;
        return;
      }

      const ballX = [fullXs[frame]];
      const ballY = [fullYs[frame]];
      const trailX = fullXs.slice(0, frame + 1);
      const trailY = fullYs.slice(0, frame + 1);

      Plotly.react(projTrajectory, [
        { x: fullXs, y: fullYs, mode: "lines", line: { color: "#d6d3d1", width: 1 }, name: "path" },
        { x: trailX, y: trailY, mode: "lines", line: { color: "#b91c1c", width: 2 }, name: "trail" },
        { x: ballX, y: ballY, mode: "markers", marker: { color: "#b91c1c", size: 12 }, name: "ball" },
      ], buildPlotLayout({
        showlegend: false,
        xaxis: { title: "x (m)", range: [-2, range + 5], autorange: false },
        yaxis: { title: "y (m)", range: [-1, maxH + 5], autorange: false },
      }), plotConfig);

      // Time marker on velocity graph
      const tNow = frame * dt;
      Plotly.react(projGraphs, [
        { x: ts, y: speeds, name: "Speed |v| (m/s)", line: { color: "#2563eb", width: 1.5 } },
        { x: ts, y: vys, name: "Vertical velocity vᵧ (m/s)", line: { color: "#b91c1c", width: 1.5 } },
        { x: ts, y: acs, name: "Gravity aᵧ = −g (m/s²)", line: { color: "#16a34a", width: 1.5, dash: "dot" } },
        { x: [tNow, tNow], y: [-g - 5, v0 + 5], mode: "lines", line: { color: "#a8a29e", width: 1, dash: "dash" }, showlegend: false },
      ], buildPlotLayout({
        showlegend: true, legend: { x: 0, y: 1, font: { size: 10 } },
        xaxis: { title: "time (s)" },
        yaxis: { title: "m/s or m/s²" },
      }), plotConfig);

      frame += 2;
      projAnim = requestAnimationFrame(animate);
    }

    animate();
  }

  projLaunch.addEventListener("click", launchProjectile);
  projReset.addEventListener("click", () => {
    if (projAnim) { cancelAnimationFrame(projAnim); projAnim = null; }
    Plotly.purge(projTrajectory);
    Plotly.purge(projGraphs);
    projReadout.innerHTML = "";
  });

  projAngle.addEventListener("input", () => { projAngleVal.textContent = projAngle.value; });
  projSpeed.addEventListener("input", () => { projSpeedVal.textContent = projSpeed.value; });
  projG.addEventListener("input", () => { projGVal.textContent = projG.value; });

  // =========================================================================
  //  6  ORBITAL MECHANICS — Hohmann Transfer Simulation
  // =========================================================================
  const orbitDest      = document.getElementById("orbit-dest");
  const orbitBoost     = document.getElementById("orbit-boost");
  const orbitBoostVal  = document.getElementById("orbit-boost-val");
  const orbitLaunch    = document.getElementById("orbit-launch");
  const orbitResetBtn  = document.getElementById("orbit-reset");
  const orbitScene     = document.getElementById("orbit-scene");
  const orbitGraphs    = document.getElementById("orbit-graphs");
  const orbitReadout   = document.getElementById("orbit-readout");

  let orbitAnim = null;

  // Physical constants (scaled for visualization — distances in 10⁶ km, times in days)
  const GM_SUN = 1.327e11;  // km³/s²  (Sun's gravitational parameter)
  const AU_KM  = 1.496e8;   // km per AU

  const BODIES = {
    earth: { r_orbit: 1.0,    color: "#2563eb", radius: 0.04, label: "Earth" },
    moon:  { r_orbit: 0.00257, color: "#a8a29e", radius: 0.015, label: "Moon",
             parent: "earth", period_days: 27.3 },
    mars:  { r_orbit: 1.524,  color: "#dc2626", radius: 0.035, label: "Mars" },
  };

  const MISSIONS = {
    moon: {
      label: "Earth → Moon",
      r1: 6571,        // LEO radius (km) — 200 km altitude
      r2: 384400,      // Moon distance (km)
      mu: 3.986e5,     // GM_Earth (km³/s²)
      scaleAU: false,
      viewRange: 5e5,  // km — scene half-width
    },
    mars: {
      label: "Earth → Mars",
      r1: 1.0 * AU_KM,    // Earth orbit (km)
      r2: 1.524 * AU_KM,  // Mars orbit (km)
      mu: GM_SUN,
      scaleAU: true,
      viewRange: 2.5e8,
    },
  };

  function computeHohmann(r1, r2, mu, boostFactor) {
    const a_t = (r1 + r2) / 2;                       // transfer semi-major axis
    const v_circ1  = Math.sqrt(mu / r1);              // circular orbit velocity at r1
    const v_trans1 = Math.sqrt(mu * (2 / r1 - 1 / a_t));  // vis-viva at r1 on transfer
    const v_trans2 = Math.sqrt(mu * (2 / r2 - 1 / a_t));  // vis-viva at r2 on transfer
    const v_circ2  = Math.sqrt(mu / r2);              // circular orbit velocity at r2

    const dv1 = (v_trans1 - v_circ1) * boostFactor;
    const dv2 = v_circ2 - v_trans2;
    const T_transfer = Math.PI * Math.sqrt(a_t * a_t * a_t / mu);  // half-period (seconds)

    return { a_t, v_circ1, v_trans1, v_trans2, v_circ2, dv1, dv2, T_transfer };
  }

  function buildTransferEllipse(r1, r2, nPoints) {
    const a = (r1 + r2) / 2;
    const c = a - r1;  // distance from ellipse center to focus (origin)
    const b = Math.sqrt(a * a - c * c);
    const xs = [], ys = [];
    for (let i = 0; i <= nPoints; i++) {
      const theta = Math.PI * i / nPoints;  // 0 → π (half-ellipse)
      xs.push(a * Math.cos(theta) - c);     // periapsis (r1) at θ=0, apoapsis (-r2) at θ=π
      ys.push(b * Math.sin(theta));
    }
    return { xs, ys };
  }

  function circleTrace(r, color, npts, label, dash) {
    const xs = [], ys = [];
    for (let i = 0; i <= npts; i++) {
      const th = (2 * Math.PI * i) / npts;
      xs.push(r * Math.cos(th));
      ys.push(r * Math.sin(th));
    }
    return {
      x: xs, y: ys, mode: "lines",
      line: { color, width: 1.5, dash: dash || "solid" },
      name: label || "", hoverinfo: "skip",
    };
  }

  function launchOrbital() {
    if (orbitAnim) { cancelAnimationFrame(orbitAnim); orbitAnim = null; }

    const dest = orbitDest.value;
    const boostFactor = parseFloat(orbitBoost.value);
    orbitBoostVal.textContent = boostFactor.toFixed(2);
    const mission = MISSIONS[dest];
    const { r1, r2, mu } = mission;
    const h = computeHohmann(r1, r2, mu, boostFactor);

    // Transfer ellipse geometry
    const transfer = buildTransferEllipse(r1, r2 * boostFactor, 200);

    // Collect time-series for graphs
    const nFrames = 200;
    const totalTime = h.T_transfer * boostFactor;
    const dt = totalTime / nFrames;

    const times = [], velocities = [], accels = [], radii = [];
    const shuttleXs = [], shuttleYs = [];

    for (let i = 0; i <= nFrames; i++) {
      const t = i * dt;
      const frac = t / totalTime;  // 0→1
      const theta = Math.PI * frac;

      // Position on the transfer ellipse (focus at origin)
      const a = (r1 + r2 * boostFactor) / 2;
      const c = a - r1;
      const bAxis = Math.sqrt(Math.max(a * a - c * c, 0));
      const px = a * Math.cos(theta) - c;  // periapsis (r1) at θ=0, apoapsis at θ=π
      const py = bAxis * Math.sin(theta);
      shuttleXs.push(px);
      shuttleYs.push(py);

      const rr = Math.sqrt(px * px + py * py);
      radii.push(rr);

      // Vis-viva: v² = μ(2/r − 1/a)
      const v = Math.sqrt(Math.max(mu * (2 / rr - 1 / a), 0));
      velocities.push(v);

      // Gravitational acceleration: a = GM/r²
      const acc = mu / (rr * rr);
      accels.push(acc);

      times.push(t);
    }

    // Normalize for display
    const vw = mission.viewRange;
    const tDays = times.map(t => t / 86400);
    const vKms = velocities.map(v => v);  // km/s

    // Draw static elements
    const sceneTraces = [];

    if (dest === "moon") {
      sceneTraces.push(circleTrace(r1, "#2563eb33", 100, "LEO", "dot"));
      sceneTraces.push(circleTrace(r2, "#a8a29e55", 100, "Moon orbit", "dash"));
      // Earth at focus (center)
      sceneTraces.push({
        x: [0], y: [0], mode: "markers+text",
        marker: { color: "#2563eb", size: 18 },
        text: ["Earth"], textposition: "bottom center",
        textfont: { size: 11, color: "#2563eb" },
        name: "Earth", showlegend: false,
      });
      // Launch point on LEO (right side, where shuttle departs)
      sceneTraces.push({
        x: [r1], y: [0], mode: "markers+text",
        marker: { color: "#16a34a", size: 8, symbol: "star" },
        text: ["Launch"], textposition: "top right",
        textfont: { size: 9, color: "#16a34a" },
        name: "Launch", showlegend: false,
      });
      // Moon at arrival position (apoapsis = -r2 on x-axis)
      sceneTraces.push({
        x: [-r2], y: [0], mode: "markers+text",
        marker: { color: "#a8a29e", size: 13 },
        text: ["Moon"], textposition: "bottom left",
        textfont: { size: 11, color: "#78716c" },
        name: "Moon", showlegend: false,
      });
    } else {
      // Mars (heliocentric)
      sceneTraces.push(circleTrace(r1, "#2563eb55", 200, "Earth orbit", "dot"));
      sceneTraces.push(circleTrace(r2, "#dc262633", 200, "Mars orbit", "dash"));
      // Sun at focus (center)
      sceneTraces.push({
        x: [0], y: [0], mode: "markers+text",
        marker: { color: "#f59e0b", size: 20 },
        text: ["Sun"], textposition: "bottom center",
        textfont: { size: 11, color: "#f59e0b" },
        name: "Sun", showlegend: false,
      });
      // Earth at departure (periapsis = r1 on positive x-axis)
      sceneTraces.push({
        x: [r1], y: [0], mode: "markers+text",
        marker: { color: "#2563eb", size: 13 },
        text: ["Earth (launch)"], textposition: "bottom right",
        textfont: { size: 10, color: "#2563eb" },
        name: "Earth", showlegend: false,
      });
      // Mars at arrival (apoapsis = -r2 on negative x-axis)
      sceneTraces.push({
        x: [-r2], y: [0], mode: "markers+text",
        marker: { color: "#dc2626", size: 13 },
        text: ["Mars (arrival)"], textposition: "bottom left",
        textfont: { size: 10, color: "#dc2626" },
        name: "Mars", showlegend: false,
      });
    }

    // Transfer orbit path (faded)
    sceneTraces.push({
      x: shuttleXs, y: shuttleYs, mode: "lines",
      line: { color: "#f59e0b", width: 2, dash: "dot" },
      name: "Transfer orbit", hoverinfo: "skip",
    });

    // Animate shuttle
    let frame = 0;

    function animate() {
      if (frame > nFrames) {
        const dvTotal = Math.abs(h.dv1) + Math.abs(h.dv2);
        const tDaysTotal = totalTime / 86400;
        orbitReadout.innerHTML =
          `<strong>${mission.label}</strong> | ` +
          `&Delta;v<sub>1</sub> = ${h.dv1.toFixed(2)} km/s | ` +
          `&Delta;v<sub>2</sub> = ${h.dv2.toFixed(2)} km/s | ` +
          `Total &Delta;v = ${dvTotal.toFixed(2)} km/s | ` +
          `Transfer time = ${tDaysTotal.toFixed(1)} days` +
          (Math.abs(boostFactor - 1) > 0.01
            ? ` | Boost ${boostFactor.toFixed(2)}&times; &mdash; ` +
              (boostFactor > 1 ? "overshoot (faster, higher orbit)" : "undershoot (won&rsquo;t reach target)")
            : " | Optimal Hohmann transfer");
        return;
      }

      // Shuttle marker
      const sx = shuttleXs[frame], sy = shuttleYs[frame];
      const rNow = radii[frame];
      const vNow = velocities[frame];
      const aNow = accels[frame];

      // Build scene with shuttle
      const frameTraces = [...sceneTraces,
        // Trail (drawn first so shuttle renders on top)
        {
          x: shuttleXs.slice(0, frame + 1), y: shuttleYs.slice(0, frame + 1),
          mode: "lines", line: { color: "#f59e0b", width: 2.5 },
          name: "Shuttle path", showlegend: false,
        },
        // Shuttle marker — large dot with glow ring
        {
          x: [sx], y: [sy], mode: "markers",
          marker: { color: "#f59e0b", size: 14, symbol: "circle",
                    line: { color: "#92400e", width: 2 } },
          name: "Shuttle", showlegend: false,
        },
      ];

      const sceneH = orbitScene.clientHeight || 420;
      Plotly.react(orbitScene, frameTraces, buildPlotLayout({
        showlegend: false,
        height: sceneH,
        xaxis: { range: [-vw, vw], autorange: false, scaleanchor: "y",
                 title: dest === "moon" ? "km" : "km (heliocentric)" },
        yaxis: { range: [-vw, vw], autorange: false },
      }), plotConfig);

      // Velocity & acceleration graphs with time marker
      const tNow = tDays[frame];
      const graphH = orbitGraphs.clientHeight || 420;
      Plotly.react(orbitGraphs, [
        { x: tDays, y: vKms, name: "Orbital speed v = √(GM(2/r−1/a))",
          line: { color: "#2563eb", width: 2 } },
        { x: tDays, y: accels, name: "Gravity accel a = GM/r²", yaxis: "y2",
          line: { color: "#dc2626", width: 1.5, dash: "dot" } },
        { x: [tNow, tNow], y: [0, Math.max(...vKms) * 1.1], mode: "lines",
          line: { color: "#a8a29e", width: 1, dash: "dash" }, showlegend: false },
      ], buildPlotLayout({
        showlegend: true, legend: { x: 0, y: 1, font: { size: 10 } },
        height: graphH,
        xaxis: { title: "time (days)" },
        yaxis: { title: "velocity (km/s)", side: "left" },
        yaxis2: { title: "accel (km/s²)", side: "right", overlaying: "y",
                  gridcolor: "transparent" },
      }), plotConfig);

      // Live readout
      orbitReadout.innerHTML =
        `r = <strong>${(rNow).toFixed(0)} km</strong> | ` +
        `v = <strong>${vNow.toFixed(2)} km/s</strong> | ` +
        `a = GM/r&sup2; = <strong>${aNow.toExponential(3)} km/s&sup2;</strong> | ` +
        `t = ${tDays[frame].toFixed(1)} days`;

      frame += 2;
      orbitAnim = requestAnimationFrame(animate);
    }

    animate();
  }

  orbitLaunch.addEventListener("click", launchOrbital);
  orbitResetBtn.addEventListener("click", () => {
    if (orbitAnim) { cancelAnimationFrame(orbitAnim); orbitAnim = null; }
    Plotly.purge(orbitScene);
    Plotly.purge(orbitGraphs);
    orbitReadout.innerHTML = "";
  });
  orbitBoost.addEventListener("input", () => {
    orbitBoostVal.textContent = parseFloat(orbitBoost.value).toFixed(2);
  });

})();
