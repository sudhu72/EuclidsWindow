/* Discover — the general Feynman "discover it yourself" engine (any topic).
   Calls /api/ai/discover and renders the six-stage path, reusing the AI-by-Hand
   (.abh-*) styling. Exposed as window.EWDiscover so the Learn tab can trigger a
   discovery for its current topic. */
(function () {
  "use strict";
  const API_BASE = window.location.origin.startsWith("http") ? window.location.origin : "";

  const STAGES = [
    ["know", "① What you already know"],
    ["question", "② The question that makes you invent it"],
    ["byhand", "③ Do it by hand"],
    ["discover", "④ Discover the rule"],
    ["explain", "⑤ Explain it simply (Feynman)"],
  ];

  function typeset(el) {
    if (typeof renderMathInElement === "function") {
      try {
        renderMathInElement(el, {
          delimiters: [
            { left: "\\(", right: "\\)", display: false },
            { left: "$$", right: "$$", display: true },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
        });
      } catch (e) { /* KaTeX optional */ }
    }
  }

  // Reuse the app's markdown + LaTeX normalization when available so the
  // by-hand example renders like the rest of the app; fall back to raw text.
  function md(text) {
    const t = String(text || "");
    if (typeof window.parseMarkdown === "function" && typeof window.normalizeLatexDelimiters === "function") {
      return window.parseMarkdown(window.normalizeLatexDelimiters(t));
    }
    return t.replace(/\n/g, "<br>");
  }

  function chips(list, cls) {
    return (list || [])
      .map((c) => `<a href="#" class="abh-chip ${cls}" data-topic="${encodeURIComponent(c)}">${c}</a>`)
      .join(" ");
  }

  function render(root, data) {
    const stageHtml = STAGES.map(([key, label]) => `
      <div class="abh-stage">
        <div class="abh-stage-h">${label}</div>
        <div class="abh-stage-b">${md(data[key])}</div>
      </div>`).join("");
    root.innerHTML = `
      <div class="abh-ex-head">
        <h3>${data.topic}</h3>
        <p class="abh-ex-one">Rebuild it from first principles — you could have discovered this.</p>
      </div>
      ${stageHtml}
      <div class="abh-stage abh-connect">
        <div class="abh-stage-h">⑥ Connections (basic → advanced)</div>
        <div class="abh-stage-b">
          ${data.prerequisites && data.prerequisites.length ? `<div><b>Rests on:</b> ${chips(data.prerequisites, "pre")}</div>` : ""}
          ${data.unlocks && data.unlocks.length ? `<div style="margin-top:4px;"><b>Unlocks:</b> ${chips(data.unlocks, "post")}</div>` : ""}
          ${data.related && data.related.length ? `<div style="margin-top:4px;"><b>Related in the map:</b> ${chips(data.related, "rel")}</div>` : ""}
        </div>
      </div>
      <div class="abh-explore">
        <a href="#" class="abh-explore-link" id="discover-tutor">Go deeper with the tutor →</a>
      </div>
    `;
    // Clicking a connection chip discovers that topic in turn (climb the ladder).
    root.querySelectorAll(".abh-chip").forEach((a) =>
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        run(decodeURIComponent(a.dataset.topic));
      })
    );
    const tutor = root.querySelector("#discover-tutor");
    if (tutor) tutor.addEventListener("click", (ev) => {
      ev.preventDefault();
      if (window.switchToTab) window.switchToTab("tutor");
      if (window.sendTutorQuestion)
        window.sendTutorQuestion(`Help me discover ${data.topic} from first principles with a worked example.`);
    });
    typeset(root);
  }

  async function run(topic) {
    const input = document.getElementById("discover-topic");
    const level = document.getElementById("discover-level");
    const status = document.getElementById("discover-status");
    const root = document.getElementById("discover-root");
    if (!root) return;
    if (topic && input) input.value = topic;
    const t = (input ? input.value : topic || "").trim();
    if (!t) { if (status) status.textContent = "Enter a topic first."; return; }
    if (status) status.textContent = "Leading you to discover it…";
    root.innerHTML = `<div style="padding:20px;color:#78716c;">✏️ Working out a discovery path from first principles…</div>`;
    try {
      const resp = await fetch(`${API_BASE}/api/ai/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t, level: level ? level.value : "teen" }),
      });
      if (!resp.ok) {
        const detail = (await resp.json().catch(() => ({}))).detail;
        throw new Error(detail || `HTTP ${resp.status}`);
      }
      render(root, await resp.json());
      if (status) status.textContent = "";
    } catch (err) {
      root.innerHTML = `<div style="padding:20px;color:#b91c1c;">Discovery failed: ${err.message}</div>`;
      if (status) status.textContent = "";
    }
  }

  // Public bridge so the Learn tab (and chips) can trigger a discovery.
  window.EWDiscover = {
    run(topic, level) {
      if (window.switchToTab) window.switchToTab("discover");
      const lvl = document.getElementById("discover-level");
      if (level && lvl) lvl.value = level;
      run(topic);
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    const go = document.getElementById("discover-go");
    const input = document.getElementById("discover-topic");
    if (go) go.addEventListener("click", () => run());
    if (input) input.addEventListener("keydown", (e) => { if (e.key === "Enter") run(); });
  });
})();
