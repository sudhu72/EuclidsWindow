/* =============================================================================
   FFT Lab — Image Mode (2D FFT)
   Load/upload image → 2D FFT → Frequency-domain filtering → Inverse 2D FFT
   Reuses Cooley-Tukey core from fftlab.js via window._fftCore
   ============================================================================= */

(function () {
  "use strict";

  const { fft, ifft } = window._fftCore;

  const SIZE = 256;

  // =========================================================================
  // DOM references
  // =========================================================================
  const btnLoadSample   = document.getElementById("img-load-sample");
  const inputUpload     = document.getElementById("img-upload");
  const loadStatus      = document.getElementById("img-load-status");
  const canvasOrig      = document.getElementById("img-original");
  const canvasGray      = document.getElementById("img-gray");
  const btnFFT          = document.getElementById("img-fft");
  const fftStatus       = document.getElementById("img-fft-status");
  const canvasSpectrum  = document.getElementById("img-spectrum");
  const canvasPhase     = document.getElementById("img-phase");
  const filterType      = document.getElementById("img-filter-type");
  const filterRadius    = document.getElementById("img-filter-radius");
  const filterRVal      = document.getElementById("img-filter-r-val");
  const filterR2Wrap    = document.getElementById("img-filter-r2-wrap");
  const filterRadius2   = document.getElementById("img-filter-radius2");
  const filterR2Val     = document.getElementById("img-filter-r2-val");
  const canvasMask      = document.getElementById("img-mask");
  const canvasFiltered  = document.getElementById("img-filtered-spectrum");
  const btnIFFT         = document.getElementById("img-ifft");
  const canvasCompare   = document.getElementById("img-compare-orig");
  const canvasResult    = document.getElementById("img-result");

  // =========================================================================
  // State
  // =========================================================================
  let grayPixels = null;           // Float64Array SIZE*SIZE, range [0..255]
  let specRe = null;               // 2D arrays: specRe[row][col]
  let specIm = null;

  // =========================================================================
  // Image loading helpers
  // =========================================================================
  function loadImageFromSource(src) {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => processImage(img);
    img.onerror = () => { loadStatus.textContent = "Failed to load image."; };
    img.src = src;
  }

  function processImage(img) {
    const offscreen = document.createElement("canvas");
    offscreen.width = SIZE;
    offscreen.height = SIZE;
    const octx = offscreen.getContext("2d");
    octx.drawImage(img, 0, 0, SIZE, SIZE);
    const data = octx.getImageData(0, 0, SIZE, SIZE);

    // Draw original
    const ctxOrig = canvasOrig.getContext("2d");
    ctxOrig.putImageData(data, 0, 0);

    // Compute grayscale
    grayPixels = new Float64Array(SIZE * SIZE);
    const grayData = ctxOrig.createImageData(SIZE, SIZE);
    for (let i = 0; i < SIZE * SIZE; i++) {
      const r = data.data[i * 4];
      const g = data.data[i * 4 + 1];
      const b = data.data[i * 4 + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      grayPixels[i] = lum;
      grayData.data[i * 4]     = lum;
      grayData.data[i * 4 + 1] = lum;
      grayData.data[i * 4 + 2] = lum;
      grayData.data[i * 4 + 3] = 255;
    }
    const ctxGray = canvasGray.getContext("2d");
    ctxGray.putImageData(grayData, 0, 0);

    loadStatus.textContent = `${SIZE}×${SIZE} loaded`;
    btnFFT.disabled = false;
    specRe = null;
    specIm = null;
    btnIFFT.disabled = true;
    clearCanvas(canvasSpectrum);
    clearCanvas(canvasPhase);
    clearCanvas(canvasMask);
    clearCanvas(canvasFiltered);
    clearCanvas(canvasCompare);
    clearCanvas(canvasResult);
  }

  function clearCanvas(c) {
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, c.width, c.height);
  }

  // Load a sample image: generate a synthetic image with geometric shapes
  btnLoadSample.addEventListener("click", () => {
    loadStatus.textContent = "Generating sample…";
    const c = document.createElement("canvas");
    c.width = SIZE; c.height = SIZE;
    const ctx = c.getContext("2d");

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grad.addColorStop(0, "#e8e8e8");
    grad.addColorStop(1, "#606060");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SIZE, SIZE);

    // White circle
    ctx.beginPath();
    ctx.arc(SIZE / 2, SIZE / 2, 60, 0, 2 * Math.PI);
    ctx.fillStyle = "#fff";
    ctx.fill();

    // Dark rectangle
    ctx.fillStyle = "#222";
    ctx.fillRect(30, 30, 80, 50);

    // Diagonal lines (high-freq texture)
    ctx.strokeStyle = "#444";
    ctx.lineWidth = 1;
    for (let i = -SIZE; i < SIZE * 2; i += 8) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + SIZE, SIZE);
      ctx.stroke();
    }

    // Small circles for detail
    ctx.fillStyle = "#fff";
    for (let i = 0; i < 12; i++) {
      ctx.beginPath();
      ctx.arc(40 + i * 18, 200, 4, 0, 2 * Math.PI);
      ctx.fill();
    }

    const img = new Image();
    img.onload = () => processImage(img);
    img.src = c.toDataURL();
  });

  // Upload from file
  inputUpload.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadStatus.textContent = "Loading…";
    const reader = new FileReader();
    reader.onload = (ev) => loadImageFromSource(ev.target.result);
    reader.readAsDataURL(file);
    inputUpload.value = "";
  });

  // =========================================================================
  // 2D FFT (row-column decomposition using 1D FFT)
  // =========================================================================
  function fft2d(gray) {
    const N = SIZE;
    const re = Array.from({ length: N }, () => new Float64Array(N));
    const im = Array.from({ length: N }, () => new Float64Array(N));

    // Copy input
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        re[r][c] = gray[r * N + c];

    // FFT along rows
    for (let r = 0; r < N; r++) {
      fft(re[r], im[r]);
    }

    // FFT along columns (transpose → FFT rows → transpose back)
    const colRe = new Float64Array(N);
    const colIm = new Float64Array(N);
    for (let c = 0; c < N; c++) {
      for (let r = 0; r < N; r++) { colRe[r] = re[r][c]; colIm[r] = im[r][c]; }
      fft(colRe, colIm);
      for (let r = 0; r < N; r++) { re[r][c] = colRe[r]; im[r][c] = colIm[r]; }
    }

    return { re, im };
  }

  function ifft2d(re, im) {
    const N = SIZE;
    // IFFT along columns
    const colRe = new Float64Array(N);
    const colIm = new Float64Array(N);
    for (let c = 0; c < N; c++) {
      for (let r = 0; r < N; r++) { colRe[r] = re[r][c]; colIm[r] = im[r][c]; }
      ifft(colRe, colIm);
      for (let r = 0; r < N; r++) { re[r][c] = colRe[r]; im[r][c] = colIm[r]; }
    }
    // IFFT along rows
    for (let r = 0; r < N; r++) {
      ifft(re[r], im[r]);
    }
    return re;
  }

  // Shift zero-frequency to center for display
  function fftShift(arr2d) {
    const N = SIZE;
    const half = N / 2;
    const out = Array.from({ length: N }, () => new Float64Array(N));
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        out[r][c] = arr2d[(r + half) % N][(c + half) % N];
    return out;
  }

  // =========================================================================
  // Spectrum visualization
  // =========================================================================
  function drawSpectrum(re2d, im2d, canvas) {
    const N = SIZE;
    const mag = Array.from({ length: N }, () => new Float64Array(N));
    let maxLog = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const m = Math.sqrt(re2d[r][c] ** 2 + im2d[r][c] ** 2);
        const logM = Math.log(1 + m);
        mag[r][c] = logM;
        if (logM > maxLog) maxLog = logM;
      }

    const shifted = fftShift(mag);
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(N, N);
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const val = maxLog > 0 ? Math.round(255 * shifted[r][c] / maxLog) : 0;
        const idx = (r * N + c) * 4;
        imgData.data[idx] = val;
        imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val;
        imgData.data[idx + 3] = 255;
      }
    ctx.putImageData(imgData, 0, 0);
  }

  function drawPhase(re2d, im2d, canvas) {
    const N = SIZE;
    const phase = Array.from({ length: N }, () => new Float64Array(N));
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++)
        phase[r][c] = Math.atan2(im2d[r][c], re2d[r][c]);

    const shifted = fftShift(phase);
    const ctx = canvas.getContext("2d");
    const imgData = ctx.createImageData(N, N);
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const val = Math.round(128 + 127 * shifted[r][c] / Math.PI);
        const idx = (r * N + c) * 4;
        imgData.data[idx] = val;
        imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val;
        imgData.data[idx + 3] = 255;
      }
    ctx.putImageData(imgData, 0, 0);
  }

  // =========================================================================
  // Run 2D FFT
  // =========================================================================
  btnFFT.addEventListener("click", () => {
    if (!grayPixels) return;
    fftStatus.textContent = "Computing 2D FFT…";
    btnFFT.disabled = true;

    setTimeout(() => {
      const result = fft2d(grayPixels);
      specRe = result.re;
      specIm = result.im;

      drawSpectrum(specRe, specIm, canvasSpectrum);
      drawPhase(specRe, specIm, canvasPhase);

      fftStatus.textContent = `${SIZE}×${SIZE} FFT complete`;
      btnFFT.disabled = false;
      btnIFFT.disabled = false;
      updateFilter();
    }, 30);
  });

  // =========================================================================
  // Filtering
  // =========================================================================
  function buildMask() {
    const N = SIZE;
    const half = N / 2;
    const type = filterType.value;
    const r1 = parseInt(filterRadius.value, 10);
    const r2 = parseInt(filterRadius2.value, 10);
    const mask = Array.from({ length: N }, () => new Float64Array(N));

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        // Distance from center in shifted coordinates
        const dr = ((r + half) % N) - half;
        const dc = ((c + half) % N) - half;
        const d = Math.sqrt(dr * dr + dc * dc);

        let val = 1;
        switch (type) {
          case "lowpass":
            val = d <= r1 ? 1 : 0;
            break;
          case "highpass":
            val = d >= r1 ? 1 : 0;
            break;
          case "bandpass":
            val = (d >= r1 && d <= r2) ? 1 : 0;
            break;
          case "bandstop":
            val = (d < r1 || d > r2) ? 1 : 0;
            break;
          default:
            val = 1;
        }
        mask[r][c] = val;
      }
    }
    return mask;
  }

  function drawMask(mask) {
    const N = SIZE;
    const ctx = canvasMask.getContext("2d");
    const imgData = ctx.createImageData(N, N);
    const shifted = fftShift(mask);
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const val = Math.round(255 * shifted[r][c]);
        const idx = (r * N + c) * 4;
        imgData.data[idx] = val;
        imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val;
        imgData.data[idx + 3] = 255;
      }
    ctx.putImageData(imgData, 0, 0);
  }

  function drawFilteredSpectrum(mask) {
    if (!specRe) return;
    const N = SIZE;
    const mag = Array.from({ length: N }, () => new Float64Array(N));
    let maxLog = 0;
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const m = Math.sqrt(
          (specRe[r][c] * mask[r][c]) ** 2 +
          (specIm[r][c] * mask[r][c]) ** 2
        );
        const logM = Math.log(1 + m);
        mag[r][c] = logM;
        if (logM > maxLog) maxLog = logM;
      }

    const shifted = fftShift(mag);
    const ctx = canvasFiltered.getContext("2d");
    const imgData = ctx.createImageData(N, N);
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const val = maxLog > 0 ? Math.round(255 * shifted[r][c] / maxLog) : 0;
        const idx = (r * N + c) * 4;
        imgData.data[idx] = val;
        imgData.data[idx + 1] = val;
        imgData.data[idx + 2] = val;
        imgData.data[idx + 3] = 255;
      }
    ctx.putImageData(imgData, 0, 0);
  }

  function updateFilter() {
    const type = filterType.value;
    filterR2Wrap.style.display = (type === "bandpass" || type === "bandstop") ? "" : "none";
    filterRVal.textContent = filterRadius.value;
    filterR2Val.textContent = filterRadius2.value;

    const mask = buildMask();
    drawMask(mask);
    if (specRe) drawFilteredSpectrum(mask);
  }

  filterType.addEventListener("change", updateFilter);
  filterRadius.addEventListener("input", updateFilter);
  filterRadius2.addEventListener("input", updateFilter);

  // =========================================================================
  // Inverse 2D FFT
  // =========================================================================
  btnIFFT.addEventListener("click", () => {
    if (!specRe || !specIm) return;
    btnIFFT.disabled = true;

    setTimeout(() => {
      const N = SIZE;
      const mask = buildMask();

      // Apply mask to spectrum copy
      const filtRe = Array.from({ length: N }, (_, r) => Float64Array.from(specRe[r]));
      const filtIm = Array.from({ length: N }, (_, r) => Float64Array.from(specIm[r]));
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          filtRe[r][c] *= mask[r][c];
          filtIm[r][c] *= mask[r][c];
        }

      // Inverse FFT
      const result = ifft2d(filtRe, filtIm);

      // Normalize and draw
      let minV = Infinity, maxV = -Infinity;
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          const v = result[r][c];
          if (v < minV) minV = v;
          if (v > maxV) maxV = v;
        }
      const range = maxV - minV || 1;

      const ctxRes = canvasResult.getContext("2d");
      const imgData = ctxRes.createImageData(N, N);
      for (let r = 0; r < N; r++)
        for (let c = 0; c < N; c++) {
          const val = Math.round(255 * (result[r][c] - minV) / range);
          const idx = (r * N + c) * 4;
          imgData.data[idx] = val;
          imgData.data[idx + 1] = val;
          imgData.data[idx + 2] = val;
          imgData.data[idx + 3] = 255;
        }
      ctxRes.putImageData(imgData, 0, 0);

      // Copy original grayscale for comparison
      const ctxComp = canvasCompare.getContext("2d");
      const compData = ctxComp.createImageData(N, N);
      for (let i = 0; i < N * N; i++) {
        const v = Math.round(grayPixels[i]);
        compData.data[i * 4] = v;
        compData.data[i * 4 + 1] = v;
        compData.data[i * 4 + 2] = v;
        compData.data[i * 4 + 3] = 255;
      }
      ctxComp.putImageData(compData, 0, 0);

      btnIFFT.disabled = false;
    }, 30);
  });

  // =========================================================================
  // Math tab switcher for image mode panels
  // =========================================================================
  document.querySelectorAll("#fft-image-mode .fft-math-tabs").forEach((tabBar) => {
    tabBar.querySelectorAll(".fft-math-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        const level = tab.dataset.level;
        const panel = tabBar.closest(".fft-math-panel");
        tabBar.querySelectorAll(".fft-math-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        panel.querySelectorAll(".fft-math-content").forEach((c) => {
          c.classList.toggle("hidden", c.dataset.level !== level);
        });
      });
    });
  });

})();
