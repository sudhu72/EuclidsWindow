/* =============================================================================
   FFT Lab — Record, Decompose, Edit, Reconstruct
   Pure browser implementation using Web Audio API + Cooley-Tukey FFT
   ============================================================================= */

(function () {
  "use strict";

  // =========================================================================
  // Cooley-Tukey Radix-2 FFT / IFFT
  // =========================================================================
  function fft(re, im) {
    const N = re.length;
    if (N <= 1) return;
    if (N & (N - 1)) throw new Error("FFT size must be a power of 2");

    // Bit-reversal permutation
    for (let i = 1, j = 0; i < N; i++) {
      let bit = N >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        [re[i], re[j]] = [re[j], re[i]];
        [im[i], im[j]] = [im[j], im[i]];
      }
    }

    // Butterfly passes
    for (let len = 2; len <= N; len <<= 1) {
      const angle = -2 * Math.PI / len;
      const wRe = Math.cos(angle), wIm = Math.sin(angle);
      for (let i = 0; i < N; i += len) {
        let curRe = 1, curIm = 0;
        for (let j = 0; j < len / 2; j++) {
          const a = i + j, b = i + j + len / 2;
          const tRe = curRe * re[b] - curIm * im[b];
          const tIm = curRe * im[b] + curIm * re[b];
          re[b] = re[a] - tRe;
          im[b] = im[a] - tIm;
          re[a] += tRe;
          im[a] += tIm;
          const tmp = curRe * wRe - curIm * wIm;
          curIm = curRe * wIm + curIm * wRe;
          curRe = tmp;
        }
      }
    }
  }

  function ifft(re, im) {
    const N = re.length;
    for (let i = 0; i < N; i++) im[i] = -im[i];
    fft(re, im);
    for (let i = 0; i < N; i++) { re[i] /= N; im[i] = -im[i] / N; }
  }

  function nextPow2(n) {
    let p = 1;
    while (p < n) p <<= 1;
    return p;
  }

  // =========================================================================
  // State
  // =========================================================================
  let audioCtx = null;
  let rawSamples = null;   // Float32Array of original PCM
  let sampleRate = 44100;
  let fftRe = null;        // frequency domain (real)
  let fftIm = null;        // frequency domain (imag)
  let fftSize = 0;
  let bandGains = [];      // per-band gain multipliers [0..1]
  let playingSource = null;

  const NUM_BANDS = 10;
  const BAND_EDGES = [0, 100, 200, 400, 800, 1600, 3200, 6400, 10000, 16000, 22050];

  function getAudioCtx() {
    if (!audioCtx || audioCtx.state === "closed")
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === "suspended") audioCtx.resume();
    return audioCtx;
  }

  // =========================================================================
  // DOM refs
  // =========================================================================
  const btnRecord = document.getElementById("fft-record");
  const btnStopRec = document.getElementById("fft-stop-rec");
  const btnLoadSample = document.getElementById("fft-load-sample");
  const recStatus = document.getElementById("fft-rec-status");
  const waveformDiv = document.getElementById("fft-waveform");
  const btnAnalyze = document.getElementById("fft-analyze");
  const analyzeStatus = document.getElementById("fft-analyze-status");
  const spectrumDiv = document.getElementById("fft-spectrum");
  const editorDiv = document.getElementById("fft-editor");
  const bandControlsDiv = document.getElementById("fft-band-controls");
  const btnResetFilter = document.getElementById("fft-reset-filter");
  const btnReconstruct = document.getElementById("fft-reconstruct");
  const btnPlayOrig = document.getElementById("fft-play-original");
  const btnPlayMod = document.getElementById("fft-play-modified");
  const btnStopPlay = document.getElementById("fft-stop-play");
  const reconstructedDiv = document.getElementById("fft-reconstructed");

  if (!btnRecord) return; // not on this page

  // =========================================================================
  // Math tab switching (per-step)
  // =========================================================================
  document.querySelectorAll(".fft-math-tabs").forEach((tabBar) => {
    tabBar.querySelectorAll(".fft-math-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const panel = tabBar.closest(".fft-math-panel");
        const step = panel.querySelector(".fft-math-content").dataset.step;
        tabBar.querySelectorAll(".fft-math-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        panel.querySelectorAll(".fft-math-content").forEach((c) => {
          c.classList.toggle("hidden", c.dataset.level !== tab.dataset.level);
        });
      });
    });
  });

  // =========================================================================
  // Step 1: Record / Load
  // =========================================================================
  let mediaRecorder = null;
  let audioChunks = [];

  btnRecord.addEventListener("click", async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size) audioChunks.push(e.data); };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        await decodeBlob(blob);
      };
      mediaRecorder.start();
      btnRecord.disabled = true;
      btnStopRec.disabled = false;
      recStatus.textContent = "Recording...";
    } catch (err) {
      recStatus.textContent = "Microphone access denied.";
    }
  });

  btnStopRec.addEventListener("click", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      btnRecord.disabled = false;
      btnStopRec.disabled = true;
      recStatus.textContent = "Processing...";
    }
  });

  btnLoadSample.addEventListener("click", () => {
    const ctx = getAudioCtx();
    sampleRate = ctx.sampleRate;
    const dur = 2;
    const N = sampleRate * dur;
    const samples = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const t = i / sampleRate;
      samples[i] =
        0.4 * Math.sin(2 * Math.PI * 261.63 * t) +  // C4
        0.25 * Math.sin(2 * Math.PI * 329.63 * t) +  // E4
        0.2 * Math.sin(2 * Math.PI * 392.00 * t) +   // G4
        0.1 * Math.sin(2 * Math.PI * 1000 * t) +     // 1 kHz
        0.05 * (Math.random() * 2 - 1);              // noise
    }
    loadSamples(samples);
    recStatus.textContent = "Sample: C major chord + 1kHz tone + noise (2s)";
  });

  async function decodeBlob(blob) {
    const ctx = getAudioCtx();
    const buf = await blob.arrayBuffer();
    const audioBuf = await ctx.decodeAudioData(buf);
    sampleRate = audioBuf.sampleRate;
    loadSamples(audioBuf.getChannelData(0));
    recStatus.textContent = `Loaded ${audioBuf.duration.toFixed(1)}s @ ${sampleRate} Hz`;
  }

  function loadSamples(samples) {
    rawSamples = new Float32Array(samples);
    fftRe = null;
    fftIm = null;
    btnAnalyze.disabled = false;
    btnPlayOrig.disabled = false;
    btnReconstruct.disabled = true;
    btnPlayMod.disabled = true;
    btnResetFilter.disabled = true;
    plotWaveform(rawSamples, waveformDiv, "Original Waveform");
  }

  // =========================================================================
  // Step 2: Forward FFT
  // =========================================================================
  btnAnalyze.addEventListener("click", () => {
    if (!rawSamples) return;
    analyzeStatus.textContent = "Computing FFT...";

    fftSize = nextPow2(rawSamples.length);
    fftRe = new Float64Array(fftSize);
    fftIm = new Float64Array(fftSize);
    for (let i = 0; i < rawSamples.length; i++) fftRe[i] = rawSamples[i];

    fft(fftRe, fftIm);

    analyzeStatus.textContent = `FFT complete — ${fftSize} bins (${(fftSize / 2).toLocaleString()} unique frequencies)`;
    plotSpectrum(fftRe, fftIm, spectrumDiv, "Frequency Spectrum (Magnitude)");
    buildBandControls();
    updateEditorPlot();
    btnReconstruct.disabled = false;
    btnResetFilter.disabled = false;
  });

  // =========================================================================
  // Step 3: Frequency band editor
  // =========================================================================
  function buildBandControls() {
    bandGains = Array(NUM_BANDS).fill(1.0);
    bandControlsDiv.innerHTML = "";
    for (let b = 0; b < NUM_BANDS; b++) {
      const lo = BAND_EDGES[b], hi = BAND_EDGES[b + 1];
      const div = document.createElement("div");
      div.className = "fft-band";
      div.innerHTML =
        `<label>Band ${b + 1}</label>` +
        `<input type="range" min="0" max="100" value="100" data-band="${b}" />` +
        `<span class="fft-band-hz">${lo >= 1000 ? (lo / 1000) + "k" : lo}–${hi >= 1000 ? (hi / 1000) + "k" : hi} Hz</span>`;
      div.querySelector("input").addEventListener("input", (e) => {
        bandGains[b] = parseInt(e.target.value) / 100;
        updateEditorPlot();
      });
      bandControlsDiv.appendChild(div);
    }
  }

  function getFilteredSpectrum() {
    const re = new Float64Array(fftRe);
    const im = new Float64Array(fftIm);
    const freqPerBin = sampleRate / fftSize;
    const half = fftSize / 2;

    for (let k = 0; k <= half; k++) {
      const freq = k * freqPerBin;
      let gain = 1.0;
      for (let b = 0; b < NUM_BANDS; b++) {
        if (freq >= BAND_EDGES[b] && freq < BAND_EDGES[b + 1]) {
          gain = bandGains[b];
          break;
        }
      }
      re[k] *= gain;
      im[k] *= gain;
      if (k > 0 && k < half) {
        re[fftSize - k] *= gain;
        im[fftSize - k] *= gain;
      }
    }
    return { re, im };
  }

  function updateEditorPlot() {
    if (!fftRe) return;
    const { re, im } = getFilteredSpectrum();
    plotSpectrum(re, im, editorDiv, "Edited Spectrum (adjust sliders above)");
  }

  btnResetFilter.addEventListener("click", () => {
    bandGains = Array(NUM_BANDS).fill(1.0);
    bandControlsDiv.querySelectorAll("input[type=range]").forEach((s) => (s.value = 100));
    updateEditorPlot();
  });

  // =========================================================================
  // Step 4: Inverse FFT + Playback
  // =========================================================================
  btnReconstruct.addEventListener("click", () => {
    if (!fftRe) return;
    const { re, im } = getFilteredSpectrum();
    ifft(re, im);
    const modified = new Float32Array(rawSamples.length);
    for (let i = 0; i < modified.length; i++) modified[i] = re[i];
    plotWaveform(modified, reconstructedDiv, "Reconstructed Waveform");
    btnPlayMod.disabled = false;
    btnPlayMod._samples = modified;
  });

  function playSamples(samples) {
    stopPlayback();
    const ctx = getAudioCtx();
    const buf = ctx.createBuffer(1, samples.length, sampleRate);
    buf.getChannelData(0).set(samples);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start();
    playingSource = src;
    src.onended = () => { playingSource = null; };
  }

  function stopPlayback() {
    if (playingSource) {
      try { playingSource.stop(); } catch (_) {}
      playingSource = null;
    }
  }

  btnPlayOrig.addEventListener("click", () => { if (rawSamples) playSamples(rawSamples); });
  btnPlayMod.addEventListener("click", () => { if (btnPlayMod._samples) playSamples(btnPlayMod._samples); });
  btnStopPlay.addEventListener("click", stopPlayback);

  // =========================================================================
  // Plotting helpers (Plotly)
  // =========================================================================
  const plotStyle = {
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Inter, sans-serif", size: 11, color: "#44403c" },
    margin: { t: 30, b: 36, l: 44, r: 16 },
  };

  function plotWaveform(samples, container, title) {
    if (!container || typeof Plotly === "undefined") return;
    const step = Math.max(1, Math.floor(samples.length / 4000));
    const x = [], y = [];
    for (let i = 0; i < samples.length; i += step) {
      x.push(i / sampleRate);
      y.push(samples[i]);
    }
    Plotly.newPlot(container, [{
      x, y, type: "scatter", mode: "lines",
      line: { color: "#1c1917", width: 1 },
    }], {
      ...plotStyle,
      title: { text: title, font: { size: 13 } },
      xaxis: { title: "Time (s)" },
      yaxis: { title: "Amplitude", range: [-1.1, 1.1] },
    }, { responsive: true, displayModeBar: false });
  }

  function plotSpectrum(re, im, container, title) {
    if (!container || typeof Plotly === "undefined") return;
    const half = re.length / 2;
    const freqPerBin = sampleRate / re.length;
    const step = Math.max(1, Math.floor(half / 4000));
    const x = [], y = [];
    for (let k = 0; k < half; k += step) {
      x.push(k * freqPerBin);
      y.push(Math.sqrt(re[k] * re[k] + im[k] * im[k]));
    }
    Plotly.newPlot(container, [{
      x, y, type: "scatter", mode: "lines",
      fill: "tozeroy",
      line: { color: "#1c1917", width: 1 },
      fillcolor: "rgba(28,25,23,0.12)",
    }], {
      ...plotStyle,
      title: { text: title, font: { size: 13 } },
      xaxis: { title: "Frequency (Hz)", type: "log", range: [Math.log10(20), Math.log10(22050)] },
      yaxis: { title: "Magnitude" },
    }, { responsive: true, displayModeBar: false });
  }

  // =========================================================================
  // Mode switcher (Audio ↔ Image)
  // =========================================================================
  const audioPanel = document.getElementById("fft-audio-mode");
  const imagePanel = document.getElementById("fft-image-mode");
  document.querySelectorAll(".fft-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".fft-mode-btn").forEach((b) => {
        b.classList.remove("active");
        b.className = b.className.replace("btn-primary", "btn-secondary");
      });
      btn.classList.add("active");
      btn.className = btn.className.replace("btn-secondary", "btn-primary");

      const mode = btn.dataset.fftmode;
      if (audioPanel) audioPanel.style.display = mode === "audio" ? "" : "none";
      if (imagePanel) imagePanel.style.display = mode === "image" ? "" : "none";
      stopPlayback();
    });
  });

  // Expose FFT/IFFT for the image module
  window._fftCore = { fft, ifft, nextPow2 };

  // =========================================================================
  // "Explore in Tutor" link (reuse Music Lab bridge)
  // =========================================================================
  document.querySelectorAll("#tab-fftlab [data-music-prompt]").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      stopPlayback();
      const prompt = link.dataset.musicPrompt;
      if (window.switchToTab) window.switchToTab("tutor");
      setTimeout(() => {
        if (window.sendTutorQuestion) window.sendTutorQuestion(prompt);
      }, 250);
    });
  });

})();
