/* =============================================================================
   Music & Mathematics Lab — Interactive Games
   Uses Web Audio API for all sound synthesis (no external samples needed)
   ============================================================================= */

(function () {
  "use strict";

  let audioCtx = null;
  const activeOscillators = [];

  function getAudioCtx() {
    if (!audioCtx || audioCtx.state === "closed") {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  function stopAll() {
    activeOscillators.forEach((o) => {
      try { o.stop(); } catch (_) {}
    });
    activeOscillators.length = 0;
  }

  function playTone(freq, duration, delay, type) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
    activeOscillators.push(osc);
    return osc;
  }

  function playClick(delay) {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + 0.06);
    activeOscillators.push(osc);
  }

  // =========================================================================
  // Game tab switching
  // =========================================================================
  document.querySelectorAll(".music-game-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      stopAll();
      document.querySelectorAll(".music-game-btn").forEach((b) => {
        b.classList.remove("active");
        b.className = b.className.replace("btn-primary", "btn-secondary");
      });
      btn.classList.add("active");
      btn.className = btn.className.replace("btn-secondary", "btn-primary");
      document.querySelectorAll(".music-game").forEach((g) => g.classList.remove("active"));
      const target = document.getElementById("game-" + btn.dataset.game);
      if (target) target.classList.add("active");
    });
  });

  // =========================================================================
  // 1. Mozart's Dice Game
  // =========================================================================
  const MOZART_TABLE = [
    [96,22,141,41,105,122,11,30,70,121,26,9,112,49,109,14],
    [32,6,128,63,146,46,134,81,117,39,126,56,174,18,116,83],
    [69,95,158,13,153,55,110,24,66,139,15,132,73,58,145,79],
    [40,17,113,85,161,2,159,100,90,176,7,34,67,160,52,170],
    [148,74,163,45,80,97,36,107,25,143,64,125,76,136,1,93],
    [104,157,27,167,154,68,118,91,138,71,150,29,101,162,23,151],
    [152,60,171,53,99,133,21,127,16,155,57,175,43,168,89,172],
    [119,84,114,50,140,86,169,94,120,88,48,166,51,115,72,111],
    [98,142,42,156,75,129,62,123,65,77,19,82,137,38,149,8],
    [3,87,165,61,135,47,147,33,102,4,31,164,144,59,173,78],
    [54,130,10,103,28,37,106,5,35,20,108,92,12,124,44,131]
  ];

  const NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  function measureToNotes(measureNum) {
    const seed = measureNum * 7 + 3;
    const notes = [];
    for (let i = 0; i < 4; i++) {
      const idx = (seed + i * 13) % 12;
      const octave = 4 + Math.floor((seed + i * 7) % 3);
      notes.push({ name: NOTE_NAMES[idx], freq: 440 * Math.pow(2, (idx - 9 + (octave - 4) * 12) / 12) });
    }
    return notes;
  }

  function rollTwoDice() {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
  }

  const diceRollAll = document.getElementById("dice-roll-all");
  const dicePlay = document.getElementById("dice-play");
  const diceStopBtn = document.getElementById("dice-stop");
  const diceBarsEl = document.getElementById("dice-bars");
  const diceScoreEl = document.getElementById("dice-score");
  const diceStatus = document.getElementById("dice-status");
  let diceResults = [];
  let dicePlayingInterval = null;

  function renderDiceBars() {
    diceBarsEl.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const bar = document.createElement("div");
      bar.className = "dice-bar";
      bar.id = "dice-bar-" + i;
      if (diceResults[i]) {
        bar.innerHTML = `<div class="bar-num">${diceResults[i].measure}</div><div class="bar-roll">dice: ${diceResults[i].roll}</div>`;
      } else {
        bar.innerHTML = `<div class="bar-num">?</div><div class="bar-roll">bar ${i + 1}</div>`;
      }
      diceBarsEl.appendChild(bar);
    }
  }

  if (diceRollAll) {
    renderDiceBars();

    diceRollAll.addEventListener("click", () => {
      diceResults = [];
      const measures = [];
      for (let i = 0; i < 16; i++) {
        const roll = rollTwoDice();
        const row = roll - 2;
        const measure = MOZART_TABLE[row][i];
        diceResults.push({ roll, measure });
        measures.push(measure);
      }
      renderDiceBars();
      diceScoreEl.textContent = "Measures: " + measures.join(" · ");
      dicePlay.disabled = false;
      diceStatus.textContent = "Ready — press Play";
    });

    dicePlay.addEventListener("click", () => {
      if (!diceResults.length) return;
      stopAll();
      dicePlay.disabled = true;
      diceStopBtn.disabled = false;
      let barIdx = 0;
      const tempo = 0.5;

      function playBar() {
        if (barIdx >= 16) {
          clearInterval(dicePlayingInterval);
          dicePlayingInterval = null;
          dicePlay.disabled = false;
          diceStopBtn.disabled = true;
          diceStatus.textContent = "Finished!";
          document.querySelectorAll(".dice-bar").forEach((b) => b.classList.remove("playing"));
          return;
        }
        document.querySelectorAll(".dice-bar").forEach((b) => b.classList.remove("playing"));
        const el = document.getElementById("dice-bar-" + barIdx);
        if (el) el.classList.add("playing");
        diceStatus.textContent = `Playing bar ${barIdx + 1}/16`;

        const notes = measureToNotes(diceResults[barIdx].measure);
        notes.forEach((n, i) => playTone(n.freq, 0.35, i * 0.12, "triangle"));
        barIdx++;
      }

      playBar();
      dicePlayingInterval = setInterval(playBar, tempo * 1000);
    });

    diceStopBtn.addEventListener("click", () => {
      stopAll();
      if (dicePlayingInterval) clearInterval(dicePlayingInterval);
      dicePlayingInterval = null;
      dicePlay.disabled = false;
      diceStopBtn.disabled = true;
      diceStatus.textContent = "Stopped.";
      document.querySelectorAll(".dice-bar").forEach((b) => b.classList.remove("playing"));
    });
  }

  // =========================================================================
  // 2. Harmonic Series Explorer
  // =========================================================================
  const harmFreqInput = document.getElementById("harm-freq");
  const harmPlayFund = document.getElementById("harm-play-fund");
  const harmPlayChord = document.getElementById("harm-play-chord");
  const harmStopBtn = document.getElementById("harm-stop");
  const harmonicsButtons = document.getElementById("harmonics-buttons");
  const harmonicsViz = document.getElementById("harmonics-viz");

  const HARMONIC_LABELS = [
    "1st (fundamental)", "2nd (octave)", "3rd (fifth)", "4th (2nd octave)",
    "5th (major 3rd)", "6th (5th again)", "7th (♭7th)", "8th (3rd octave)",
    "9th (major 2nd)", "10th (major 3rd)", "11th (tritone)", "12th (5th)"
  ];

  function buildHarmonicButtons() {
    if (!harmonicsButtons) return;
    harmonicsButtons.innerHTML = "";
    for (let n = 1; n <= 12; n++) {
      const btn = document.createElement("button");
      btn.className = "harmonic-btn";
      btn.textContent = `H${n}: ${HARMONIC_LABELS[n - 1]}`;
      btn.addEventListener("click", () => {
        const f = parseFloat(harmFreqInput.value) || 220;
        playTone(f * n, 1.5, 0, "sine");
        btn.classList.add("active");
        setTimeout(() => btn.classList.remove("active"), 1500);
        drawHarmonicWave(f, n);
      });
      harmonicsButtons.appendChild(btn);
    }
  }

  function drawHarmonicWave(f, n) {
    if (!harmonicsViz || typeof Plotly === "undefined") return;
    const samples = 500;
    const duration = 2 / f;
    const x = [], y1 = [], y2 = [];
    for (let i = 0; i < samples; i++) {
      const t = (i / samples) * duration;
      x.push(t * 1000);
      y1.push(Math.sin(2 * Math.PI * f * t));
      y2.push(Math.sin(2 * Math.PI * f * n * t));
    }
    Plotly.newPlot(harmonicsViz, [
      { x, y: y1, name: `Fundamental (${f} Hz)`, line: { color: "#1c1917", width: 2 } },
      { x, y: y2, name: `Harmonic ${n} (${f * n} Hz)`, line: { color: "#a8a29e", width: 1.5, dash: "dot" } }
    ], {
      margin: { t: 20, b: 40, l: 40, r: 20 },
      xaxis: { title: "Time (ms)" },
      yaxis: { title: "Amplitude", range: [-1.2, 1.2] },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { family: "Inter, sans-serif", size: 11, color: "#44403c" },
      showlegend: true,
      legend: { x: 0, y: 1.15, orientation: "h" }
    }, { responsive: true, displayModeBar: false });
  }

  if (harmPlayFund) {
    buildHarmonicButtons();

    harmPlayFund.addEventListener("click", () => {
      stopAll();
      const f = parseFloat(harmFreqInput.value) || 220;
      playTone(f, 2, 0, "sine");
      drawHarmonicWave(f, 1);
    });

    harmPlayChord.addEventListener("click", () => {
      stopAll();
      const f = parseFloat(harmFreqInput.value) || 220;
      for (let n = 1; n <= 6; n++) playTone(f * n, 2, 0, "sine");
    });

    harmStopBtn.addEventListener("click", stopAll);
  }

  // =========================================================================
  // 3. Euclidean Rhythms
  // =========================================================================
  function euclideanRhythm(k, n) {
    if (k >= n) return Array(n).fill(1);
    if (k === 0) return Array(n).fill(0);
    let groups = [];
    for (let i = 0; i < n; i++) groups.push(i < k ? [1] : [0]);
    let left = k;
    let right = n - k;
    while (right > 1) {
      const moves = Math.min(left, right);
      for (let i = 0; i < moves; i++) {
        groups[i] = groups[i].concat(groups[groups.length - 1]);
        groups.pop();
      }
      left = moves;
      right = groups.length - moves;
    }
    return groups.flat();
  }

  const KNOWN_RHYTHMS = {
    "3,8": "Cuban Tresillo",
    "5,8": "Cuban Cinquillo",
    "5,16": "Bossa Nova",
    "7,12": "West African Bell",
    "7,16": "Samba",
    "3,4": "Waltz",
    "4,12": "Fandango",
    "2,5": "Khafif-e-ramal (Persian)"
  };

  const euclBeats = document.getElementById("eucl-beats");
  const euclSteps = document.getElementById("eucl-steps");
  const euclBpm = document.getElementById("eucl-bpm");
  const euclGenerate = document.getElementById("eucl-generate");
  const euclPlayBtn = document.getElementById("eucl-play");
  const euclStopBtn = document.getElementById("eucl-stop");
  const euclCircle = document.getElementById("eucl-circle");
  const euclPattern = document.getElementById("eucl-pattern");
  const euclName = document.getElementById("eucl-name");
  let euclCurrent = [];
  let euclInterval = null;

  function drawEuclCircle(pattern, highlightIdx) {
    if (!euclCircle) return;
    const n = pattern.length;
    const r = 100, cx = 130, cy = 130;
    let svg = `<svg width="260" height="260" viewBox="0 0 260 260">`;
    svg += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#d6d3d1" stroke-width="1.5"/>`;
    for (let i = 0; i < n; i++) {
      const angle = (2 * Math.PI * i) / n - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      const isOn = pattern[i] === 1;
      const isPlaying = i === highlightIdx;
      const fill = isPlaying ? "#1c1917" : isOn ? "#57534e" : "#d6d3d1";
      const radius = isOn ? 10 : 5;
      svg += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius}" fill="${fill}" stroke="#1c1917" stroke-width="${isPlaying ? 2 : 1}"/>`;
      if (isOn && i > 0) {
        const prevOnIdx = findPrevOn(pattern, i);
        const pa = (2 * Math.PI * prevOnIdx) / n - Math.PI / 2;
        const px = cx + r * Math.cos(pa);
        const py = cy + r * Math.sin(pa);
        svg += `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#78716c" stroke-width="1" stroke-dasharray="4,3"/>`;
      }
    }
    svg += `</svg>`;
    euclCircle.innerHTML = svg;
  }

  function findPrevOn(pattern, idx) {
    for (let i = idx - 1; i >= 0; i--) { if (pattern[i]) return i; }
    for (let i = pattern.length - 1; i > idx; i--) { if (pattern[i]) return i; }
    return idx;
  }

  if (euclGenerate) {
    euclGenerate.addEventListener("click", () => {
      const k = parseInt(euclBeats.value) || 3;
      const n = parseInt(euclSteps.value) || 8;
      euclCurrent = euclideanRhythm(k, n);
      euclPattern.textContent = euclCurrent.map((b) => (b ? "x" : ".")).join(" ");
      const key = `${k},${n}`;
      euclName.textContent = KNOWN_RHYTHMS[key] ? `Known as: ${KNOWN_RHYTHMS[key]}` : `E(${k},${n})`;
      drawEuclCircle(euclCurrent, -1);
      euclPlayBtn.disabled = false;
    });

    euclPlayBtn.addEventListener("click", () => {
      if (!euclCurrent.length) return;
      stopAll();
      if (euclInterval) clearInterval(euclInterval);
      const bpm = parseInt(euclBpm.value) || 120;
      const stepMs = (60 / bpm) * 1000 / (euclCurrent.length / 4);
      let idx = 0;
      euclPlayBtn.disabled = true;
      euclStopBtn.disabled = false;

      function step() {
        if (idx >= euclCurrent.length * 4) {
          idx = 0;
        }
        const pos = idx % euclCurrent.length;
        drawEuclCircle(euclCurrent, pos);
        if (euclCurrent[pos]) {
          playClick(0);
        }
        idx++;
      }
      step();
      euclInterval = setInterval(step, stepMs);
    });

    euclStopBtn.addEventListener("click", () => {
      stopAll();
      if (euclInterval) clearInterval(euclInterval);
      euclInterval = null;
      euclPlayBtn.disabled = false;
      euclStopBtn.disabled = true;
      drawEuclCircle(euclCurrent, -1);
    });

    euclGenerate.click();
  }

  // =========================================================================
  // 4. Fibonacci Keyboard
  // =========================================================================
  const fibKeyboard = document.getElementById("fib-keyboard");
  const fibPlayMajor = document.getElementById("fib-play-major");
  const fibPlayPentatonic = document.getElementById("fib-play-pentatonic");
  const fibPlayChromatic = document.getElementById("fib-play-chromatic");

  const CHROMATIC = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  const MAJOR_SCALE = [0,2,4,5,7,9,11,12];
  const PENTATONIC = [0,2,4,7,9];
  const BASE_FREQ = 261.63;

  function noteFreq(semitones) {
    return BASE_FREQ * Math.pow(2, semitones / 12);
  }

  function buildKeyboard() {
    if (!fibKeyboard) return;
    fibKeyboard.innerHTML = "";
    for (let i = 0; i <= 12; i++) {
      const name = CHROMATIC[i % 12];
      const isBlack = name.includes("#");
      const key = document.createElement("div");
      key.className = `fib-key ${isBlack ? "black" : "white"}`;
      key.dataset.semitone = i;
      key.textContent = name + (i === 0 || i === 12 ? "4" + (i === 12 ? "→5" : "") : "");
      key.addEventListener("click", () => {
        playTone(noteFreq(i), 0.6, 0, "triangle");
        key.classList.add("playing");
        setTimeout(() => key.classList.remove("playing"), 500);
      });
      fibKeyboard.appendChild(key);
    }
  }

  function playScale(semitones, label) {
    stopAll();
    const keys = fibKeyboard ? fibKeyboard.querySelectorAll(".fib-key") : [];
    semitones.forEach((s, i) => {
      playTone(noteFreq(s), 0.4, i * 0.35, "triangle");
      setTimeout(() => {
        keys.forEach((k) => k.classList.remove("playing"));
        const target = fibKeyboard.querySelector(`[data-semitone="${s}"]`);
        if (target) target.classList.add("playing");
      }, i * 350);
    });
    setTimeout(() => {
      keys.forEach((k) => k.classList.remove("playing"));
    }, semitones.length * 350 + 400);
  }

  if (fibKeyboard) {
    buildKeyboard();

    fibPlayMajor.addEventListener("click", () => playScale(MAJOR_SCALE, "Major"));
    fibPlayPentatonic.addEventListener("click", () => playScale(PENTATONIC, "Pentatonic"));
    fibPlayChromatic.addEventListener("click", () => playScale([...Array(13).keys()], "Chromatic"));
  }

  // =========================================================================
  // 5. Pythagorean Tuning vs Equal Temperament
  // =========================================================================
  const pythBase = document.getElementById("pyth-base");
  const pythPlayPure = document.getElementById("pyth-play-pure");
  const pythPlayEqual = document.getElementById("pyth-play-equal");
  const pythPlayComma = document.getElementById("pyth-play-comma");
  const pythStopBtn = document.getElementById("pyth-stop");
  const pythComparison = document.getElementById("pyth-comparison");

  function showPythComparison() {
    if (!pythComparison) return;
    const f = parseFloat(pythBase.value) || 261.63;
    const pureFifth = f * 3 / 2;
    const equalFifth = f * Math.pow(2, 7 / 12);
    const diff = pureFifth - equalFifth;
    const cents = 1200 * Math.log2(pureFifth / equalFifth);
    const comma = Math.pow(3 / 2, 12) / Math.pow(2, 7);
    const commaCents = 1200 * Math.log2(comma);
    pythComparison.innerHTML = [
      `Base note:          ${f.toFixed(2)} Hz`,
      `Pure fifth (3:2):   ${pureFifth.toFixed(4)} Hz`,
      `Equal-temp fifth:   ${equalFifth.toFixed(4)} Hz`,
      `Difference:         ${diff.toFixed(4)} Hz (${cents.toFixed(2)} cents)`,
      ``,
      `Pythagorean comma:  (3/2)^12 / 2^7 = ${comma.toFixed(6)} (${commaCents.toFixed(2)} cents)`
    ].join("\n");
  }

  if (pythPlayPure) {
    showPythComparison();
    pythBase.addEventListener("input", showPythComparison);

    pythPlayPure.addEventListener("click", () => {
      stopAll();
      const f = parseFloat(pythBase.value) || 261.63;
      playTone(f, 2, 0, "sine");
      playTone(f * 3 / 2, 2, 0, "sine");
      showPythComparison();
    });

    pythPlayEqual.addEventListener("click", () => {
      stopAll();
      const f = parseFloat(pythBase.value) || 261.63;
      playTone(f, 2, 0, "sine");
      playTone(f * Math.pow(2, 7 / 12), 2, 0, "sine");
      showPythComparison();
    });

    pythPlayComma.addEventListener("click", () => {
      stopAll();
      const f = parseFloat(pythBase.value) || 261.63;
      const pure12 = f * Math.pow(3 / 2, 12);
      const octave7 = f * Math.pow(2, 7);
      playTone(pure12 / 16, 3, 0, "sine");
      playTone(octave7 / 16, 3, 0, "sine");
      showPythComparison();
    });

    pythStopBtn.addEventListener("click", stopAll);
  }

  // =========================================================================
  // Cross-links: "Explore in Tutor" buttons at the bottom of each game
  // =========================================================================
  const GAME_TUTOR_PROMPTS = {
    dice: [
      "What is Mozart's Musikalisches Würfelspiel?",
      "How does combinatorics create musical compositions?",
      "Explain the probability behind the two-dice roll distribution"
    ],
    harmonics: [
      "What is the harmonic series and how does it relate to music?",
      "How do frequency ratios create consonance and dissonance?",
      "What is the connection between Fourier analysis and musical timbre?"
    ],
    euclidean: [
      "What are Euclidean rhythms and why do they sound good?",
      "How does modular arithmetic describe rhythmic cycles?",
      "How do polyrhythms relate to least common multiples?"
    ],
    fibonacci: [
      "Where does the Fibonacci sequence appear in musical structure?",
      "How did Bartók use the golden ratio in his compositions?",
      "Why do Fibonacci numbers relate to musical scales?"
    ],
    pythagorean: [
      "What is Pythagorean tuning and how does it use ratios?",
      "Why can't you tune a piano perfectly using pure ratios?",
      "How does equal temperament solve the tuning problem?"
    ]
  };

  function goToTutor(question) {
    if (typeof switchToTab === "function") {
      switchToTab("tutor");
    } else {
      const btn = document.querySelector('[data-tab="tutor"]');
      if (btn) btn.click();
    }
    setTimeout(() => {
      const input = document.getElementById("tutor-input");
      if (input) input.value = question;
      if (typeof sendTutorQuestion === "function") {
        sendTutorQuestion(question);
      }
    }, 150);
  }

  document.querySelectorAll(".music-game").forEach((game) => {
    const gameId = game.id.replace("game-", "");
    const prompts = GAME_TUTOR_PROMPTS[gameId];
    if (!prompts) return;

    const section = document.createElement("div");
    section.className = "music-explore-links";
    section.innerHTML = '<strong>Explore deeper in the Tutor:</strong>';
    const list = document.createElement("div");
    list.className = "music-explore-list";
    prompts.forEach((p) => {
      const link = document.createElement("button");
      link.className = "music-explore-btn";
      link.textContent = p;
      link.addEventListener("click", () => goToTutor(p));
      list.appendChild(link);
    });
    section.appendChild(list);
    game.appendChild(section);
  });
  // =========================================================================
  // "Explore in Tutor" links — bridge Music Lab → Tutor tab
  // =========================================================================
  document.querySelectorAll("[data-music-prompt]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      stopAll();
      const prompt = link.dataset.musicPrompt;
      if (window.switchToTab) {
        window.switchToTab("tutor");
      }
      setTimeout(() => {
        if (window.sendTutorQuestion) {
          window.sendTutorQuestion(prompt);
        }
      }, 250);
    });
  });

})();
