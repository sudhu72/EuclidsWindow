// Solve tab — interactive coach for George Pólya's "How to Solve It".
// Four phases: Understand → Plan → Carry Out → Look Back. The local LLM
// plays the Socratic teacher: it asks Pólya's guiding questions tailored to
// the student's problem and critiques the student's thinking, never just
// handing over the solution.
document.addEventListener("DOMContentLoaded", () => {
  const problemEl = document.getElementById("polya-problem");
  const difficultyEl = document.getElementById("polya-difficulty");
  const startBtn = document.getElementById("polya-start");
  const statusEl = document.getElementById("polya-status");
  const sessionEl = document.getElementById("polya-session");
  const stepperEl = document.getElementById("polya-stepper");
  const coachEl = document.getElementById("polya-coach");
  const suggestionsEl = document.getElementById("polya-suggestions");
  const workspaceEl = document.getElementById("polya-workspace");
  const checkBtn = document.getElementById("polya-check");
  const hintBtn = document.getElementById("polya-hint");
  const nextBtn = document.getElementById("polya-next");
  const compassEl = document.getElementById("polya-compass");
  const notebookEl = document.getElementById("polya-notebook");
  if (!startBtn) return;

  // Pólya's canonical guiding questions, from "How to Solve It" (1945)
  const PHASES = [
    {
      key: "understand", icon: "🔍", title: "Understand the Problem",
      intro: "First, make sure you truly understand what is asked.",
      questions: [
        "What is the unknown — what are you asked to find or prove?",
        "What are the data? What is given?",
        "What is the condition connecting the data and the unknown?",
        "Is the condition sufficient? Insufficient? Redundant? Contradictory?",
        "Can you draw a figure? Introduce suitable notation?",
        "Can you restate the problem in your own words?",
      ],
    },
    {
      key: "plan", icon: "🧭", title: "Devise a Plan",
      intro: "Find the connection between the data and the unknown.",
      questions: [
        "Have you seen this problem before, perhaps in a different form?",
        "Do you know a related problem, or a theorem that could help?",
        "Look at the unknown — do you know a problem with the same unknown?",
        "Could you solve a simpler or more special case first?",
        "Could you work backwards from what you want?",
        "Did you use all the data? The whole condition?",
      ],
    },
    {
      key: "execute", icon: "✏️", title: "Carry Out the Plan",
      intro: "Execute your plan, checking each step as you go.",
      questions: [
        "Carry out each step of your plan.",
        "Can you see clearly that each step is correct?",
        "Can you prove that each step is correct?",
      ],
    },
    {
      key: "lookback", icon: "🔁", title: "Look Back",
      intro: "Examine the solution you obtained — this is where you learn.",
      questions: [
        "Can you check the result? Try a special case?",
        "Can you check the argument?",
        "Can you derive the result differently?",
        "Can you use this result, or this method, for another problem?",
      ],
    },
  ];

  let session = null; // {problem, difficulty, phase, notes: {key: text}, done: Set}

  const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function md(text) {
    let t = String(text || "");
    if (typeof window.normalizeLatexDelimiters === "function") {
      t = window.normalizeLatexDelimiters(t);
    }
    t = t.replace(/\\\\([()[\]])/g, "\\$1");
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\n/g, "<br/>");
  }

  function renderMath(el) {
    if (typeof renderMathInElement === "function") {
      try {
        renderMathInElement(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
          strict: "ignore",
        });
      } catch (e) { /* KaTeX optional */ }
    }
  }

  function addCoachMsg(html, cls) {
    const div = document.createElement("div");
    div.className = "polya-coach-msg" + (cls ? " " + cls : "");
    div.innerHTML = html;
    coachEl.appendChild(div);
    renderMath(div);
    coachEl.scrollTop = coachEl.scrollHeight;
  }

  function renderStepper() {
    stepperEl.innerHTML = "";
    PHASES.forEach((p, i) => {
      const chip = document.createElement("button");
      const current = i === session.phase;
      chip.className =
        (current ? "btn-primary" : "btn-secondary") +
        " polya-phase-chip" + (i < session.phase ? " done" : "");
      chip.style.cssText = "font-size:11px;padding:4px 10px;";
      chip.textContent = `${i < session.phase ? "✓" : p.icon} ${i + 1}. ${p.title}`;
      chip.disabled = i > session.phase;
      chip.addEventListener("click", () => {
        if (i <= session.phase) { session.phase = i; enterPhase(false); }
      });
      stepperEl.appendChild(chip);
    });
  }

  function renderCompass() {
    const p = PHASES[session.phase];
    compassEl.innerHTML = `
      <div class="polya-compass-phase">
        <h5>${p.icon} Phase ${session.phase + 1}: ${esc(p.title)}</h5>
        <ul>${p.questions.map((q) => `<li>${esc(q)}</li>`).join("")}</ul>
      </div>
      <div style="font-size:11px;color:#a8a29e;">— George Pólya, <em>How to Solve It</em></div>`;
  }

  function renderNotebook() {
    const entries = PHASES.filter((p) => session.notes[p.key]);
    notebookEl.innerHTML = entries.length
      ? entries.map((p) =>
          `<div style="margin-bottom:8px;"><strong>${p.icon} ${esc(p.title)}</strong><br/>${md(session.notes[p.key])}</div>`
        ).join("")
      : '<div class="viz-placeholder">Your notes from each phase collect here.</div>';
    renderMath(notebookEl);
  }

  function renderSuggestions(list) {
    suggestionsEl.innerHTML = "";
    (list || []).forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "💡 " + s;
      btn.addEventListener("click", () => {
        workspaceEl.value = (workspaceEl.value ? workspaceEl.value + "\n" : "") + s + ": ";
        workspaceEl.focus();
      });
      suggestionsEl.appendChild(btn);
    });
  }

  function enterPhase(announce = true) {
    const p = PHASES[session.phase];
    renderStepper();
    renderCompass();
    nextBtn.disabled = true;
    nextBtn.textContent = session.phase === PHASES.length - 1 ? "Finish 🎉" : "Next Phase →";
    if (announce) {
      addCoachMsg(
        `<strong>${p.icon} Phase ${session.phase + 1}: ${esc(p.title)}.</strong> ${esc(p.intro)}<br/>` +
        `<em>${esc(p.questions[0])}</em>`
      );
    }
    workspaceEl.value = session.notes[p.key] || "";
    workspaceEl.focus();
  }

  async function api(path, body) {
    const resp = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await resp.json().catch(() => ({}));
    if (!resp.ok) throw new Error(payload.detail || `HTTP ${resp.status}`);
    return payload;
  }

  function allNotes() {
    return PHASES.filter((p) => session.notes[p.key])
      .map((p) => `[${p.title}] ${session.notes[p.key]}`)
      .join("\n");
  }

  startBtn.addEventListener("click", async () => {
    const problem = (problemEl.value || "").trim();
    if (!problem) { statusEl.textContent = "Enter a problem first."; return; }
    startBtn.disabled = true;
    statusEl.textContent = "The coach is reading your problem…";
    try {
      const data = await api("/api/ai/polya/start", {
        problem,
        difficulty: difficultyEl.value,
        level: document.getElementById("lesson-level")?.value || "teen",
      });
      session = { problem, difficulty: difficultyEl.value, phase: 0, notes: {} };
      sessionEl.style.display = "";
      coachEl.innerHTML = "";
      suggestionsEl.innerHTML = "";
      renderNotebook();
      addCoachMsg(
        `${md(data.opening)}<br/><br/>` +
        (data.restated ? `<strong>As I read it:</strong> ${md(data.restated)}<br/>` : "") +
        (data.problem_type ? `<span style="font-size:12px;color:#78716c;">(${esc(data.problem_type)})</span><br/>` : "") +
        `<br/><strong>Tell me:</strong><br/>` +
        data.questions.map((q) => `• ${md(q)}`).join("<br/>")
      );
      enterPhase(false);
      statusEl.textContent = "";
    } catch (err) {
      statusEl.textContent = "Could not start: " + err.message;
    } finally {
      startBtn.disabled = false;
    }
  });

  async function coach(stuck) {
    const text = (workspaceEl.value || "").trim();
    if (!stuck && !text) { statusEl.textContent = "Write your thinking first."; return; }
    const p = PHASES[session.phase];
    if (text) {
      session.notes[p.key] = text;
      renderNotebook();
      addCoachMsg(md(text), "student");
    }
    checkBtn.disabled = hintBtn.disabled = true;
    statusEl.textContent = stuck ? "Thinking of a good hint…" : "The coach is reading your work…";
    try {
      const data = await api("/api/ai/polya/coach", {
        problem: session.problem,
        phase: p.key,
        user_input: text,
        notes: allNotes(),
        difficulty: session.difficulty,
        level: document.getElementById("lesson-level")?.value || "teen",
        stuck: !!stuck,
      });
      addCoachMsg(md(data.feedback));
      if (data.hint) addCoachMsg(`<strong>Hint:</strong> ${md(data.hint)}`, "hint");
      renderSuggestions(data.suggestions);
      if (data.ready) {
        nextBtn.disabled = false;
        addCoachMsg(
          session.phase === PHASES.length - 1
            ? "🎉 <strong>Well solved.</strong> You worked through all four phases — that method now belongs to you."
            : `✅ Good — you're ready for <strong>${PHASES[session.phase + 1].title}</strong>. Click “Next Phase” when you are.`
        );
      }
      statusEl.textContent = "";
    } catch (err) {
      statusEl.textContent = "Coach error: " + err.message;
    } finally {
      checkBtn.disabled = hintBtn.disabled = false;
    }
  }

  checkBtn.addEventListener("click", () => coach(false));
  hintBtn.addEventListener("click", () => coach(true));

  nextBtn.addEventListener("click", () => {
    if (session.phase < PHASES.length - 1) {
      session.phase += 1;
      suggestionsEl.innerHTML = "";
      enterPhase(true);
    } else {
      nextBtn.disabled = true;
    }
  });
});
