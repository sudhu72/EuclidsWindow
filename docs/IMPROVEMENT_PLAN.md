# Euclid's Window — Improvement Plan & Gap Analysis

*Drafted 2026-07-08. Covers: (A) music sheet notation fixes, (B) Ollama-driven generation of
animations/images/music, (C) phased improvement roadmap, (D) gap analysis, (E) ideas adopted
from [OpenMAIC](https://github.com/THU-MAIC/OpenMAIC).*

---

## Current state (verified in code)

| Capability | Today | Where |
|---|---|---|
| Tutor text | Ollama (`qwen2.5:1.5b` default) via 3-tier pipeline | `app/ai/engine.py`, `service.py` |
| Animations | Manim: 14 heuristic templates + Ollama codegen fallback + retry loop | `app/ai/animation_pipeline.py` |
| Images | SDXL-Turbo via `diffusers`, **raw user prompt passed straight through**, disabled by default | `app/ai/media.py`, `/api/ai/media/image` |
| Music (generated audio) | MusicGen-small via `transformers`, raw prompt, fast-mode caps at 3 s | `app/ai/media.py`, `/api/ai/media/music` |
| Music Lab sheet notation | Hand-rolled canvas renderer | `frontend/musiclab.js` (`drawStaff`, lines 236–428) |
| Ollama client | Raw `/api/generate`, no chat API, no `format:"json"`, no options (temperature/ctx), one global model | `app/ai/engine.py` |

Ollama is already the text brain. What's missing is (1) making it *good* at code/media generation
(model routing, structured output, real error feedback) and (2) using it where it isn't used yet
(image prompt planning, symbolic music composition).

---

## A. Correct the music sheet notation (Mozart Dice Game)

Concrete bugs found in `frontend/musiclab.js`:

1. **Wrong time signature.** `drawTimeSig()` (lines 276–282) renders **3/4**, but the piece
   (K. 516f) and the data in `mozart_notes.js` are in **3/8**.
2. **No accidentals.** `midiToStaffY()` (lines 287–307) maps sharp pitch classes to *half*
   staff positions (`1: 0.5, 3: 1.5, 6: 3.5 …`), so F♯/C♯ noteheads are drawn floating
   *between* lines and spaces with no ♯ glyph. Correct engraving: draw at the natural letter's
   position and prefix a ♯ sign. Affects many measures (2, 11, 16, 21, 25, 28, 35, 52, 65 …).
3. **Wrong notehead fill.** `filled = note.dur <= 1` (lines 391, 402) with `dur` in
   eighth-note units makes every **quarter note render hollow** like a half note. Quarter
   notes are always filled; only halves/wholes are hollow. In 3/8 essentially *every* note
   in this piece should be filled.
4. **No flags or beams.** Eighths and sixteenths are drawn identically to quarters (bare
   stems), so durations are visually indistinguishable and the notation is simply incorrect.
5. **Rests never drawn.** `parseVoice()` advances the beat cursor for rest events (`[8]`,
   `[4]`) but the renderer draws nothing — measures like 2, 5, 8 look incomplete.
6. **Chords get one stem per notehead** instead of a single shared stem (e.g. measure 5's
   G-major chord grows four parallel stems).

### Recommended fix

**Option 1 (recommended): replace the canvas renderer with VexFlow** (`vexflow` ~280 KB,
MIT, self-hosted to preserve local-first). It handles clefs, 3/8 time, accidentals, beams,
flags, rests, chords, and ties correctly. Work: write a `mozartMeasureToVexflow()` adapter
from the existing `{t, b}` event format, keep the playing-bar highlight and per-row layout.
~1 day including visual QA against the IMSLP facsimile.

**Option 2 (minimal patch, ~half day):** keep the canvas renderer and fix in place —
3/8 glyphs, accidental ♯ rendering + natural-letter positioning, `filled` logic keyed to
notated duration (not beat length), single flag/double flag on stems, quarter/eighth rest
glyphs (𝄾, 𝄽), shared chord stems.

Either way, add a small regression harness: render a known measure set to an offscreen
canvas/SVG and snapshot-test it (the frontend currently has **zero** tests).

---

## B. Ollama for better animation / image / music generation

### B1. Engine upgrades (foundation, do first)

- Switch `LocalLLMEngine` to `/api/chat` with proper system/user roles; keep `/api/generate`
  fallback.
- Support `options` (`temperature`, `num_ctx`, `seed`) and `format: "json"` for every path
  that parses JSON (VizSpec, planner, symbolic music below) — eliminates fragile
  `extract_json_block` regexes.
- **Per-task model routing** in config + Settings UI, instead of one global model:

  | Task | Suggested default |
  |---|---|
  | Tutor prose | `qwen2.5:1.5b` (CPU) / `qwen2.5-math:7b` (GPU) |
  | Manim/Python codegen | `qwen2.5-coder:7b` |
  | VizSpec/music JSON extraction | `qwen2.5:1.5b` (fast) |
  | Image prompt planning | `qwen2.5:1.5b` |

- Streaming (`stream: true`) for the tutor panel; `keep_alive` per task; retry-with-backoff.

### B2. Animations

- Route codegen to the coder model — a 1.5 B general model cannot reliably write Manim; this
  is the single biggest quality lever.
- **Fix the broken repair loop**: `_render_with_retry()` sends the LLM a generic
  `"Manim render failed on attempt N"` string, while the real stderr is only logged in
  `executor.py:110` and discarded. Return `(payload, error)` from the executor so the fix
  prompt contains the actual traceback — right now the retry loop can't possibly work.
- Pre-render validation: `ast.parse`, whitelist imports, require `GeneratedScene.construct`,
  reject `os`/`subprocess` — fail fast before paying a Manim render.
- Grow the template library from real successes: persist LLM-generated scenes that rendered
  cleanly, curate the good ones into `manim_templates.py`.
- Add an animation eval set (20 topics → render success rate + human rubric) to the existing
  eval dashboard, so model/prompt changes are measurable.

### B3. Images

- **Route by intent, using Ollama as classifier.** Diffusion models produce garbled text and
  wrong geometry — they are the wrong tool for *diagrams*. Add a small planning step:
  - `diagram/plot` → LLM → SVG or Matplotlib/Plotly code through the existing sandboxed
    executor (crisp, labeled, correct), reusing the VizAgent machinery.
  - `illustration` ("show a torus", "a friendly picture of symmetry for kids") → SDXL-Turbo,
    but with an **Ollama prompt-enhancement pass**: concept + learner level → detailed
    diffusion prompt (style, composition, explicit "no text" guidance).
- Optional: a multimodal check (`llava` / `qwen2.5-vl` via Ollama) that scores the output
  image against the request and regenerates once on failure.
- Make the endpoint async-job based like Manim (see D3) and enable
  `local_media_enabled` by default when the deps are installed.

### B4. Music

- **Primary path — symbolic composition via Ollama (new):** ask the LLM for a structured
  JSON score (`format:"json"`): key, tempo, time signature, and note events
  `{pitch, dur, beat}` — the exact format `mozart_notes.js`/`parseVoice()` already use.
  Validate with cheap music-theory rules (in-key, in-range, measures sum to the time
  signature), then **play it with the existing Web Audio piano synth and engrave it with the
  fixed sheet renderer from Part A**. This is CPU-cheap, fully local, pedagogically on-theme
  (ratios, Euclidean rhythms, Fibonacci scales become *inputs* the LLM must honor), and it
  makes music explainable — unlike an opaque MusicGen waveform.
- Keep MusicGen as a secondary "ambient/texture" path, with an Ollama prompt-enhancement
  pass (concept → genre/tempo/instrumentation description), since raw math prompts like
  "the golden ratio" mean nothing to MusicGen.

---

## C. Phased roadmap

**Phase 1 — Correctness & quick wins (≈1 week)**
Music sheet fixes (A) · executor error propagation (B2) · vendor CDN libs locally (D2) ·
delete dead `app/llm.py` OpenAI path or fold it into `engine.py` as a cloud-fallback provider.

**Phase 2 — Ollama generation upgrades (≈2 weeks)**
Engine chat/JSON/options + model routing (B1) · coder-model Manim pipeline + validation +
eval set (B2) · image intent routing + prompt enhancement (B3) · symbolic music composer (B4).

**Phase 3 — Pedagogy & orchestration, OpenMAIC-inspired (≈3–4 weeks)**
Lesson pipeline (outline → scenes) · action-stream playback with synchronized narration ·
optional AI-classmate persona · export (HTML worksheet first, PPTX later).

**Phase 4 — Platform hardening (ongoing)**
Split `main.py` into routers · CI + frontend tests · media job queue & cleanup ·
security items (D5) · accessibility & i18n.

---

## D. Gap analysis

1. **Architecture.** `app/main.py` is 2,284 lines holding ~60 routes — split into
   `APIRouter` modules (auth, tutor, media, viz, settings, eval). `app/llm.py` is a dead
   legacy OpenAI path duplicating `engine.py`; two separate `prompts.py` files invite drift.
2. **"Local-first" is violated by the frontend.** `index.html` loads Plotly, Mermaid, KaTeX,
   and D3 from jsDelivr — the app breaks offline while the README's core promise is
   local-first. Vendor these (~4 MB) under `frontend/vendor/`.
3. **Media endpoints are second-class.** Manim has a job queue with progress polling;
   image/music are synchronous requests with 60–180 s timeouts, model loading blocks the
   first request, `local_media_enabled` defaults to off, and `static/media/` grows without
   any cleanup/TTL. Unify on the job-queue pattern.
4. **Testing asymmetry.** 23 backend test files, **zero** frontend tests for ~17 k lines of
   vanilla JS (the notation bugs in Part A are the proof), no tests for `media.py`, and no
   CI at all (no `.github/`). Add a minimal GitHub Actions workflow (pytest + a JS test
   runner like vitest) before Phase 2 lands.
5. **Security.** Default `jwt_secret` ships in code; CORS is `*`; diffusion runs with
   `safety_checker=None`; generation endpoints have no rate limiting; LLM-generated code
   relies on the executor sandbox alone (add the AST whitelist from B2).
6. **Evaluation blind spots.** The eval dashboard covers tutor text only — no success-rate or
   quality tracking for animations, images, or music, so generation changes are unmeasurable.
7. **Pedagogy (vs. OpenMAIC).** No lesson-level orchestration (single Q&A turns only), one
   agent voice, no narration/TTS, no learner progress model driving content selection, no
   export, no i18n, no accessibility pass.
8. **Data.** SQLite + ChromaDB fine for local; no backup/reset story, ChromaDB grows
   unbounded per session.

---

## E. Tips adopted from OpenMAIC (THU-MAIC)

OpenMAIC is an MIT-licensed "AI-empowered course" framework (Next.js + LangGraph) whose
patterns transfer well here:

1. **Two-stage generation: outline → scenes.** Generate a lesson outline first, then expand
   each item into a typed scene (explanation, quiz, simulation, lab hand-off). Maps directly
   onto the existing planner/coordinator — turns one-shot answers into structured lessons.
2. **Action-based rendering.** Decouple LLM output from execution: the model emits a JSON
   *action stream* (`speak`, `draw`, `highlight`, `show_chart`, `pause`) and the frontend
   executes it. This is the natural generalization of VizSpec and enables synchronized
   "whiteboard + narration" explanations — their action engine has 28+ action types.
3. **Playback state machine.** Step/pause/scrub through a worked example rather than dumping
   a full answer; ideal for derivations and the labs' step explanations.
4. **Multi-agent classroom roles.** A "student" persona that asks the questions a confused
   learner would, alongside the teacher — cheap to add with the existing agent registry and
   very effective pedagogically.
5. **Provider abstraction.** Their LLM/TTS/ASR provider interfaces (incl. Ollama) mirror the
   per-task model routing proposed in B1 — worth copying the interface shape.
6. **Export system.** Offline HTML with inlined assets (and later PPTX with LaTeX→OMML) so
   lessons are shareable artifacts, not just sessions.
7. **i18n from the start** (they ship 7 languages) — cheap now, expensive later.
