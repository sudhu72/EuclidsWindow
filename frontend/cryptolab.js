/* =============================================================================
   Cryptology Lab — Interactive games for Caesar cipher, frequency analysis,
   RSA encryption, and Diffie-Hellman key exchange.
   Uses Plotly.js for charts; pure-browser, no backend needed.
   ============================================================================= */

(function () {
  "use strict";

  // =========================================================================
  //  Game selector (same pattern as Calculus Lab)
  // =========================================================================
  const gameBtns = document.querySelectorAll(".crypto-game-btn");
  const gamePanels = document.querySelectorAll(".crypto-game");

  gameBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      gameBtns.forEach((b) => {
        b.classList.remove("active");
        b.className = b.className.replace("btn-primary", "btn-secondary");
      });
      btn.classList.add("active");
      btn.className = btn.className.replace("btn-secondary", "btn-primary");
      const id = btn.dataset.game;
      gamePanels.forEach((p) => p.classList.toggle("active", p.id === "crypto-" + id));
    });
  });

  // Math explanation tab switching (reuse calc-math-tabs within crypto lab)
  document.querySelectorAll("#tab-cryptolab .calc-math-tabs").forEach((tabs) => {
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

  // Explore-in-Tutor links within crypto lab
  document.querySelectorAll("#tab-cryptolab [data-calc-prompt]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const prompt = a.dataset.calcPrompt;
      if (window.switchToTab) window.switchToTab("tutor");
      const inp = document.getElementById("tutor-input");
      if (inp) { inp.value = prompt; inp.dispatchEvent(new Event("input")); }
    });
  });

  const AXIS_STYLE = { gridcolor: "#d6d3d1", zerolinecolor: "#a8a29e" };
  function buildPlotLayout(overrides = {}) {
    const { xaxis: xo = {}, yaxis: yo = {}, ...rest } = overrides;
    return {
      margin: { t: 10, r: 10, b: 35, l: 45 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { family: "'EB Garamond', Georgia, serif", color: "#1c1917" },
      ...rest,
      xaxis: { ...AXIS_STYLE, ...xo },
      yaxis: { ...AXIS_STYLE, ...yo },
    };
  }
  const plotCfg = { responsive: true, staticPlot: true };

  // =========================================================================
  //  1  CAESAR CIPHER  —  with interactive SVG cipher wheel
  // =========================================================================
  const caesarShift = document.getElementById("caesar-shift");
  const caesarShiftVal = document.getElementById("caesar-shift-val");
  const caesarMode = document.getElementById("caesar-mode");
  const caesarInput = document.getElementById("caesar-input");
  const caesarOutput = document.getElementById("caesar-output");
  const caesarAlphabet = document.getElementById("caesar-alphabet");
  const caesarBruteBtn = document.getElementById("caesar-brute");
  const caesarBruteOut = document.getElementById("caesar-brute-output");
  const wheelSVG = document.getElementById("caesar-wheel");
  const wheelLabel = document.getElementById("caesar-wheel-label");

  const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const SVG_NS = "http://www.w3.org/2000/svg";
  const CX = 170, CY = 170;
  const R_OUTER = 155, R_INNER = 112;
  const R_OUTER_TEXT = 137, R_INNER_TEXT = 95;
  const R_DIVIDER = 133;

  let wheelHighlight = -1;

  function svgEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    return el;
  }

  function buildWheel() {
    wheelSVG.innerHTML = "";

    // Outer ring background
    wheelSVG.appendChild(svgEl("circle", {
      cx: CX, cy: CY, r: R_OUTER,
      fill: "#fafaf9", stroke: "#1c1917", "stroke-width": 2.5,
    }));
    // Divider circle
    wheelSVG.appendChild(svgEl("circle", {
      cx: CX, cy: CY, r: R_DIVIDER,
      fill: "none", stroke: "#d6d3d1", "stroke-width": 1,
    }));
    // Inner ring background
    wheelSVG.appendChild(svgEl("circle", {
      cx: CX, cy: CY, r: R_INNER,
      fill: "#fef3c7", stroke: "#1c1917", "stroke-width": 2,
    }));
    // Center hub
    wheelSVG.appendChild(svgEl("circle", {
      cx: CX, cy: CY, r: 30,
      fill: "#1c1917", stroke: "none",
    }));

    // Center label group (shift number)
    const hubText = svgEl("text", {
      x: CX, y: CY + 1, "text-anchor": "middle", "dominant-baseline": "central",
      fill: "#fafaf9", "font-size": "20", "font-weight": "700",
      "font-family": "'EB Garamond', Georgia, serif",
      id: "wheel-hub-text",
    });
    hubText.textContent = "k=3";
    wheelSVG.appendChild(hubText);

    // Tick marks + outer letters
    for (let i = 0; i < 26; i++) {
      const angle = (i * 360 / 26) - 90;
      const rad = angle * Math.PI / 180;

      // Tick mark on outer ring
      const x1 = CX + R_OUTER * Math.cos(rad);
      const y1 = CY + R_OUTER * Math.sin(rad);
      const x2 = CX + (R_OUTER - 8) * Math.cos(rad);
      const y2 = CY + (R_OUTER - 8) * Math.sin(rad);
      wheelSVG.appendChild(svgEl("line", {
        x1, y1, x2, y2, stroke: "#a8a29e", "stroke-width": 1,
      }));

      // Outer (plain) letter
      const ox = CX + R_OUTER_TEXT * Math.cos(rad);
      const oy = CY + R_OUTER_TEXT * Math.sin(rad);
      const outerLetter = svgEl("text", {
        x: ox, y: oy, "text-anchor": "middle", "dominant-baseline": "central",
        fill: "#1c1917", "font-size": "14", "font-weight": "600",
        "font-family": "monospace", class: "wheel-outer-letter",
        "data-index": i, style: "cursor:pointer;",
      });
      outerLetter.textContent = ALPHA[i];
      wheelSVG.appendChild(outerLetter);
    }

    // Inner ring group (will be rotated)
    const innerGroup = svgEl("g", { id: "wheel-inner-ring" });
    for (let i = 0; i < 26; i++) {
      const angle = (i * 360 / 26) - 90;
      const rad = angle * Math.PI / 180;

      const ix = CX + R_INNER_TEXT * Math.cos(rad);
      const iy = CY + R_INNER_TEXT * Math.sin(rad);
      const innerLetter = svgEl("text", {
        x: ix, y: iy, "text-anchor": "middle", "dominant-baseline": "central",
        fill: "#92400e", "font-size": "13", "font-weight": "700",
        "font-family": "monospace", class: "wheel-inner-letter",
        "data-index": i,
      });
      innerLetter.textContent = ALPHA[i];
      innerGroup.appendChild(innerLetter);
    }
    wheelSVG.appendChild(innerGroup);

    // Highlight elements (drawn last to be on top)
    // Outer highlight wedge
    wheelSVG.appendChild(svgEl("path", {
      id: "wheel-highlight-outer", d: "M0,0", fill: "rgba(37,99,235,0.15)",
      stroke: "#2563eb", "stroke-width": 1.5, "pointer-events": "none",
    }));
    // Inner highlight wedge
    wheelSVG.appendChild(svgEl("path", {
      id: "wheel-highlight-inner", d: "M0,0", fill: "rgba(185,28,28,0.15)",
      stroke: "#b91c1c", "stroke-width": 1.5, "pointer-events": "none",
    }));
    // Arrow connector
    wheelSVG.appendChild(svgEl("line", {
      id: "wheel-arrow", x1: 0, y1: 0, x2: 0, y2: 0,
      stroke: "#16a34a", "stroke-width": 2.5, "stroke-dasharray": "4,3",
      "marker-end": "url(#arrowhead)", "pointer-events": "none",
      opacity: 0,
    }));

    // Arrow marker definition
    const defs = svgEl("defs", {});
    const marker = svgEl("marker", {
      id: "arrowhead", markerWidth: 8, markerHeight: 6,
      refX: 8, refY: 3, orient: "auto", fill: "#16a34a",
    });
    marker.appendChild(svgEl("polygon", { points: "0 0, 8 3, 0 6" }));
    defs.appendChild(marker);
    wheelSVG.appendChild(defs);

    // Click handler for letters
    wheelSVG.addEventListener("click", (e) => {
      const target = e.target.closest(".wheel-outer-letter");
      if (!target) return;
      const idx = parseInt(target.dataset.index);
      highlightMapping(idx);
    });
  }

  function wedgePath(cx, cy, rInner, rOuter, angleDeg, span) {
    const a1 = (angleDeg - span / 2) * Math.PI / 180;
    const a2 = (angleDeg + span / 2) * Math.PI / 180;
    const x1o = cx + rOuter * Math.cos(a1), y1o = cy + rOuter * Math.sin(a1);
    const x2o = cx + rOuter * Math.cos(a2), y2o = cy + rOuter * Math.sin(a2);
    const x1i = cx + rInner * Math.cos(a2), y1i = cy + rInner * Math.sin(a2);
    const x2i = cx + rInner * Math.cos(a1), y2i = cy + rInner * Math.sin(a1);
    return `M${x1o},${y1o} A${rOuter},${rOuter} 0 0,1 ${x2o},${y2o} ` +
           `L${x1i},${y1i} A${rInner},${rInner} 0 0,0 ${x2i},${y2i} Z`;
  }

  function highlightMapping(plainIdx) {
    wheelHighlight = plainIdx;
    const k = parseInt(caesarShift.value);
    const encrypt = caesarMode.value === "encrypt";
    const effectiveK = encrypt ? k : (26 - k) % 26;
    const cipherIdx = (plainIdx + effectiveK) % 26;

    const outerAngle = (plainIdx * 360 / 26) - 90;
    const innerAngle = (cipherIdx * 360 / 26) - 90;
    const span = 360 / 26;

    // Outer wedge (blue)
    document.getElementById("wheel-highlight-outer")
      .setAttribute("d", wedgePath(CX, CY, R_DIVIDER, R_OUTER, outerAngle, span));
    // Inner wedge (red) — in the rotated coordinate space we need to account for rotation
    // The inner ring is visually rotated, so the wedge needs to be in screen-space
    const innerScreenAngle = innerAngle + effectiveK * (360 / 26);
    document.getElementById("wheel-highlight-inner")
      .setAttribute("d", wedgePath(CX, CY, 30, R_INNER, innerScreenAngle, span));

    // Arrow from outer letter to inner letter
    const outerRad = outerAngle * Math.PI / 180;
    const innerRad = innerScreenAngle * Math.PI / 180;
    const ax1 = CX + (R_DIVIDER - 4) * Math.cos(outerRad);
    const ay1 = CY + (R_DIVIDER - 4) * Math.sin(outerRad);
    const ax2 = CX + (R_INNER + 4) * Math.cos(innerRad);
    const ay2 = CY + (R_INNER + 4) * Math.sin(innerRad);
    const arrow = document.getElementById("wheel-arrow");
    arrow.setAttribute("x1", ax1);
    arrow.setAttribute("y1", ay1);
    arrow.setAttribute("x2", ax2);
    arrow.setAttribute("y2", ay2);
    arrow.setAttribute("opacity", 1);

    wheelLabel.innerHTML =
      `<strong style="color:#2563eb;">${ALPHA[plainIdx]}</strong> (${plainIdx}) → ` +
      `<strong style="color:#b91c1c;">${ALPHA[cipherIdx]}</strong> (${cipherIdx}) &nbsp; ` +
      `<span style="color:#78716c;">= (${plainIdx} ${encrypt ? "+" : "−"} ${k}) mod 26</span>`;
  }

  function clearHighlight() {
    document.getElementById("wheel-highlight-outer").setAttribute("d", "M0,0");
    document.getElementById("wheel-highlight-inner").setAttribute("d", "M0,0");
    document.getElementById("wheel-arrow").setAttribute("opacity", 0);
    wheelHighlight = -1;
    wheelLabel.textContent = "Click any letter on the wheel to see its mapping";
  }

  function updateWheel() {
    const k = parseInt(caesarShift.value);
    const encrypt = caesarMode.value === "encrypt";
    const effectiveK = encrypt ? k : (26 - k) % 26;
    const rotDeg = effectiveK * (360 / 26);

    const inner = document.getElementById("wheel-inner-ring");
    if (inner) {
      inner.style.transition = "transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
      inner.style.transformOrigin = `${CX}px ${CY}px`;
      inner.style.transform = `rotate(${-rotDeg}deg)`;
    }

    const hub = document.getElementById("wheel-hub-text");
    if (hub) hub.textContent = `k=${k}`;

    if (wheelHighlight >= 0) highlightMapping(wheelHighlight);
  }

  function caesarTransform(text, shift, encrypt) {
    const k = encrypt ? shift : (26 - shift) % 26;
    return text.split("").map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) return String.fromCharCode(((code - 65 + k) % 26) + 65);
      if (code >= 97 && code <= 122) return String.fromCharCode(((code - 97 + k) % 26) + 97);
      return ch;
    }).join("");
  }

  function updateCaesar() {
    const k = parseInt(caesarShift.value);
    caesarShiftVal.textContent = k;
    const encrypt = caesarMode.value === "encrypt";
    caesarOutput.value = caesarTransform(caesarInput.value.toUpperCase(), k, encrypt);

    const plain = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const cipher = plain.split("").map((_, i) =>
      String.fromCharCode(((i + (encrypt ? k : (26 - k) % 26)) % 26) + 65)
    ).join("");
    caesarAlphabet.innerHTML =
      `<div>Plain: &nbsp;<span style="letter-spacing:4px;">${plain}</span></div>` +
      `<div>Cipher: <span style="letter-spacing:4px;color:#b91c1c;font-weight:600;">${cipher}</span></div>` +
      `<div style="color:#78716c;font-size:11px;margin-top:4px;">E(x) = (x ${encrypt ? "+" : "−"} ${k}) mod 26</div>`;

    updateWheel();
  }

  caesarShift.addEventListener("input", updateCaesar);
  caesarMode.addEventListener("change", updateCaesar);
  caesarInput.addEventListener("input", updateCaesar);

  caesarBruteBtn.addEventListener("click", () => {
    const text = caesarInput.value.toUpperCase();
    let html = "<strong>Brute-force — all 26 shifts:</strong><br/>";
    for (let k = 0; k < 26; k++) {
      const decrypted = caesarTransform(text, k, false);
      html += `<div>k=${String(k).padStart(2, " ")}: ${decrypted}</div>`;
    }
    caesarBruteOut.innerHTML = html;
    caesarBruteOut.style.display = "block";
  });

  buildWheel();
  updateCaesar();

  // =========================================================================
  //  2  FREQUENCY ANALYSIS
  // =========================================================================
  const freqSample = document.getElementById("freq-sample");
  const freqInput = document.getElementById("freq-input");
  const freqAnalyze = document.getElementById("freq-analyze");
  const freqSuggest = document.getElementById("freq-suggest");
  const freqCipherChart = document.getElementById("freq-cipher-chart");
  const freqEnglishChart = document.getElementById("freq-english-chart");
  const freqReadout = document.getElementById("freq-readout");

  const ENGLISH_FREQ = {
    A:8.167,B:1.492,C:2.782,D:4.253,E:12.702,F:2.228,G:2.015,H:6.094,
    I:6.966,J:0.153,K:0.772,L:4.025,M:2.406,N:6.749,O:7.507,P:1.929,
    Q:0.095,R:5.987,S:6.327,T:9.056,U:2.758,V:0.978,W:2.361,X:0.150,
    Y:1.974,Z:0.074,
  };

  const SAMPLE_TEXTS = {
    caesar: "WKLV LV D VHFUHW PHVVDJH HQFUBSWHG ZLWK D FDHVDU FLSKHU WKH VKLIW LV WKUHH",
    subst: "ZG OCMG ZGKGTOKXGF ZNKIG YZXERVGTY ZNKXG CXG YGBGXCR USHHTG GRGSGHZY NKFFGH CKXUYY ZNK IGYYCKIG",
  };

  freqSample.addEventListener("change", () => {
    if (SAMPLE_TEXTS[freqSample.value]) freqInput.value = SAMPLE_TEXTS[freqSample.value];
  });

  function countFrequencies(text) {
    const counts = {};
    let total = 0;
    for (const ch of text.toUpperCase()) {
      if (ch >= "A" && ch <= "Z") {
        counts[ch] = (counts[ch] || 0) + 1;
        total++;
      }
    }
    const freqs = {};
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      freqs[ch] = total > 0 ? ((counts[ch] || 0) / total) * 100 : 0;
    }
    return { freqs, total };
  }

  function chiSquared(observed, expected) {
    let chi2 = 0;
    for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
      const e = expected[ch];
      const o = observed[ch];
      if (e > 0) chi2 += ((o - e) * (o - e)) / e;
    }
    return chi2;
  }

  function analyzeFrequency() {
    const { freqs, total } = countFrequencies(freqInput.value);
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const cipherVals = letters.map((l) => freqs[l]);
    const englishVals = letters.map((l) => ENGLISH_FREQ[l]);

    Plotly.react(freqCipherChart, [{
      x: letters, y: cipherVals, type: "bar",
      marker: { color: "#b91c1c" }, name: "Ciphertext",
    }], buildPlotLayout({
      showlegend: false,
      xaxis: { title: "Ciphertext letters", tickfont: { size: 10, family: "monospace" } },
      yaxis: { title: "Frequency (%)" },
    }), plotCfg);

    Plotly.react(freqEnglishChart, [{
      x: letters, y: englishVals, type: "bar",
      marker: { color: "#2563eb" }, name: "English",
    }], buildPlotLayout({
      showlegend: false,
      xaxis: { title: "English letter frequency", tickfont: { size: 10, family: "monospace" } },
      yaxis: { title: "Frequency (%)" },
    }), plotCfg);

    const topCipher = letters.slice().sort((a, b) => freqs[b] - freqs[a]).slice(0, 5);
    freqReadout.innerHTML =
      `Analyzed <strong>${total}</strong> letters. ` +
      `Most frequent: <strong>${topCipher.join(", ")}</strong>. ` +
      `In English the top 5 are: <strong>E, T, A, O, I</strong>.`;
  }

  function suggestShift() {
    const { freqs } = countFrequencies(freqInput.value);
    let bestShift = 0, bestChi2 = Infinity;
    for (let k = 0; k < 26; k++) {
      const shifted = {};
      for (const ch of "ABCDEFGHIJKLMNOPQRSTUVWXYZ") {
        const orig = String.fromCharCode(((ch.charCodeAt(0) - 65 - k + 26) % 26) + 65);
        shifted[orig] = freqs[ch];
      }
      const chi2 = chiSquared(shifted, ENGLISH_FREQ);
      if (chi2 < bestChi2) { bestChi2 = chi2; bestShift = k; }
    }
    const decrypted = caesarTransform(freqInput.value.toUpperCase(), bestShift, false);
    freqReadout.innerHTML =
      `<strong>Best shift: k = ${bestShift}</strong> (&chi;&sup2; = ${bestChi2.toFixed(1)})<br/>` +
      `Decrypted: <span style="font-family:monospace;">${decrypted.slice(0, 120)}${decrypted.length > 120 ? "..." : ""}</span>`;
  }

  freqAnalyze.addEventListener("click", analyzeFrequency);
  freqSuggest.addEventListener("click", () => { analyzeFrequency(); suggestShift(); });

  // =========================================================================
  //  3  RSA PLAYGROUND
  // =========================================================================
  const rsaP = document.getElementById("rsa-p");
  const rsaQ = document.getElementById("rsa-q");
  const rsaM = document.getElementById("rsa-m");
  const rsaCompute = document.getElementById("rsa-compute");
  const rsaEncrypt = document.getElementById("rsa-encrypt");
  const rsaKeys = document.getElementById("rsa-keys");
  const rsaSteps = document.getElementById("rsa-steps");

  function isPrime(n) {
    if (n < 2) return false;
    if (n < 4) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  function gcd(a, b) { while (b) { [a, b] = [b, a % b]; } return a; }

  function extGcd(a, b) {
    if (b === 0) return [a, 1, 0];
    const [g, x1, y1] = extGcd(b, a % b);
    return [g, y1, x1 - Math.floor(a / b) * y1];
  }

  function modInverse(e, phi) {
    const [g, x] = extGcd(e, phi);
    if (g !== 1) return null;
    return ((x % phi) + phi) % phi;
  }

  function modPow(base, exp, mod) {
    let result = 1n;
    base = BigInt(base) % BigInt(mod);
    exp = BigInt(exp);
    const m = BigInt(mod);
    while (exp > 0n) {
      if (exp % 2n === 1n) result = (result * base) % m;
      exp = exp / 2n;
      base = (base * base) % m;
    }
    return Number(result);
  }

  let rsaState = {};

  function computeRSA() {
    const p = parseInt(rsaP.value);
    const q = parseInt(rsaQ.value);

    if (!isPrime(p)) { rsaKeys.innerHTML = `<span style="color:#b91c1c;">p = ${p} is not prime!</span>`; return; }
    if (!isPrime(q)) { rsaKeys.innerHTML = `<span style="color:#b91c1c;">q = ${q} is not prime!</span>`; return; }
    if (p === q) { rsaKeys.innerHTML = `<span style="color:#b91c1c;">p and q must be different primes!</span>`; return; }

    const n = p * q;
    const phi = (p - 1) * (q - 1);

    let e = 65537;
    if (gcd(e, phi) !== 1) {
      for (e = 3; e < phi; e += 2) { if (gcd(e, phi) === 1) break; }
    }

    const d = modInverse(e, phi);

    rsaState = { p, q, n, phi, e, d };
    rsaKeys.innerHTML =
      `<strong>Step 1:</strong> n = p &times; q = ${p} &times; ${q} = <strong>${n}</strong><br/>` +
      `<strong>Step 2:</strong> &phi;(n) = (p&minus;1)(q&minus;1) = ${p - 1} &times; ${q - 1} = <strong>${phi}</strong><br/>` +
      `<strong>Step 3:</strong> Choose e = <strong>${e}</strong> (gcd(${e}, ${phi}) = 1 ✓)<br/>` +
      `<strong>Step 4:</strong> d = e<sup>&minus;1</sup> mod &phi;(n) = <strong>${d}</strong> (${e} &times; ${d} mod ${phi} = ${(e * d) % phi} ✓)<br/>` +
      `<br/><span style="color:#2563eb;">Public key: (n=${n}, e=${e})</span> &nbsp;|&nbsp; ` +
      `<span style="color:#b91c1c;">Private key: d=${d}</span>`;
    rsaSteps.style.display = "none";
  }

  function encryptRSA() {
    if (!rsaState.n) { computeRSA(); }
    const { n, e, d } = rsaState;
    const m = parseInt(rsaM.value);

    if (m >= n) {
      rsaSteps.innerHTML = `<span style="color:#b91c1c;">Message m=${m} must be less than n=${n}!</span>`;
      rsaSteps.style.display = "block";
      return;
    }

    const c = modPow(m, e, n);
    const dec = modPow(c, d, n);

    rsaSteps.innerHTML =
      `<strong>Encryption:</strong> c = m<sup>e</sup> mod n = ${m}<sup>${e}</sup> mod ${n} = <strong style="color:#b91c1c;">${c}</strong><br/>` +
      `<strong>Decryption:</strong> m = c<sup>d</sup> mod n = ${c}<sup>${d}</sup> mod ${n} = <strong style="color:#2563eb;">${dec}</strong><br/>` +
      `<br/>${dec === m
        ? '✓ <span style="color:#16a34a;font-weight:600;">Success! Decrypted message matches original.</span>'
        : '✗ <span style="color:#b91c1c;">Mismatch — check your primes.</span>'}` +
      `<br/><span style="color:#78716c;font-size:11px;">This works because m<sup>ed</sup> &equiv; m<sup>1+k&phi;(n)</sup> &equiv; m (mod n) by Euler&rsquo;s theorem.</span>`;
    rsaSteps.style.display = "block";
  }

  rsaCompute.addEventListener("click", computeRSA);
  rsaEncrypt.addEventListener("click", encryptRSA);

  // =========================================================================
  //  4  DIFFIE-HELLMAN KEY EXCHANGE
  // =========================================================================
  const dhP = document.getElementById("dh-p");
  const dhG = document.getElementById("dh-g");
  const dhA = document.getElementById("dh-a");
  const dhB = document.getElementById("dh-b");
  const dhRun = document.getElementById("dh-run");
  const dhAliceSteps = document.getElementById("dh-alice-steps");
  const dhPublicSteps = document.getElementById("dh-public-steps");
  const dhBobSteps = document.getElementById("dh-bob-steps");
  const dhResult = document.getElementById("dh-result");

  function runDH() {
    const p = parseInt(dhP.value);
    const g = parseInt(dhG.value);
    const a = parseInt(dhA.value);
    const b = parseInt(dhB.value);

    if (p < 2) { dhResult.innerHTML = '<span style="color:#b91c1c;">p must be &ge; 2</span>'; return; }

    const A = modPow(g, a, p);  // Alice's public value
    const B = modPow(g, b, p);  // Bob's public value
    const sAlice = modPow(B, a, p);  // Alice computes shared secret
    const sBob = modPow(A, b, p);    // Bob computes shared secret

    dhAliceSteps.innerHTML =
      `Secret: a = <strong>${a}</strong><br/>` +
      `Compute: A = g<sup>a</sup> mod p<br/>` +
      `A = ${g}<sup>${a}</sup> mod ${p}<br/>` +
      `<strong style="color:#2563eb;">A = ${A}</strong> → send to Bob`;

    dhPublicSteps.innerHTML =
      `p = ${p}, g = ${g}<br/>` +
      `<br/>Alice sends: <strong style="color:#2563eb;">A = ${A}</strong><br/>` +
      `Bob sends: <strong style="color:#dc2626;">B = ${B}</strong><br/>` +
      `<br/><span style="color:#78716c;">Eve sees p, g, A, B<br/>but cannot find a or b<br/>(discrete log problem)</span>`;

    dhBobSteps.innerHTML =
      `Secret: b = <strong>${b}</strong><br/>` +
      `Compute: B = g<sup>b</sup> mod p<br/>` +
      `B = ${g}<sup>${b}</sup> mod ${p}<br/>` +
      `<strong style="color:#dc2626;">B = ${B}</strong> → send to Alice`;

    const match = sAlice === sBob;
    dhResult.innerHTML =
      `<strong>Alice&rsquo;s shared secret:</strong> s = B<sup>a</sup> mod p = ${B}<sup>${a}</sup> mod ${p} = <strong style="color:#16a34a;">${sAlice}</strong><br/>` +
      `<strong>Bob&rsquo;s shared secret:</strong>&nbsp;&nbsp; s = A<sup>b</sup> mod p = ${A}<sup>${b}</sup> mod ${p} = <strong style="color:#16a34a;">${sBob}</strong><br/>` +
      (match
        ? `<br/>✓ <span style="color:#16a34a;font-weight:600;">Both computed g<sup>ab</sup> mod p = ${g}<sup>${a}&times;${b}</sup> mod ${p} = ${sAlice}. Shared secret established!</span>`
        : `<br/>✗ <span style="color:#b91c1c;">Mismatch — check parameters.</span>`);
  }

  dhRun.addEventListener("click", runDH);

})();
