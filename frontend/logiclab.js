/* =============================================================================
   Formal Logic Lab — Truth tables, syllogisms, Knights & Knaves, logic gates.
   Pure browser, no backend needed.
   ============================================================================= */
(function () {
  "use strict";

  // ── Game selector ──
  const gameBtns = document.querySelectorAll(".logic-game-btn");
  const gamePanels = document.querySelectorAll(".logic-game");
  gameBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      gameBtns.forEach((b) => {
        b.classList.remove("active");
        b.className = b.className.replace("btn-primary", "btn-secondary");
      });
      btn.classList.add("active");
      btn.className = btn.className.replace("btn-secondary", "btn-primary");
      const id = btn.dataset.game;
      gamePanels.forEach((p) => p.classList.toggle("active", p.id === "logic-" + id));
    });
  });

  // ── Math tab switching ──
  document.querySelectorAll("#tab-logiclab .calc-math-tabs").forEach((tabs) => {
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

  // ── Explore-in-Tutor links ──
  document.querySelectorAll("#tab-logiclab [data-logic-prompt]").forEach((a) => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const prompt = a.dataset.logicPrompt;
      if (window.switchToTab) window.switchToTab("tutor");
      const inp = document.getElementById("tutor-input");
      if (inp) { inp.value = prompt; inp.dispatchEvent(new Event("input")); }
    });
  });

  // =========================================================================
  //  1  TRUTH TABLE BUILDER
  // =========================================================================
  const ttFormula = document.getElementById("tt-formula");
  const ttBuild = document.getElementById("tt-build");
  const ttWrap = document.getElementById("tt-table-wrap");
  const ttReadout = document.getElementById("tt-readout");

  function tokenize(expr) {
    return expr
      .replace(/<->/g, " IFF ")
      .replace(/->/g, " IMPLIES ")
      .replace(/&&/g, " AND ")
      .replace(/\|\|/g, " OR ")
      .replace(/!/g, " NOT ")
      .replace(/\(/g, " ( ")
      .replace(/\)/g, " ) ")
      .trim().split(/\s+/).filter(Boolean);
  }

  function extractVars(tokens) {
    const vars = new Set();
    for (const t of tokens) {
      if (/^[A-Z]$/.test(t)) vars.add(t);
    }
    return [...vars].sort();
  }

  function parseExpr(tokens, pos) {
    let left;
    [left, pos] = parseOr(tokens, pos);
    while (pos < tokens.length && (tokens[pos] === "IMPLIES" || tokens[pos] === "IFF")) {
      const op = tokens[pos]; pos++;
      let right;
      [right, pos] = parseOr(tokens, pos);
      left = op === "IMPLIES" ? { op: "IMPLIES", a: left, b: right } : { op: "IFF", a: left, b: right };
    }
    return [left, pos];
  }

  function parseOr(tokens, pos) {
    let left;
    [left, pos] = parseAnd(tokens, pos);
    while (pos < tokens.length && tokens[pos] === "OR") {
      pos++;
      let right;
      [right, pos] = parseAnd(tokens, pos);
      left = { op: "OR", a: left, b: right };
    }
    return [left, pos];
  }

  function parseAnd(tokens, pos) {
    let left;
    [left, pos] = parseNot(tokens, pos);
    while (pos < tokens.length && tokens[pos] === "AND") {
      pos++;
      let right;
      [right, pos] = parseNot(tokens, pos);
      left = { op: "AND", a: left, b: right };
    }
    return [left, pos];
  }

  function parseNot(tokens, pos) {
    if (tokens[pos] === "NOT") {
      pos++;
      let child;
      [child, pos] = parseNot(tokens, pos);
      return [{ op: "NOT", a: child }, pos];
    }
    return parseAtom(tokens, pos);
  }

  function parseAtom(tokens, pos) {
    if (tokens[pos] === "(") {
      pos++;
      let node;
      [node, pos] = parseExpr(tokens, pos);
      if (tokens[pos] === ")") pos++;
      return [node, pos];
    }
    return [{ op: "VAR", name: tokens[pos] }, pos + 1];
  }

  function evaluate(node, env) {
    switch (node.op) {
      case "VAR": return env[node.name] ? 1 : 0;
      case "NOT": return evaluate(node.a, env) ? 0 : 1;
      case "AND": return (evaluate(node.a, env) && evaluate(node.b, env)) ? 1 : 0;
      case "OR":  return (evaluate(node.a, env) || evaluate(node.b, env)) ? 1 : 0;
      case "IMPLIES": return (!evaluate(node.a, env) || evaluate(node.b, env)) ? 1 : 0;
      case "IFF": return (evaluate(node.a, env) === evaluate(node.b, env)) ? 1 : 0;
      default: return 0;
    }
  }

  function buildTruthTable() {
    try {
      const raw = ttFormula.value.trim();
      if (!raw) return;
      const tokens = tokenize(raw);
      const vars = extractVars(tokens);
      if (vars.length === 0 || vars.length > 6) {
        ttReadout.innerHTML = '<span style="color:#b91c1c;">Use 1–6 single-letter variables (A–Z).</span>';
        return;
      }
      const [tree] = parseExpr(tokens, 0);
      const n = vars.length;
      const rows = 1 << n;

      let html = '<table class="tt-table"><thead><tr>';
      for (const v of vars) html += `<th>${v}</th>`;
      html += `<th style="background:#2563eb;">Result</th></tr></thead><tbody>`;

      let trueCount = 0;
      for (let r = 0; r < rows; r++) {
        const env = {};
        html += "<tr>";
        for (let c = 0; c < n; c++) {
          const val = (r >> (n - 1 - c)) & 1;
          env[vars[c]] = val;
          html += `<td class="${val ? "val-true" : "val-false"}">${val}</td>`;
        }
        const res = evaluate(tree, env);
        if (res) trueCount++;
        html += `<td class="${res ? "val-true" : "val-false"}"><strong>${res}</strong></td></tr>`;
      }
      html += "</tbody></table>";
      ttWrap.innerHTML = html;

      const status = trueCount === rows ? "TAUTOLOGY (always true)" :
                     trueCount === 0 ? "CONTRADICTION (always false)" :
                     `CONTINGENT (true in ${trueCount}/${rows} rows)`;
      const color = trueCount === rows ? "#166534" : trueCount === 0 ? "#991b1b" : "#1c1917";
      ttReadout.innerHTML = `<strong style="color:${color};">${status}</strong>`;
    } catch (e) {
      ttReadout.innerHTML = `<span style="color:#b91c1c;">Parse error: check your formula syntax.</span>`;
    }
  }

  ttBuild.addEventListener("click", buildTruthTable);
  ttFormula.addEventListener("keydown", (e) => { if (e.key === "Enter") buildTruthTable(); });
  buildTruthTable();

  // =========================================================================
  //  2  SYLLOGISM VALIDATOR
  // =========================================================================
  const sylPuzzle = document.getElementById("syl-puzzle");
  const sylCheck = document.getElementById("syl-check");
  const sylPremises = document.getElementById("syl-premises");
  const sylCustom = document.getElementById("syl-custom");
  const sylResult = document.getElementById("syl-result");

  const SYLLOGISMS = [
    {
      name: "Barbara (AAA-1)",
      p1: "All M are P", p2: "All S are M", conc: "All S are P",
      valid: true,
      example: "All mammals are animals. All dogs are mammals. ∴ All dogs are animals.",
      explain: "Barbara is the most fundamental valid syllogism. The middle term (M) links S to P through two universal affirmatives.",
    },
    {
      name: "Celarent (EAE-1)",
      p1: "No M are P", p2: "All S are M", conc: "No S are P",
      valid: true,
      example: "No reptiles are mammals. All snakes are reptiles. ∴ No snakes are mammals.",
      explain: "Celarent: the universal negative premise eliminates overlap, and the universal affirmative forces S into the non-P region.",
    },
    {
      name: "Affirming the Consequent",
      p1: "If P then Q", p2: "Q is true", conc: "Therefore P is true",
      valid: false,
      example: "If it rains, the ground is wet. The ground is wet. ∴ It rained. (But a sprinkler could cause wet ground!)",
      explain: "This is a classic FALLACY. P → Q and Q does not entail P. The ground could be wet for many reasons besides rain.",
    },
    {
      name: "Denying the Antecedent",
      p1: "If P then Q", p2: "P is false", conc: "Therefore Q is false",
      valid: false,
      example: "If you study, you'll pass. You didn't study. ∴ You won't pass. (But you might pass anyway!)",
      explain: "Another classic FALLACY. P → Q and ¬P does not entail ¬Q. There could be other ways to achieve Q.",
    },
    {
      name: "Darii (AII-1)",
      p1: "All M are P", p2: "Some S are M", conc: "Some S are P",
      valid: true,
      example: "All poets are creative. Some students are poets. ∴ Some students are creative.",
      explain: "Darii: the universal premise guarantees all M are P; the particular premise places some S among M; so those S must be P.",
    },
    {
      name: "Socrates (applied)",
      p1: "All men are mortal", p2: "Socrates is a man", conc: "Socrates is mortal",
      valid: true,
      example: "All men are mortal. Socrates is a man. ∴ Socrates is mortal. (The most famous syllogism in history!)",
      explain: "This is Barbara applied to a specific individual. Aristotle used this very example in his lectures at the Lyceum ~335 BCE.",
    },
  ];

  function showSyllogism() {
    const idx = parseInt(sylPuzzle.value);
    sylResult.innerHTML = "";
    if (idx === 6) {
      sylCustom.style.display = "block";
      sylPremises.innerHTML = "<em>Enter your own premises and conclusion below, then click Check Validity.</em>";
      return;
    }
    sylCustom.style.display = "none";
    const s = SYLLOGISMS[idx];
    sylPremises.innerHTML =
      `<div><strong>Premise 1:</strong> ${s.p1}</div>` +
      `<div><strong>Premise 2:</strong> ${s.p2}</div>` +
      `<div style="border-top:1px solid #d6d3d1;margin-top:4px;padding-top:4px;"><strong>Conclusion:</strong> ${s.conc}</div>` +
      `<div style="margin-top:6px;color:#78716c;font-size:12px;"><em>Example:</em> ${s.example}</div>`;
  }

  function checkSyllogism() {
    const idx = parseInt(sylPuzzle.value);
    if (idx === 6) {
      sylResult.innerHTML =
        '<span style="color:#78716c;">Custom syllogisms require human judgment. ' +
        'Ask yourself: <strong>Is it possible</strong> for both premises to be true and the conclusion false? ' +
        'If yes → invalid. If no → valid.</span>';
      return;
    }
    const s = SYLLOGISMS[idx];
    const color = s.valid ? "#166534" : "#b91c1c";
    const icon = s.valid ? "✓" : "✗";
    const word = s.valid ? "VALID" : "INVALID (Fallacy!)";
    sylResult.innerHTML =
      `<strong style="color:${color};">${icon} ${word}</strong><br/>` +
      `<span style="font-size:13px;">${s.explain}</span>`;
  }

  sylPuzzle.addEventListener("change", showSyllogism);
  sylCheck.addEventListener("click", checkSyllogism);
  showSyllogism();

  // =========================================================================
  //  3  KNIGHTS & KNAVES
  // =========================================================================
  const kkPuzzle = document.getElementById("kk-puzzle");
  const kkHintBtn = document.getElementById("kk-hint");
  const kkReveal = document.getElementById("kk-reveal");
  const kkScenario = document.getElementById("kk-scenario");
  const kkChoices = document.getElementById("kk-choices");
  const kkHintBox = document.getElementById("kk-hint-box");
  const kkResult = document.getElementById("kk-result");

  let kkSelected = {};

  const KK_PUZZLES = [
    {
      scenario: 'You meet <strong>A</strong> and <strong>B</strong> on the island.<br/>A says: <em>"We are both Knaves."</em>',
      people: ["A", "B"],
      options: ["Knight", "Knave"],
      answer: { A: "Knave", B: "Knight" },
      hint: "If A were a Knight, would it be true that both are Knaves? That would be a contradiction!",
      explain: "If A is a Knight, then 'both are Knaves' is true — but A can't be both Knight and Knave. Contradiction! So A is a Knave. Since A lied, it's false that both are Knaves, so B must be a Knight.",
    },
    {
      scenario: 'You meet <strong>A</strong> and <strong>B</strong>.<br/>A says: <em>"I am a Knave or B is a Knight."</em>',
      people: ["A", "B"],
      options: ["Knight", "Knave"],
      answer: { A: "Knight", B: "Knight" },
      hint: "Consider: can a Knight say 'I am a Knave'? Can that disjunction be false if A is a Knight?",
      explain: "If A is a Knave, then 'I am a Knave or B is a Knight' is false. For a disjunction to be false, BOTH parts must be false. So 'I am a Knave' is false (making A a Knight) — contradiction! So A must be a Knight, making the statement true. Since 'I am a Knave' is false for a Knight, 'B is a Knight' must be true.",
    },
    {
      scenario: 'You meet <strong>A</strong>, <strong>B</strong>, and <strong>C</strong>.<br/>A says: <em>"All three of us are Knaves."</em><br/>B says: <em>"Exactly one of us is a Knight."</em>',
      people: ["A", "B", "C"],
      options: ["Knight", "Knave"],
      answer: { A: "Knave", B: "Knight", C: "Knave" },
      hint: "A claims all three are Knaves. Can a Knight make that claim?",
      explain: "A can't be a Knight (would mean all are Knaves — contradiction). So A is a Knave, and the statement 'all Knaves' is false. B says 'exactly one Knight.' If B is a Knight, then B is that one Knight, making A and C Knaves. Check: A(Knave) lies ✓, B(Knight) tells truth ✓. This is consistent. If B were a Knave, 'exactly one Knight' is false, but we need at least one non-Knave... testing shows B=Knight, C=Knave is the only consistent solution.",
    },
    {
      scenario: 'You reach a fork in the road. One path leads to <strong>freedom</strong>, the other to <strong>doom</strong>. A single islander stands at the fork — you don\'t know if they\'re a Knight or Knave.<br/><br/>You may ask <strong>one yes/no question</strong>. What do you ask to find the safe path?<br/><br/>Select the correct strategy:',
      people: ["Strategy"],
      options: [
        "Ask: 'Is the left path safe?'",
        "Ask: 'Are you a Knight?'",
        "Ask: 'If I asked you whether the left path leads to freedom, would you say yes?'",
        "Ask: 'Does the right path lead to doom?'"
      ],
      answer: { Strategy: "Ask: 'If I asked you whether the left path leads to freedom, would you say yes?'" },
      hint: "The key is a NESTED question that makes both Knights and Knaves give the same answer. Think about what happens when a liar lies about what they would say...",
      explain: "The double-question trick: 'If I asked you whether left is safe, would you say yes?' A Knight would truthfully report their truthful answer. A Knave would LIE about their LIE — the double negation cancels out! Both types effectively answer truthfully about the path. If they say 'yes', go left; 'no', go right.",
    },
    {
      scenario: 'You meet <strong>A</strong> on the island.<br/>A says: <em>"I am a Knave."</em><br/><br/>What is A?',
      people: ["A"],
      options: ["Knight", "Knave", "Paradox — impossible!"],
      answer: { A: "Paradox — impossible!" },
      hint: "If A is a Knight, the statement is true, so A is a Knave... If A is a Knave, the statement is false, so A is NOT a Knave (= Knight)...",
      explain: "This is a PARADOX — the Liar Paradox in disguise! If A is a Knight, then 'I am a Knave' is true, making A a Knave — contradiction. If A is a Knave, then 'I am a Knave' is false, making A NOT a Knave (= Knight) — contradiction. No consistent assignment exists. Smullyan used this to introduce Gödel's self-reference technique.",
    },
  ];

  function showKKPuzzle() {
    const p = KK_PUZZLES[parseInt(kkPuzzle.value)];
    kkScenario.innerHTML = p.scenario;
    kkHintBox.style.display = "none";
    kkResult.innerHTML = "";
    kkSelected = {};

    let html = "";
    for (const person of p.people) {
      html += `<div style="margin-bottom:6px;"><strong>${person}:</strong> `;
      for (const opt of p.options) {
        html += `<button class="kk-choice-btn" data-person="${person}" data-value="${opt}">${opt}</button> `;
      }
      html += "</div>";
    }
    kkChoices.innerHTML = html;

    kkChoices.querySelectorAll(".kk-choice-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const person = btn.dataset.person;
        kkChoices.querySelectorAll(`.kk-choice-btn[data-person="${person}"]`).forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
        kkSelected[person] = btn.dataset.value;
      });
    });
  }

  function checkKK() {
    const p = KK_PUZZLES[parseInt(kkPuzzle.value)];
    const allAnswered = p.people.every((person) => kkSelected[person]);
    if (!allAnswered) {
      kkResult.innerHTML = '<span style="color:#92400e;">Select an answer for each person first.</span>';
      return;
    }
    const correct = p.people.every((person) => kkSelected[person] === p.answer[person]);
    if (correct) {
      kkResult.innerHTML =
        `<strong style="color:#166534;">✓ Correct!</strong><br/><span style="font-size:13px;">${p.explain}</span>`;
    } else {
      const yourAnswer = p.people.map((person) => `${person}=${kkSelected[person]}`).join(", ");
      kkResult.innerHTML =
        `<strong style="color:#b91c1c;">✗ Not quite.</strong> You said: ${yourAnswer}<br/>` +
        `<span style="font-size:13px;">${p.explain}</span>`;
    }
  }

  kkPuzzle.addEventListener("change", showKKPuzzle);
  kkHintBtn.addEventListener("click", () => {
    const p = KK_PUZZLES[parseInt(kkPuzzle.value)];
    kkHintBox.textContent = p.hint;
    kkHintBox.style.display = "block";
  });
  kkReveal.addEventListener("click", checkKK);
  showKKPuzzle();

  // =========================================================================
  //  4  LOGIC GATE CIRCUIT CHALLENGES
  // =========================================================================
  const gatePuzzle = document.getElementById("gate-puzzle");
  const gateCheck = document.getElementById("gate-check");
  const gateHint = document.getElementById("gate-hint");
  const gateDesc = document.getElementById("gate-desc");
  const gateFormula = document.getElementById("gate-formula");
  const gateTT = document.getElementById("gate-truth-table");
  const gateResult = document.getElementById("gate-result");

  const GATE_PUZZLES = [
    {
      name: "XOR from AND, OR, NOT",
      vars: ["A", "B"],
      target: (a, b) => a ^ b,
      desc: "Build <strong>XOR</strong> (exclusive or): output is 1 when inputs differ, 0 when they match.<br/>Target: A⊕B. Use only <code>&&</code>, <code>||</code>, <code>!</code>.",
      hint: "XOR = (A || B) && !(A && B) — or equivalently (A && !B) || (!A && B).",
      placeholder: "(A && !B) || (!A && B)",
    },
    {
      name: "NAND is universal",
      vars: ["A", "B"],
      target: (a, b) => a & b ? 0 : 1,
      desc: "Build <strong>NAND</strong>: output is 0 only when BOTH inputs are 1.<br/>NAND is 'universal' — you can build ANY logic function using only NAND gates!",
      hint: "NAND = NOT(A AND B) = !(A && B).",
      placeholder: "!(A && B)",
    },
    {
      name: "Majority vote (2 of 3)",
      vars: ["A", "B", "C"],
      target: (a, b, c) => (a + b + c >= 2) ? 1 : 0,
      desc: "Build a <strong>majority vote</strong>: output is 1 when at least 2 of the 3 inputs are 1.<br/>This is how fault-tolerant systems work in aerospace (triple modular redundancy).",
      hint: "Majority = (A && B) || (A && C) || (B && C).",
      placeholder: "(A && B) || (A && C) || (B && C)",
    },
    {
      name: "Half adder — Sum bit",
      vars: ["A", "B"],
      target: (a, b) => a ^ b,
      desc: "Build the <strong>Sum</strong> output of a half adder. A half adder adds two 1-bit numbers: Sum = A⊕B (the XOR), Carry = A∧B.<br/>Focus on the Sum bit here.",
      hint: "Sum is XOR: (A && !B) || (!A && B).",
      placeholder: "(A && !B) || (!A && B)",
    },
    {
      name: "Multiplexer (selector)",
      vars: ["A", "B", "S"],
      target: (a, b, s) => s ? b : a,
      desc: "Build a <strong>2-to-1 multiplexer</strong>: when S=0, output A; when S=1, output B.<br/>Multiplexers are the 'routers' inside every CPU, selecting which data flows where.",
      hint: "MUX = (!S && A) || (S && B).",
      placeholder: "(!S && A) || (S && B)",
    },
  ];

  function showGatePuzzle() {
    const p = GATE_PUZZLES[parseInt(gatePuzzle.value)];
    gateDesc.innerHTML = p.desc;
    gateFormula.value = "";
    gateFormula.placeholder = p.placeholder;
    gateTT.innerHTML = "";
    gateResult.innerHTML = "";
  }

  function evalGateFormula(expr, env) {
    let s = expr;
    for (const [k, v] of Object.entries(env)) {
      s = s.replace(new RegExp("\\b" + k + "\\b", "g"), v ? "true" : "false");
    }
    try { return Function('"use strict"; return (' + s + ') ? 1 : 0;')(); }
    catch { return -1; }
  }

  function checkGate() {
    const idx = parseInt(gatePuzzle.value);
    const p = GATE_PUZZLES[idx];
    const formula = gateFormula.value.trim();
    if (!formula) {
      gateResult.innerHTML = '<span style="color:#92400e;">Enter a formula first.</span>';
      return;
    }

    const vars = p.vars;
    const n = vars.length;
    const rows = 1 << n;
    let allCorrect = true;

    let html = '<table class="tt-table"><thead><tr>';
    for (const v of vars) html += `<th>${v}</th>`;
    html += '<th style="background:#f59e0b;color:#1c1917;">Target</th><th style="background:#2563eb;">Yours</th></tr></thead><tbody>';

    for (let r = 0; r < rows; r++) {
      const env = {};
      const vals = [];
      html += "<tr>";
      for (let c = 0; c < n; c++) {
        const val = (r >> (n - 1 - c)) & 1;
        env[vars[c]] = val;
        vals.push(val);
        html += `<td class="${val ? "val-true" : "val-false"}">${val}</td>`;
      }
      const target = p.target(...vals);
      const yours = evalGateFormula(formula, env);
      const match = yours === target;
      if (!match) allCorrect = false;
      html += `<td class="${target ? "val-true" : "val-false"}">${target}</td>`;
      html += `<td class="${yours === target ? (yours ? "val-true" : "val-false") : ""}" style="${!match ? "background:#fef08a;font-weight:700;" : ""}">${yours < 0 ? "ERR" : yours}</td>`;
      html += "</tr>";
    }
    html += "</tbody></table>";
    gateTT.innerHTML = html;

    if (allCorrect) {
      gateResult.innerHTML = '<strong style="color:#166534;">✓ Perfect match! Your circuit is correct.</strong>';
    } else {
      gateResult.innerHTML = '<strong style="color:#b91c1c;">✗ Some rows don\'t match. Check the highlighted cells.</strong>';
    }
  }

  gatePuzzle.addEventListener("change", showGatePuzzle);
  gateCheck.addEventListener("click", checkGate);
  gateFormula.addEventListener("keydown", (e) => { if (e.key === "Enter") checkGate(); });
  gateHint.addEventListener("click", () => {
    const p = GATE_PUZZLES[parseInt(gatePuzzle.value)];
    gateResult.innerHTML = `<span style="color:#92400e;">${p.hint}</span>`;
  });
  showGatePuzzle();

})();
