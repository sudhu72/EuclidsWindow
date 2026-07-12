// AI Lessons — OpenMAIC-inspired outline → scene playback.
// Stage 1 fetches a lesson outline; stage 2 expands each section lazily.
// Scenes render with markdown-lite + KaTeX, an AI classmate persona asks
// a question per scene, quizzes are interactive, and the whole lesson can
// be exported as a standalone HTML file.
document.addEventListener("DOMContentLoaded", () => {
  const topicEl = document.getElementById("lesson-topic");
  const levelEl = document.getElementById("lesson-level");
  const startBtn = document.getElementById("lesson-start");
  const exportBtn = document.getElementById("lesson-export");
  const statusEl = document.getElementById("lesson-status");
  const bodyEl = document.getElementById("lesson-body");
  const titleEl = document.getElementById("lesson-title");
  const progressEl = document.getElementById("lesson-progress");
  const sceneEl = document.getElementById("lesson-scene");
  const prevBtn = document.getElementById("lesson-prev");
  const nextBtn = document.getElementById("lesson-next");
  if (!startBtn) return;

  let outline = null;
  let scenes = [];      // cached scene payloads by section index
  let current = 0;
  let historyStart = 0; // tutor history length when this lesson was built

  const askBtn = document.getElementById("lesson-ask");
  const askSceneBtn = document.getElementById("lesson-ask-scene");
  const tutorInput = document.getElementById("tutor-input");
  const tutorSolution = document.getElementById("tutor-solution");

  const TYPE_ICONS = { explain: "💡", example: "✏️", quiz: "❓" };

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  // Minimal markdown: bold, italics, inline code, paragraphs, bullets
  function mdLite(text) {
    const lines = esc(text).split(/\n/);
    let html = "", inList = false;
    for (const line of lines) {
      const t = line.trim();
      if (/^[-*] /.test(t)) {
        if (!inList) { html += "<ul>"; inList = true; }
        html += "<li>" + t.slice(2) + "</li>";
      } else {
        if (inList) { html += "</ul>"; inList = false; }
        if (t) html += "<p>" + t + "</p>";
      }
    }
    if (inList) html += "</ul>";
    return html
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/\*([^*]+)\*/g, "<em>$1</em>")
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // LLMs sometimes emit LaTeX text commands outside math mode
      .replace(/\\textbf\{([^}]*)\}/g, "<strong>$1</strong>")
      .replace(/\\textit\{([^}]*)\}/g, "<em>$1</em>");
  }

  function renderMath(el) {
    if (typeof renderMathInElement === "function") {
      try {
        renderMathInElement(el, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
            { left: "\\begin{equation}", right: "\\end{equation}", display: true },
            { left: "\\begin{align}", right: "\\end{align}", display: true },
          ],
          throwOnError: false,
          strict: "ignore",
        });
      } catch (e) { /* KaTeX optional */ }
    }
  }

  // LLM narration often re-states the section title as its own first line
  // (sometimes with a trailing LaTeX "\\") — drop it, the UI already shows
  // the title as a heading.
  function stripTitleEcho(text, title) {
    if (!title) return text;
    const clean = (s) =>
      String(s)
        .replace(/\\text(?:bf|it)\{([^}]*)\}/g, "$1")
        .toLowerCase()
        .replace(/[#*\\`{}]/g, "")
        .replace(/[\s:.\-]+$/g, "")
        .replace(/\s+/g, " ")
        .trim();
    const lines = String(text).split(/\n/);
    let i = 0;
    while (i < lines.length && !lines[i].trim()) i++;
    if (i < lines.length) {
      const a = clean(lines[i]);
      const b = clean(title);
      // Only heading-sized lines count as echoes; never strip a one-line
      // narration that merely opens with the title.
      const headingSized = a.length <= Math.max(b.length * 2, b.length + 30);
      if (a && b && headingSized && (a === b || a.startsWith(b) || b.startsWith(a)) &&
          a.length >= Math.min(b.length * 0.6, 12)) {
        lines.splice(0, i + 1);
        return lines.join("\n");
      }
      // Inline echo: "**Title:** rest of paragraph…" — drop just the prefix
      const escRe = title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const prefixRe = new RegExp(
        "^\\s*(?:\\\\textbf\\{|\\*\\*)\\s*" + escRe + "\\s*(?:\\}|\\*\\*)\\s*[:.\\-\\u2013\\u2014]*\\s*", "i");
      if (prefixRe.test(lines[i])) {
        lines[i] = lines[i].replace(prefixRe, "");
        return lines.join("\n");
      }
    }
    return text;
  }

  // Full narration → HTML: normalize LaTeX delimiters (shared helper from
  // app.js), turn equation-style environments into display math, and pull
  // display blocks out as placeholders so mdLite's per-line <p> wrapping
  // can't split them.
  function mdBlock(text, title) {
    let t = stripTitleEcho(String(text), title);
    if (typeof window.normalizeLatexDelimiters === "function") {
      t = window.normalizeLatexDelimiters(t);
    }
    // normalizeLatexDelimiters emits doubled delimiters (\\( … \\)) when it
    // converts $-math; collapse them so KaTeX's \( \) / \[ \] can match.
    t = t.replace(/\\\\([()[\]])/g, "\\$1");
    t = t.replace(
      /\\begin\{(equation|align|gather|displaymath)\*?\}([\s\S]*?)\\end\{\1\*?\}/g,
      (m, env, body) => "\n\\[" + body.trim() + "\\]\n"
    );
    const mathBlocks = [];
    t = t.replace(/\\\[([\s\S]*?)\\\]/g, (m, body) => {
      mathBlocks.push("\\[" + body.trim() + "\\]");
      return "\n%%MATH" + (mathBlocks.length - 1) + "%%\n";
    });
    let html = mdLite(t);
    mathBlocks.forEach((mb, i) => {
      const token = "%%MATH" + i + "%%";
      const block = '<div class="math-display" style="margin:10px 0;overflow-x:auto;">' + esc(mb) + "</div>";
      html = html.includes("<p>" + token + "</p>")
        ? html.replace("<p>" + token + "</p>", block)
        : html.replace(token, esc(mb));
    });
    return html;
  }

  function renderProgress() {
    progressEl.innerHTML = "";
    outline.sections.forEach((s, i) => {
      const chip = document.createElement("button");
      chip.className = i === current ? "btn-primary" : "btn-secondary";
      chip.style.cssText = "font-size:11px;padding:4px 10px;";
      chip.textContent = `${TYPE_ICONS[s.type] || ""} ${i + 1}. ${s.title}`;
      chip.addEventListener("click", () => showScene(i));
      progressEl.appendChild(chip);
    });
  }

  function classmateBlock(q, a) {
    if (!q) return "";
    return `
      <div style="margin-top:14px;padding:10px 12px;background:#f5f5f4;border-left:3px solid #a8a29e;border-radius:4px;">
        <div style="font-size:13px;"><strong>🧑‍🎓 Maya asks:</strong> ${mdBlock(q)}</div>
        <details style="margin-top:6px;font-size:13px;">
          <summary style="cursor:pointer;color:#57534e;">See the answer</summary>
          <div style="margin-top:6px;">${mdBlock(a)}</div>
        </details>
      </div>`;
  }

  function renderScene(idx) {
    const section = outline.sections[idx];
    const scene = scenes[idx];
    let html = `<div style="padding:6px 4px;">
      <div style="font-size:12px;color:#78716c;margin-bottom:6px;">
        Scene ${idx + 1} of ${outline.sections.length} • ${section.type}</div>
      <h4 style="margin:0 0 10px;">${esc(section.title)}</h4>`;

    if (scene.type === "quiz") {
      html += `<p style="font-weight:600;">${mdLite(scene.question)}</p><div id="quiz-choices">`;
      scene.choices.forEach((c, i) => {
        html += `<button class="btn-secondary quiz-choice" data-i="${i}"
          style="display:block;width:100%;text-align:left;margin:6px 0;padding:8px 12px;">${esc(c)}</button>`;
      });
      html += `</div><div id="quiz-feedback" style="margin-top:8px;font-size:13px;"></div>`;
    } else {
      html += mdBlock(scene.narration, section.title);
      html += classmateBlock(scene.classmate_question, scene.classmate_answer);
    }
    html += "</div>";
    sceneEl.innerHTML = html;
    renderMath(sceneEl);

    if (scene.type === "quiz") {
      sceneEl.querySelectorAll(".quiz-choice").forEach((btn) => {
        btn.addEventListener("click", () => {
          const i = parseInt(btn.dataset.i, 10);
          const fb = sceneEl.querySelector("#quiz-feedback");
          const right = i === scene.correct_index;
          btn.style.borderColor = right ? "#16a34a" : "#dc2626";
          fb.innerHTML = (right ? "✅ <strong>Correct!</strong> " : "❌ Not quite — try again, or ") +
            (right ? mdLite(scene.explanation) : "peek: <em>" +
              esc(scene.choices[scene.correct_index]) + "</em>");
        });
      });
    }
  }

  async function fetchScene(idx) {
    if (scenes[idx]) return scenes[idx];
    const s = outline.sections[idx];
    const resp = await fetch("/api/ai/lesson/scene", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: outline.topic,
        level: outline.level,
        section_title: s.title,
        section_type: s.type,
        summary: s.summary || "",
      }),
    });
    if (!resp.ok) {
      const detail = (await resp.json().catch(() => ({}))).detail;
      throw new Error(detail || `HTTP ${resp.status}`);
    }
    scenes[idx] = await resp.json();
    return scenes[idx];
  }

  async function showScene(idx) {
    current = idx;
    window.EWTutor?.setLessonContext({
      topic: outline.topic,
      sceneIndex: idx,
      sceneTitle: outline.sections[idx].title,
    });
    renderProgress();
    prevBtn.disabled = idx === 0;
    nextBtn.disabled = idx >= outline.sections.length - 1;
    if (!scenes[idx]) {
      sceneEl.innerHTML = `<div style="padding:20px;color:#78716c;">✏️ Writing this scene with the local LLM…</div>`;
      statusEl.textContent = `Generating scene ${idx + 1}…`;
      try {
        await fetchScene(idx);
      } catch (err) {
        sceneEl.innerHTML = `<div style="padding:20px;color:#b91c1c;">Scene failed: ${esc(err.message)}
          <button class="btn-secondary" id="scene-retry" style="margin-left:8px;">Retry</button></div>`;
        sceneEl.querySelector("#scene-retry").addEventListener("click", () => showScene(idx));
        statusEl.textContent = "";
        return;
      }
      statusEl.textContent = "";
    }
    renderScene(idx);
    exportBtn.disabled = !scenes.some(Boolean);
  }

  startBtn.addEventListener("click", async () => {
    const topic = (topicEl.value || "").trim();
    if (!topic) { statusEl.textContent = "Enter a topic first."; return; }
    startBtn.disabled = true;
    statusEl.textContent = "Designing the lesson outline…";
    bodyEl.style.display = "none";
    outline = null; scenes = []; current = 0;
    try {
      const resp = await fetch("/api/ai/lesson/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, level: levelEl.value }),
      });
      if (!resp.ok) {
        const detail = (await resp.json().catch(() => ({}))).detail;
        throw new Error(detail || `HTTP ${resp.status}`);
      }
      outline = await resp.json();
      titleEl.textContent = outline.title;
      bodyEl.style.display = "";
      statusEl.textContent = "";
      // Scope the tutor's context store to this lesson
      await window.EWTutor?.startNewSession?.();
      historyStart = (window.EWTutor?.getHistory?.() || []).length;
      await showScene(0);
    } catch (err) {
      statusEl.textContent = "Lesson failed: " + err.message;
    } finally {
      startBtn.disabled = false;
    }
  });

  prevBtn.addEventListener("click", () => current > 0 && showScene(current - 1));
  nextBtn.addEventListener("click", () => current < outline.sections.length - 1 && showScene(current + 1));

  // "Just Ask" — free-form tutor question straight from the topic box,
  // no lesson required (and not scoped to any lesson).
  if (askBtn) {
    askBtn.addEventListener("click", () => {
      const q = (topicEl.value || "").trim();
      if (!q) { statusEl.textContent = "Type a question first."; return; }
      window.EWTutor?.setLessonContext(null);
      window.EWTutor?.ask(q);
      tutorSolution?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // "Ask about this scene" — focus the tutor input; app.js adds the
  // lesson/scene context to whatever gets asked.
  if (askSceneBtn) {
    askSceneBtn.addEventListener("click", () => {
      if (!tutorInput) return;
      if (!tutorInput.value.trim() && outline) {
        tutorInput.value = `Can you explain "${outline.sections[current].title}" in more depth?`;
      }
      tutorInput.focus();
      tutorInput.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  // ---------------------------------------------------------------
  // Export the assembled lesson as a standalone HTML file
  // ---------------------------------------------------------------
  exportBtn.addEventListener("click", () => {
    if (!outline) return;
    let content = "";
    outline.sections.forEach((s, i) => {
      const scene = scenes[i];
      content += `<section><h2>${TYPE_ICONS[s.type] || ""} ${esc(s.title)}</h2>`;
      if (!scene) {
        content += `<p><em>(scene not generated)</em></p>`;
      } else if (scene.type === "quiz") {
        content += `<p><strong>${esc(scene.question)}</strong></p><ol type="A">`;
        scene.choices.forEach((c, ci) => {
          content += `<li>${esc(c)}${ci === scene.correct_index ? " ✅" : ""}</li>`;
        });
        content += `</ol><p><em>${esc(scene.explanation)}</em></p>`;
      } else {
        content += mdBlock(scene.narration, s.title);
        if (scene.classmate_question) {
          content += `<blockquote><strong>🧑‍🎓 Maya asks:</strong> ${esc(scene.classmate_question)}<br/>
            <strong>Answer:</strong> ${esc(scene.classmate_answer)}</blockquote>`;
        }
      }
      content += "</section>";
    });
    // Include tutor Q&A asked while this lesson was open
    const history = (window.EWTutor?.getHistory?.() || []).slice(historyStart);
    if (history.length) {
      content += `<section><h2>💬 Questions asked during this lesson</h2>`;
      for (let i = 0; i < history.length; i++) {
        const m = history[i];
        if (m.role === "user") {
          content += `<p><strong>Q:</strong> ${esc(m.content)}</p>`;
        } else {
          content += `<blockquote>${mdBlock(m.content)}</blockquote>`;
        }
      }
      content += "</section>";
    }
    const doc = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${esc(outline.title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"><\/script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body,{delimiters:[{left:'\\\\(',right:'\\\\)',display:false},{left:'\\\\[',right:'\\\\]',display:true},{left:'$$',right:'$$',display:true}],throwOnError:false});"><\/script>
<style>
body{font-family:Georgia,serif;max-width:760px;margin:40px auto;padding:0 20px;color:#1c1917;line-height:1.6;}
h1{border-bottom:2px solid #1c1917;padding-bottom:8px;}
section{margin:28px 0;}
blockquote{background:#f5f5f4;border-left:3px solid #a8a29e;padding:10px 14px;border-radius:4px;}
footer{margin-top:40px;font-size:12px;color:#78716c;border-top:1px solid #e7e5e4;padding-top:10px;}
</style></head><body>
<h1>${esc(outline.title)}</h1>
<p><em>Level: ${esc(outline.level)} • Generated by Euclid's Window (local AI)</em></p>
${content}
<footer>Exported from Euclid's Window — learn math from first principles.</footer>
</body></html>`;
    const blob = new Blob([doc], { type: "text/html" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = outline.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".html";
    a.click();
    URL.revokeObjectURL(a.href);
  });
});
