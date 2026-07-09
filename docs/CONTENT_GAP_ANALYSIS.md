# Mathematics Content — Gap Analysis & Fill Plan

*2026-07-08. Data analyzed: `demo_topics.json` (130 topics), `seed_concepts.json`
(104 concept-graph nodes), `math_map.json` (15 categories).*

## Where the catalog is strong

| Area | Topics | Notes |
|---|---|---|
| Recreational math & puzzles | ~15 | River crossing, paradoxes, Carroll, Conway |
| Music & mathematics | ~12 | Dice game, tuning, rhythm, harmonic series |
| ML mathematics | 8 | LoRA, RAG, attention, backprop, transformers |
| Signal processing / FFT | ~8 | 1D/2D FFT, filtering, compression |
| Calculus | 8+ | Derivative → differential equations → physics |
| Arithmetic & algebra basics | ~20 | Full elementary coverage |

## Gaps found

1. **Mathematician stories (the biggest gap).** Only 4 story topics
   (Ramanujan, Euler, Fermat's Last, Emmy Noether) — yet stories are the
   app's most memorable hook for all four learner levels. No Archimedes, no
   young Gauss, no Galois's duel, no Sophie Germain, no Hypatia, no invention
   of zero.
2. **The app's own namesake is missing.** *Euclid's Window* — but there is no
   topic on the parallel postulate or non-Euclidean geometry, the very story
   the name alludes to (Euclid's window onto curved space → Einstein).
3. **Probability & statistics depth.** Concept graph has only 5 probability
   nodes; topics cover basics + Bayes but no Central Limit Theorem, no
   Galton board, no "why the bell curve is everywhere".
4. **Discrete math.** 3 concept nodes; no pigeonhole principle, no induction
   as a standalone technique, no P vs NP.
5. **Unsolved problems.** Nothing on Collatz, Goldbach, twin primes —
   accessible open problems are great "math is alive" content.
6. **Famous constants.** π and φ appear (φ only inside art/music topics), but
   **e** has no home: no compound interest → continuous growth → e story.
7. **Foundational drama.** √2's irrationality (Hippasus legend) is a keyword
   inside `real_numbers` but not a story; zero's invention is absent.

## Fill plan

**Wave 1 (added now, 11 topics — stories + highest-leverage gaps):**
`history_of_zero`, `archimedes_story`, `gauss_story`, `galois_story`,
`sophie_germain_story`, `sqrt2_story`, `non_euclidean_geometry`,
`collatz_conjecture`, `pigeonhole_principle`, `central_limit_theorem`,
`eulers_number_e`. Each has the full 4-level content (kids/teen/college/adult),
keywords chosen to avoid collisions with existing topics, and story-first
framing.

**Wave 2 (next):** induction, P vs NP, Goldbach/twin primes, Hypatia &
al-Khwarizmi (house of wisdom), Cardano and imaginary numbers, conic sections,
Platonic solids, tessellations & Escher, voting theory, error-correcting codes.

**Wave 3 (structural):**
- Add matching nodes to `seed_concepts.json` (probability, discrete_math, and
  a new `history` category) so the concept graph reflects the new topics.
- Cross-link: story topics should appear as "Explore in Tutor" hooks from the
  labs (e.g. Galois → Logic Lab groups, CLT → a Galton-board Plotly viz).
- Use the Lesson pipeline (Phase 3) to auto-generate draft lessons for wave-2
  topics, then curate the best outputs into `demo_topics.json` — the same
  human-in-the-loop loop planned for Manim templates.

**Editorial guardrails:** stories must be historically honest (legends labeled
as legends — Hippasus's drowning, Galois's last night), every topic ends with
something the learner can *do*, and kids-level content leads with the 🎪 hook
per house style.
