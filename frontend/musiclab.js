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

  // Piano-like synthesizer: layered harmonics with percussive attack and natural decay.
  // Each note uses 4 partials whose amplitudes and decay rates mimic a struck string.
  function playPiano(freq, duration, delay, velocity) {
    const ctx = getAudioCtx();
    const t0 = ctx.currentTime + delay;
    const vel = velocity || 0.18;
    const partials = [
      { ratio: 1,   amp: 1.0,  decay: duration * 1.2 },
      { ratio: 2,   amp: 0.4,  decay: duration * 0.8 },
      { ratio: 3,   amp: 0.15, decay: duration * 0.5 },
      { ratio: 4,   amp: 0.06, decay: duration * 0.35 },
    ];

    const master = ctx.createGain();
    master.gain.value = vel;
    master.connect(ctx.destination);

    for (const p of partials) {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * p.ratio;
      // Percussive envelope: instant attack, fast initial drop, slow release
      env.gain.setValueAtTime(p.amp, t0);
      env.gain.setTargetAtTime(p.amp * 0.4, t0, 0.008);   // hammer strike decay
      env.gain.setTargetAtTime(0.001, t0 + 0.02, p.decay); // string sustain decay
      osc.connect(env).connect(master);
      osc.start(t0);
      osc.stop(t0 + p.decay * 4 + 0.1);
      activeOscillators.push(osc);
    }

    // Hammer noise transient for realism
    const noise = ctx.createBufferSource();
    const noiseLen = Math.ceil(ctx.sampleRate * 0.02);
    const buf = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) data[i] = (Math.random() * 2 - 1) * 0.3;
    noise.buffer = buf;
    const noiseEnv = ctx.createGain();
    noiseEnv.gain.setValueAtTime(vel * 0.5, t0);
    noiseEnv.gain.exponentialRampToValueAtTime(0.001, t0 + 0.015);
    const noiseFilt = ctx.createBiquadFilter();
    noiseFilt.type = "bandpass";
    noiseFilt.frequency.value = Math.min(freq * 4, 8000);
    noiseFilt.Q.value = 1.5;
    noise.connect(noiseFilt).connect(noiseEnv).connect(master);
    noise.start(t0);
    noise.stop(t0 + 0.03);
    activeOscillators.push(noise);
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
  // 1. Mozart's Dice Game — with staff notation & probability visualization
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

  // Harmonic structure for each of the 16 bar positions (C major minuet)
  // Each bar has a harmonic function; melody varies by measure number.
  // Format: { chord: [bass MIDI notes], scale: [treble MIDI notes pool] }
  const BAR_HARMONY = [
    { chord: [48,52,55],  scale: [72,74,76,79,72,67] },   // 1:  C  (I)
    { chord: [48,52,55],  scale: [76,74,72,71,72,74] },   // 2:  C  (I)
    { chord: [53,57,48],  scale: [77,76,74,72,74,76] },   // 3:  F  (IV)
    { chord: [55,59,50],  scale: [79,77,76,74,72,71] },   // 4:  G  (V)
    { chord: [48,52,55],  scale: [72,74,76,77,79,76] },   // 5:  C  (I)
    { chord: [50,53,57],  scale: [74,76,77,79,81,79] },   // 6:  Dm (ii)
    { chord: [55,59,50],  scale: [79,77,76,74,71,67] },   // 7:  G  (V)
    { chord: [48,52,55],  scale: [72,76,79,76,72,67] },   // 8:  C  (I) half cad.
    { chord: [55,59,50],  scale: [67,71,74,71,67,74] },   // 9:  G  (V)
    { chord: [55,59,50],  scale: [79,77,76,74,72,74] },   // 10: G  (V)
    { chord: [48,52,55],  scale: [76,74,72,74,76,79] },   // 11: C  (I)
    { chord: [53,57,48],  scale: [77,76,74,72,77,76] },   // 12: F  (IV)
    { chord: [48,52,55],  scale: [72,76,79,84,79,76] },   // 13: C  (I)
    { chord: [50,53,57],  scale: [74,77,74,72,71,72] },   // 14: Dm (ii)
    { chord: [55,59,50],  scale: [71,74,67,71,74,79] },   // 15: G  (V7)
    { chord: [48,52,55],  scale: [72,76,72,67,72,76] },   // 16: C  (I) final
  ];

  // Convert pitch string like 'c5', 'f#4', 'g2' to MIDI number
  function pitchToMidi(p) {
    const base = {c:0,d:2,e:4,f:5,g:7,a:9,b:11};
    let i = 0;
    const letter = p[i++];
    let semi = base[letter];
    if (p[i] === '#') { semi += 1; i++; }
    const octave = parseInt(p.substring(i));
    return (octave + 1) * 12 + semi;
  }

  // Parse a voice array from MOZART_NOTES into {midi, beat, dur} objects
  function parseVoice(events) {
    let beat = 0;
    const notes = [];
    for (const ev of events) {
      if (typeof ev[0] === 'number') {
        beat += 8 / ev[0];
      } else if (typeof ev[0] === 'string') {
        const dur = 8 / ev[1];
        notes.push({midi: pitchToMidi(ev[0]), beat, dur});
        beat += dur;
      } else if (Array.isArray(ev[0])) {
        const dur = 8 / ev[1];
        for (const p of ev[0]) notes.push({midi: pitchToMidi(p), beat, dur});
        beat += dur;
      }
    }
    return notes;
  }

  // Returns {treble, bass} from authentic Mozart data, or algorithmic fallback
  function measureToMelody(measureNum, barPos) {
    const real = window.MOZART_NOTES && window.MOZART_NOTES[measureNum];
    if (real) {
      return { treble: parseVoice(real.t), bass: parseVoice(real.b) };
    }
    // Algorithmic fallback (only used if mozart_notes.js fails to load)
    const harm = BAR_HARMONY[barPos];
    const seed = measureNum * 17 + barPos * 7;
    const pool = harm.scale;
    const n = pool.length;
    const pt = seed % 5;
    let notes;
    if (pt === 0) {
      notes = [{midi:pool[seed%n],beat:0,dur:1},{midi:pool[(seed+1)%n],beat:1,dur:1},{midi:pool[(seed+2)%n],beat:2,dur:1}];
    } else if (pt === 1) {
      notes = [{midi:pool[seed%n],beat:0,dur:0.5},{midi:pool[(seed+3)%n],beat:0.5,dur:0.5},{midi:pool[(seed+1)%n],beat:1,dur:1},{midi:pool[(seed+4)%n],beat:2,dur:1}];
    } else if (pt === 2) {
      notes = [{midi:pool[(seed+2)%n],beat:0,dur:1},{midi:pool[seed%n],beat:1,dur:0.5},{midi:pool[(seed+1)%n],beat:1.5,dur:0.5},{midi:pool[(seed+3)%n],beat:2,dur:0.5},{midi:pool[(seed+4)%n],beat:2.5,dur:0.5}];
    } else if (pt === 3) {
      notes = [{midi:pool[seed%n],beat:0,dur:2},{midi:pool[(seed+2)%n],beat:2,dur:1}];
    } else {
      notes = [{midi:pool[(seed+1)%n],beat:0,dur:0.5},{midi:pool[(seed+2)%n],beat:0.5,dur:0.5},{midi:pool[(seed+3)%n],beat:1,dur:0.5},{midi:pool[(seed+4)%n],beat:1.5,dur:0.5},{midi:pool[seed%n],beat:2,dur:1}];
    }
    return { treble: notes, bass: [{midi:harm.chord[seed%harm.chord.length],beat:0,dur:1},{midi:harm.chord[(seed+1)%harm.chord.length],beat:1,dur:1},{midi:harm.chord[(seed+2)%harm.chord.length],beat:2,dur:1}] };
  }

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  const MIDI_NOTE_NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
  function midiToName(midi) {
    return MIDI_NOTE_NAMES[midi % 12] + Math.floor(midi / 12 - 1);
  }

  function rollTwoDice() {
    return Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
  }

  // ---------- Staff Notation Renderer (Canvas) ----------
  function drawStaff(canvas, measures) {
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const staffTop = 30;
    const lineGap = 8;
    const staffH = lineGap * 4;
    const trebleTop = staffTop;
    const bassTop = staffTop + staffH + 40;
    const barW = (W - 50) / 8;
    const leftMargin = 42;

    function drawFiveLines(yTop, startX, endX) {
      ctx.strokeStyle = "#a8a29e";
      ctx.lineWidth = 0.8;
      for (let i = 0; i < 5; i++) {
        const y = yTop + i * lineGap;
        ctx.beginPath();
        ctx.moveTo(startX, y);
        ctx.lineTo(endX, y);
        ctx.stroke();
      }
    }

    function drawClef(yTop, isTreble) {
      ctx.font = "bold 12px 'EB Garamond', Georgia, serif";
      ctx.fillStyle = "#1c1917";
      ctx.textAlign = "left";
      if (isTreble) {
        ctx.font = "28px serif";
        ctx.fillText("\uD834\uDD1E", 4, yTop + staffH - 2);
      } else {
        ctx.font = "22px serif";
        ctx.fillText("\uD834\uDD22", 4, yTop + lineGap * 2 + 4);
      }
    }

    function drawTimeSig(yTop) {
      ctx.font = "bold 14px 'EB Garamond', Georgia, serif";
      ctx.fillStyle = "#1c1917";
      ctx.textAlign = "center";
      ctx.fillText("3", 32, yTop + lineGap * 1.5 + 1);
      ctx.fillText("4", 32, yTop + lineGap * 3.5 + 1);
    }

    // midiToStaffY: maps MIDI note to Y position on staff
    // Treble: middle line = B4 (71), bottom line = E4 (64), top line = F5 (77)
    // Bass: middle line = D3 (50), bottom line = G2 (43), top line = A3 (57)
    function midiToStaffY(midi, staffYTop, isTreble) {
      const notePositions = {
        0: 0, 2: 1, 4: 2, 5: 3, 7: 4, 9: 5, 11: 6,
        1: 0.5, 3: 1.5, 6: 3.5, 8: 4.5, 10: 5.5
      };
      const pc = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const posInOctave = notePositions[pc];
      const absPos = octave * 7 + posInOctave;

      let refPos, refY;
      if (isTreble) {
        refPos = 4 * 7 + 2;
        refY = staffYTop + staffH;
      } else {
        refPos = 2 * 7 + 4;
        refY = staffYTop + staffH;
      }
      const y = refY - (absPos - refPos) * (lineGap / 2);
      return y;
    }

    function drawNoteHead(x, y, filled) {
      ctx.fillStyle = "#1c1917";
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(x, y, 4.5, 3.2, -0.3, 0, Math.PI * 2);
      if (filled) ctx.fill(); else ctx.stroke();
    }

    function drawStem(x, y, up) {
      ctx.strokeStyle = "#1c1917";
      ctx.lineWidth = 1;
      ctx.beginPath();
      if (up) {
        ctx.moveTo(x + 4, y);
        ctx.lineTo(x + 4, y - 24);
      } else {
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x - 4, y + 24);
      }
      ctx.stroke();
    }

    function drawLedgerLines(x, y, staffYTop, staffYBottom) {
      ctx.strokeStyle = "#a8a29e";
      ctx.lineWidth = 0.8;
      if (y > staffYBottom + 2) {
        for (let ly = staffYBottom + lineGap; ly <= y + 1; ly += lineGap) {
          ctx.beginPath();
          ctx.moveTo(x - 6, ly);
          ctx.lineTo(x + 6, ly);
          ctx.stroke();
        }
      }
      if (y < staffYTop - 2) {
        for (let ly = staffYTop - lineGap; ly >= y - 1; ly -= lineGap) {
          ctx.beginPath();
          ctx.moveTo(x - 6, ly);
          ctx.lineTo(x + 6, ly);
          ctx.stroke();
        }
      }
    }

    function renderRow(rowMeasures, rowIdx) {
      const yOffset = rowIdx * (staffH * 2 + 70);
      const tTop = trebleTop + yOffset;
      const bTop = bassTop + yOffset;
      const endX = leftMargin + barW * rowMeasures.length;

      drawFiveLines(tTop, 0, endX);
      drawFiveLines(bTop, 0, endX);

      if (rowIdx === 0) {
        drawClef(tTop, true);
        drawClef(bTop, false);
        drawTimeSig(tTop);
        drawTimeSig(bTop);
      } else {
        drawClef(tTop, true);
        drawClef(bTop, false);
      }

      rowMeasures.forEach((m, i) => {
        const barX = leftMargin + i * barW;

        // Bar number
        ctx.font = "9px 'EB Garamond', Georgia, serif";
        ctx.fillStyle = "#a8a29e";
        ctx.textAlign = "center";
        ctx.fillText(String(m.barNum), barX + barW / 2, tTop - 5);

        // Highlight playing bar
        if (m.playing) {
          ctx.fillStyle = "rgba(28,25,23,0.06)";
          ctx.fillRect(barX, tTop - 2, barW, bTop + staffH - tTop + 4);
        }

        // Treble notes
        m.melody.treble.forEach((note) => {
          const nx = barX + 10 + (note.beat / 3) * (barW - 20);
          const ny = midiToStaffY(note.midi, tTop, true);
          const filled = note.dur <= 1;
          drawLedgerLines(nx, ny, tTop, tTop + staffH);
          drawNoteHead(nx, ny, filled);
          const up = ny > tTop + staffH / 2;
          drawStem(nx, ny, up);
        });

        // Bass notes
        m.melody.bass.forEach((note) => {
          const nx = barX + 10 + (note.beat / 3) * (barW - 20);
          const ny = midiToStaffY(note.midi, bTop, false);
          const filled = note.dur <= 1;
          drawLedgerLines(nx, ny, bTop, bTop + staffH);
          drawNoteHead(nx, ny, filled);
          const up = ny > bTop + staffH / 2;
          drawStem(nx, ny, up);
        });

        // Barline
        ctx.strokeStyle = "#78716c";
        ctx.lineWidth = (i === rowMeasures.length - 1) ? 2 : 0.8;
        const bx = barX + barW;
        ctx.beginPath();
        ctx.moveTo(bx, tTop);
        ctx.lineTo(bx, tTop + staffH);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bx, bTop);
        ctx.lineTo(bx, bTop + staffH);
        ctx.stroke();
      });
    }

    const row1 = measures.slice(0, 8);
    const row2 = measures.slice(8, 16);
    renderRow(row1, 0);
    renderRow(row2, 1);
  }

  // ---------- Dice Probability Chart ----------
  function drawDiceProbChart() {
    const el = document.getElementById("dice-prob-viz");
    if (!el || typeof Plotly === "undefined") return;

    const sums = [];
    const probs = [];
    const ways = [1,2,3,4,5,6,5,4,3,2,1];
    for (let i = 0; i < 11; i++) {
      sums.push(i + 2);
      probs.push((ways[i] / 36 * 100));
    }

    Plotly.newPlot(el, [{
      x: sums, y: probs, type: "bar",
      marker: { color: sums.map(s => s >= 6 && s <= 8 ? "#1c1917" : "#a8a29e") },
      text: probs.map(p => p.toFixed(1) + "%"),
      textposition: "outside",
      textfont: { size: 10 },
    }], {
      margin: { t: 10, r: 5, b: 35, l: 35 },
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: { family: "'EB Garamond', Georgia, serif", size: 11, color: "#1c1917" },
      xaxis: { title: "Dice Sum", dtick: 1, gridcolor: "#e7e5e4" },
      yaxis: { title: "Probability %", gridcolor: "#e7e5e4", range: [0, 20] },
      bargap: 0.3,
    }, { responsive: true, displayModeBar: false });
  }

  // ---------- Mini Mozart Table ----------
  function buildMiniTable(results) {
    const el = document.getElementById("dice-table-mini");
    if (!el) return;
    let html = "<table><tr><th>Roll</th>";
    for (let c = 1; c <= 16; c++) html += `<th>${c}</th>`;
    html += "</tr>";
    for (let r = 0; r < 11; r++) {
      html += `<tr><th>${r + 2}</th>`;
      for (let c = 0; c < 16; c++) {
        const m = MOZART_TABLE[r][c];
        const isSelected = results[c] && results[c].roll - 2 === r;
        html += `<td${isSelected ? ' class="hl"' : ""}>${m}</td>`;
      }
      html += "</tr>";
    }
    html += "</table>";
    el.innerHTML = html;
  }

  // ---------- Main dice game logic ----------
  const diceRollAll = document.getElementById("dice-roll-all");
  const dicePlay = document.getElementById("dice-play");
  const diceStopBtn = document.getElementById("dice-stop");
  const diceBarsEl = document.getElementById("dice-bars");
  const diceScoreEl = document.getElementById("dice-score");
  const diceStatus = document.getElementById("dice-status");
  const staffCanvas = document.getElementById("dice-staff-canvas");
  let diceResults = [];
  let dicePlayingInterval = null;

  function renderDiceBars() {
    if (!diceBarsEl) return;
    diceBarsEl.innerHTML = "";
    for (let i = 0; i < 16; i++) {
      const bar = document.createElement("div");
      bar.className = "dice-bar";
      bar.id = "dice-bar-" + i;
      if (diceResults[i]) {
        bar.innerHTML = `<div class="bar-num">${diceResults[i].measure}</div><div class="bar-roll">&#9856; ${diceResults[i].roll}</div>`;
      } else {
        bar.innerHTML = `<div class="bar-num">?</div><div class="bar-roll">bar ${i + 1}</div>`;
      }
      diceBarsEl.appendChild(bar);
    }
  }

  function getStaffMeasures(playingIdx) {
    return diceResults.map((d, i) => ({
      barNum: i + 1,
      measure: d.measure,
      melody: measureToMelody(d.measure, i),
      playing: i === playingIdx,
    }));
  }

  // Pre-rolled example: a curated set of dice rolls that produces a pleasant minuet.
  // Rolls favour sums 7-9 (the most probable), matching how a real game would likely go.
  const EXAMPLE_ROLLS = [7, 9, 6, 8, 7, 5, 8, 7, 9, 6, 7, 8, 7, 9, 8, 7];

  function loadDiceExample() {
    diceResults = [];
    const measures = [];
    for (let i = 0; i < 16; i++) {
      const roll = EXAMPLE_ROLLS[i];
      const row = roll - 2;
      const measure = MOZART_TABLE[row][i];
      diceResults.push({ roll, measure });
      measures.push(measure);
    }
    renderDiceBars();
    buildMiniTable(diceResults);
    diceScoreEl.textContent = "Example — Measures: " + measures.join(" · ");
    dicePlay.disabled = false;
    diceStatus.textContent = "Example loaded — press Play Minuet to listen";
    drawStaff(staffCanvas, getStaffMeasures(-1));
  }

  const diceExampleBtn = document.getElementById("dice-example");
  if (diceExampleBtn) {
    diceExampleBtn.addEventListener("click", () => {
      stopAll();
      loadDiceExample();
      setTimeout(() => { if (dicePlay && !dicePlay.disabled) dicePlay.click(); }, 150);
    });
  }

  if (diceRollAll) {
    renderDiceBars();
    drawDiceProbChart();
    buildMiniTable([]);

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
      buildMiniTable(diceResults);
      diceScoreEl.textContent = "Measures: " + measures.join(" · ");
      dicePlay.disabled = false;
      diceStatus.textContent = "Ready — press Play Minuet";
      drawStaff(staffCanvas, getStaffMeasures(-1));
    });

    dicePlay.addEventListener("click", () => {
      if (!diceResults.length) return;
      stopAll();
      dicePlay.disabled = true;
      diceStopBtn.disabled = false;
      let barIdx = 0;
      const beatDur = 0.28;
      const barDur = beatDur * 3 + 0.15;

      function playBar() {
        if (barIdx >= 16) {
          clearInterval(dicePlayingInterval);
          dicePlayingInterval = null;
          dicePlay.disabled = false;
          diceStopBtn.disabled = true;
          diceStatus.textContent = "Finished!";
          document.querySelectorAll(".dice-bar").forEach((b) => b.classList.remove("playing"));
          drawStaff(staffCanvas, getStaffMeasures(-1));
          return;
        }
        document.querySelectorAll(".dice-bar").forEach((b) => b.classList.remove("playing"));
        const el = document.getElementById("dice-bar-" + barIdx);
        if (el) el.classList.add("playing");
        diceStatus.textContent = `Playing bar ${barIdx + 1}/16 (measure ${diceResults[barIdx].measure})`;
        drawStaff(staffCanvas, getStaffMeasures(barIdx));

        const melody = measureToMelody(diceResults[barIdx].measure, barIdx);

        melody.treble.forEach((note) => {
          playPiano(midiToFreq(note.midi), note.dur * beatDur * 1.2, note.beat * beatDur, 0.18);
        });
        melody.bass.forEach((note) => {
          playPiano(midiToFreq(note.midi), note.dur * beatDur * 1.5, note.beat * beatDur, 0.10);
        });

        barIdx++;
      }

      playBar();
      dicePlayingInterval = setInterval(playBar, barDur * 1000);
    });

    diceStopBtn.addEventListener("click", () => {
      stopAll();
      if (dicePlayingInterval) clearInterval(dicePlayingInterval);
      dicePlayingInterval = null;
      dicePlay.disabled = false;
      diceStopBtn.disabled = true;
      diceStatus.textContent = "Stopped.";
      document.querySelectorAll(".dice-bar").forEach((b) => b.classList.remove("playing"));
      if (diceResults.length) drawStaff(staffCanvas, getStaffMeasures(-1));
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
