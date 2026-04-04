const API_BASE = window.location.origin.startsWith("http")
  ? window.location.origin
  : "http://127.0.0.1:8000";

// =============================================================================
// Markdown Parser - Converts markdown to styled HTML
// =============================================================================
const parseMarkdown = (text) => {
  if (!text) return "";
  
  // Split into lines for easier processing
  const lines = text.split('\n');
  const result = [];
  let inTable = false;
  let tableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip table separator rows (|---|---|)
    if (/^\|[-:\s|]+\|$/.test(line)) {
      continue;
    }
    
    // Handle table rows
    if (/^\|.+\|$/.test(line)) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      // Parse table row
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      const isHeader = tableRows.length === 0;
      const cellTag = isHeader ? 'th' : 'td';
      const cellsHtml = cells.map(c => `<${cellTag}>${formatInline(c)}</${cellTag}>`).join('');
      tableRows.push(`<tr>${cellsHtml}</tr>`);
      continue;
    } else if (inTable) {
      // End of table
      result.push(`<table class="md-table"><tbody>${tableRows.join('')}</tbody></table>`);
      inTable = false;
      tableRows = [];
    }
    
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      result.push('<hr class="md-hr">');
      continue;
    }
    
    // Empty line
    if (line.trim() === '') {
      result.push('<div class="md-spacer"></div>');
      continue;
    }
    
    // Blockquote
    if (line.startsWith('> ')) {
      result.push(`<blockquote class="md-quote">${formatInline(line.slice(2))}</blockquote>`);
      continue;
    }
    
    // Bullet points
    if (/^[•\-\*] /.test(line)) {
      result.push(`<div class="md-bullet">${formatInline(line.slice(2))}</div>`);
      continue;
    }
    
    // Regular paragraph
    result.push(`<div class="md-line">${formatInline(line)}</div>`);
  }
  
  // Close any open table
  if (inTable) {
    result.push(`<table class="md-table"><tbody>${tableRows.join('')}</tbody></table>`);
  }
  
  return result.join('');
};

// Format inline elements (bold, italic, code, etc.)
const formatInline = (text) => {
  return text
    // Escape HTML
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // Bold **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic *text* (but not **)
    .replace(/\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
    // Inline code `text`
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>')
    // LaTeX - preserve delimiters for KaTeX
    .replace(/\\\((.+?)\\\)/g, '\\($1\\)')
    .replace(/\$\$(.+?)\$\$/g, '$$$$1$$');
};

const replaceGreekNamesOutsideMath = (text) => {
  if (!text) return text;
  // Fast-path: if no Greek names present, skip the expensive loop
  if (!/\b(alpha|beta|gamma|delta|epsilon|lambda|mu|pi|sigma|theta|omega)\b/i.test(text)) {
    return text;
  }
  const greekMap = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε",
    lambda: "λ", mu: "μ", pi: "π", sigma: "σ", theta: "θ", omega: "ω"
  };
  // Split on math delimiters to avoid replacing inside \(...\) or \[...\]
  // Pattern captures \(...\) and \[...\] blocks
  const parts = text.split(/(\\[\(\[[\s\S]*?\\[\)\]])/);
  return parts.map((part, idx) => {
    // Odd-indexed parts are math blocks – leave untouched
    if (idx % 2 === 1) return part;
    return part.replace(
      /\b(alpha|beta|gamma|delta|epsilon|lambda|mu|pi|sigma|theta|omega)\b/gi,
      (match) => greekMap[match.toLowerCase()] || match
    );
  }).join("");
};

const normalizeLatexDelimiters = (text) => {
  if (!text) return text;
  let normalized = text;
  // Unescape common sequences from JSON-ish outputs
  normalized = normalized.replace(/\\n/g, "\n");
  normalized = normalized.replace(/\\\\/g, "\\");
  // Fix invalid LaTeX sequences like "\λ" by converting them to commands.
  // KaTeX expects \lambda (not a backslash before a Unicode symbol).
  normalized = normalized
    .replace(/\\λ/g, "\\lambda")
    .replace(/\\α/g, "\\alpha")
    .replace(/\\β/g, "\\beta")
    .replace(/\\γ/g, "\\gamma")
    .replace(/\\δ/g, "\\delta")
    .replace(/\\θ/g, "\\theta")
    .replace(/\\π/g, "\\pi")
    .replace(/\\σ/g, "\\sigma")
    .replace(/\\μ/g, "\\mu")
    .replace(/\\ω/g, "\\omega");
  // Convert $$...$$ to \[...\]
  normalized = normalized.replace(/\$\$([\s\S]+?)\$\$/g, "\\\\[$1\\\\]");
  // Convert $...$ to \(...\)
  normalized = normalized.replace(/\$([^$]+?)\$/g, "\\\\($1\\\\)");
  return normalized;
};

const degradeMathMarkup = (html) => {
  if (!html) return html;
  return html
    .replace(/\\\[/g, "")
    .replace(/\\\]/g, "")
    .replace(/\\\(/g, "")
    .replace(/\\\)/g, "")
    .replace(/\\mathbf\{([^}]+)\}/g, "$1")
    .replace(/\\det\b/g, "det")
    .replace(/\\lambda\b/g, "λ")
    .replace(/\\alpha\b/g, "α")
    .replace(/\\beta\b/g, "β")
    .replace(/\\gamma\b/g, "γ")
    .replace(/\\delta\b/g, "δ")
    .replace(/\\theta\b/g, "θ")
    .replace(/\\pi\b/g, "π")
    .replace(/\\sigma\b/g, "σ")
    .replace(/\\mu\b/g, "μ")
    .replace(/\\omega\b/g, "ω");
};

// DOM Elements
const form = document.getElementById("chat-form");
const input = document.getElementById("chat-input");
const sendBtn = document.getElementById("send-btn");
const messages = document.getElementById("messages");
const vizContent = document.getElementById("viz-content");
const suggestions = document.getElementById("suggestions");
const conversationList = document.getElementById("conversation-list");
const newConversationBtn = document.getElementById("new-conversation");
const loadingOverlay = document.getElementById("loading-overlay");
const errorToast = document.getElementById("error-toast");
const chatUseTutorToggle = document.getElementById("chat-use-tutor");
const settingsForm = document.getElementById("settings-form");
const settingsPreset = document.getElementById("settings-preset");
const settingsLocalAiEnabled = document.getElementById("settings-local-ai-enabled");
const settingsMultiAgentEnabled = document.getElementById("settings-multi-agent-enabled");
const settingsLocalWebRagEnabled = document.getElementById("settings-local-web-rag-enabled");
const settingsFastModeEnabled = document.getElementById("settings-fast-mode-enabled");
const settingsLocalLlmModel = document.getElementById("settings-local-llm-model");
const settingsLocalMediaEnabled = document.getElementById("settings-local-media-enabled");
const settingsLocalDiffusionModel = document.getElementById("settings-local-diffusion-model");
const settingsLocalDiffusionTimeout = document.getElementById("settings-local-diffusion-timeout");
const settingsLocalMusicModel = document.getElementById("settings-local-music-model");
const settingsLocalMusicFast = document.getElementById("settings-local-music-fast");
const settingsLocalMusicTimeout = document.getElementById("settings-local-music-timeout");
const settingsLocalMediaDevice = document.getElementById("settings-local-media-device");
const settingsValidate = document.getElementById("settings-validate");
const settingsTestOllama = document.getElementById("settings-test-ollama");
const settingsTestDiffusion = document.getElementById("settings-test-diffusion");
const settingsTestMusic = document.getElementById("settings-test-music");
const settingsAwesomeCategories = document.getElementById("settings-awesome-categories");
const settingsAwesomeDryRun = document.getElementById("settings-awesome-dry-run");
const settingsImportAwesome = document.getElementById("settings-import-awesome");
const agentsList = document.getElementById("agents-list");
const evalSummary = document.getElementById("eval-summary");
const evalHistory = document.getElementById("eval-history");
const evalRefreshBtn = document.getElementById("eval-refresh");
const evalRefreshLiveBtn = document.getElementById("eval-refresh-live");
const evalExportJsonBtn = document.getElementById("eval-export-json");
const evalExportCsvBtn = document.getElementById("eval-export-csv");
const evalRunLabel = document.getElementById("eval-run-label");
const evalRunTags = document.getElementById("eval-run-tags");
const evalLatencyChart = document.getElementById("eval-latency-chart");
const evalTrendChart = document.getElementById("eval-trend-chart");
const evalFilterMode = document.getElementById("eval-filter-mode");
const evalFilterTag = document.getElementById("eval-filter-tag");
const evalFilterLabel = document.getElementById("eval-filter-label");
const evalCompareA = document.getElementById("eval-compare-a");
const evalCompareB = document.getElementById("eval-compare-b");
const evalCompareRunBtn = document.getElementById("eval-compare-run");
const evalCompareResult = document.getElementById("eval-compare-result");

// Tab elements
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// State
let currentConversationId = null;
let isLoading = false;

const demoPrompts = [
  "Explain the Pythagorean theorem",
  "Show a number line",
  "Explain base conversion",
  "Graph a parabola",
  "What is a prime number?",
  "How does the harmonic series relate to music?",
  "What is Mozart's Musical Dice Game?",
  "What are Euclidean rhythms?"
];

// =============================================================================
// Utility functions
// =============================================================================
const showLoading = (show) => {
  isLoading = show;
  loadingOverlay.classList.toggle("hidden", !show);
  if (input) {
    input.disabled = show;
    sendBtn.disabled = show;
  }
};

const showError = (message) => {
  errorToast.textContent = message;
  errorToast.classList.remove("hidden");
  setTimeout(() => errorToast.classList.add("hidden"), 4000);
};

const renderMath = () => {
  if (!window.renderMathInElement) {
    if (messages) {
      messages.innerHTML = degradeMathMarkup(messages.innerHTML);
    }
    return;
  }
  try {
    renderMathInElement(messages, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ],
      throwOnError: false,
      strict: "ignore"
    });
  } catch (error) {
    console.warn("Math render failed:", error);
  }
};

const tryParseJson = (text) => {
  if (!text || typeof text !== "string") return null;
  const trimmed = text.trim();
  const looksJson = trimmed.startsWith("{") || trimmed.startsWith("[") || trimmed.startsWith("```json");
  if (!looksJson) return null;
  const jsonText = trimmed.startsWith("```json")
    ? trimmed.replace(/```json|```/g, "").trim()
    : trimmed;
  try {
    return JSON.parse(jsonText);
  } catch (error) {
    return null;
  }
};

const normalizeTutorPayload = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  const parsed = tryParseJson(payload.solution);
  if (!parsed || typeof parsed !== "object") return payload;
  const merged = { ...payload, ...parsed };
  if (!merged.solution && parsed.explanation) merged.solution = parsed.explanation;
  if (!merged.solution && parsed.steps) merged.solution = parsed.steps;
  return merged;
};

const formatTutorOutput = (payload) => {
  if (!payload || typeof payload !== "object") return "";
  const normalized = normalizeTutorPayload(payload);
  const lines = [];

  if (normalized.plain_explanation) {
    lines.push("🗣️ **Plain English**");
    lines.push(normalized.plain_explanation);
  }

  if (normalized.axiomatic_explanation) {
    lines.push("📐 **Axiomatic View**");
    lines.push(normalized.axiomatic_explanation);
  }

  const solution = normalized.solution;
  if (solution && !normalized.plain_explanation && !normalized.axiomatic_explanation) {
    lines.push("🧠 **Answer**");
    if (Array.isArray(solution)) {
      const steps = solution.map((item, idx) => {
        if (typeof item === "string") return `${idx + 1}. ${item}`;
        if (item && typeof item === "object") {
          return `${idx + 1}. ${item.text || item.description || JSON.stringify(item)}`;
        }
        return `${idx + 1}. ${String(item)}`;
      });
      lines.push(steps.join("\n"));
    } else if (typeof solution === "string") {
      lines.push(solution);
    } else {
      lines.push(String(solution));
    }
  }

  if (normalized.explanation && !solution) {
    lines.push("🧠 **Answer**");
    lines.push(normalized.explanation);
  }

  if (Array.isArray(normalized.steps) && normalized.steps.length > 0) {
    lines.push("🧩 **Steps**");
    const steps = normalized.steps.map((step, idx) => {
      if (typeof step === "string") return `${idx + 1}. ${step}`;
      if (step && typeof step === "object") {
        return `${idx + 1}. ${step.text || step.description || JSON.stringify(step)}`;
      }
      return `${idx + 1}. ${String(step)}`;
    });
    lines.push(steps.join("\n"));
  }

  if (Array.isArray(normalized.checks) && normalized.checks.length > 0) {
    lines.push("✅ **Checks**");
    const checks = normalized.checks.map((check) => {
      const name = check?.name || "check";
      const status = check?.status === "pass" ? "pass" : "warn";
      const details = check?.details || "";
      const icon = status === "pass" ? "🟢" : "🟡";
      return `${icon} **${name}**: ${details}`;
    });
    lines.push(checks.join("\n"));
  }

  if (Array.isArray(normalized.improvement_hints) && normalized.improvement_hints.length > 0) {
    lines.push("🛠️ **Coach Hints**");
    const hints = normalized.improvement_hints.map((hint) => `• ${hint}`);
    lines.push(hints.join("\n"));
  }

  if (normalized.self_correction) {
    lines.push("🔁 **Self-Correction Pass**");
    lines.push(normalized.self_correction);
  }

  if (Array.isArray(normalized.key_takeaways) && normalized.key_takeaways.length > 0) {
    lines.push("📌 **Key Takeaways**");
    lines.push(normalized.key_takeaways.map((t) => `• ${t}`).join("\n"));
  }

  if (normalized.needs_visualization || normalized.visualization) {
    const viz = normalized.visualization || {};
    lines.push("🎨 **Visualization**");
    if (viz.type) lines.push(`• **Type**: ${viz.type}`);
    if (viz.goal) lines.push(`• **Goal**: ${viz.goal}`);
  }

  return replaceGreekNamesOutsideMath(normalizeLatexDelimiters(lines.join("\n\n")));
};

// =============================================================================
// Tab Navigation
// =============================================================================
const LAB_TABS = new Set(["matrixlab", "musiclab", "fftlab"]);
const labsDropdown = document.getElementById("labs-dropdown");
const labsToggle = labsDropdown ? labsDropdown.querySelector(".nav-dropdown-toggle") : null;
const labsItems = document.querySelectorAll(".nav-dropdown-item");

tabBtns.forEach(btn => {
  if (btn.classList.contains("nav-dropdown-toggle")) return;
  btn.addEventListener("click", () => {
    const tabId = btn.dataset.tab;
    switchToTab(tabId);
  });
});

labsItems.forEach(item => {
  item.addEventListener("click", () => {
    const tabId = item.dataset.tab;
    if (labsDropdown) labsDropdown.classList.remove("open");
    switchToTab(tabId);
  });
});

if (labsToggle) {
  labsToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    labsDropdown.classList.toggle("open");
  });
}

document.addEventListener("click", () => {
  if (labsDropdown) labsDropdown.classList.remove("open");
});
if (labsDropdown) {
  labsDropdown.addEventListener("click", (e) => e.stopPropagation());
}

const switchToTab = (tabId) => {
  tabBtns.forEach(b => b.classList.remove("active"));
  tabContents.forEach(c => c.classList.remove("active"));
  labsItems.forEach(i => i.classList.remove("active"));

  if (LAB_TABS.has(tabId)) {
    if (labsToggle) labsToggle.classList.add("active");
    const activeItem = [...labsItems].find(i => i.dataset.tab === tabId);
    if (activeItem) activeItem.classList.add("active");
  } else {
    const activeBtn = [...tabBtns].find((b) => b.dataset.tab === tabId);
    if (activeBtn) activeBtn.classList.add("active");
  }

  const target = document.getElementById(`tab-${tabId}`);
  if (target) target.classList.add("active");

  if (tabId === "mindmap") loadConceptsForMindmap();
  if (tabId === "matrixlab") loadMatrixLab();
  if (tabId === "euclid") searchEuclid();
  if (tabId === "resources") searchResources();
  if (tabId === "collections") loadPromptCollections();
  if (tabId === "settings") loadSettings();
  if (tabId === "eval") loadEvalDashboard(false);
};

// =============================================================================
// Chat Tab
// =============================================================================
const addMessage = (text, role, loading = false) => {
  if (!messages) return null;
  const message = document.createElement("div");
  message.className = `message ${role}${loading ? " loading" : ""}`;
  
  // Parse markdown for assistant messages, plain text for user
  if (role === "assistant" && !loading) {
    try {
      message.innerHTML = parseMarkdown(text);
    } catch (error) {
      console.warn("Markdown render failed:", error);
      message.textContent = text;
    }
  } else {
    message.textContent = text;
  }
  
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
  renderMath();
  return message;
};

const removeLoadingMessage = () => {
  if (!messages) return;
  const loadingMsg = messages.querySelector(".message.loading");
  if (loadingMsg) loadingMsg.remove();
};

const renderSuggestions = () => {
  if (!suggestions) return;
  suggestions.innerHTML = "";
  demoPrompts.forEach((prompt) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = prompt;
    button.addEventListener("click", () => sendMessage(prompt));
    suggestions.appendChild(button);
  });
};

const showVisualizationIn = (container, visualization) => {
  container.innerHTML = "";
  if (!visualization) {
    container.innerHTML = '<div class="viz-placeholder">No visualization for this topic.</div>';
    return;
  }

  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.style.marginBottom = "8px";
  title.textContent = visualization.title;
  container.appendChild(title);

  if (visualization.viz_type === "svg") {
    const img = document.createElement("img");
    const url = visualization.data.url.startsWith("http")
      ? visualization.data.url
      : `${API_BASE}${visualization.data.url}`;
    img.src = url;
    img.alt = visualization.title;
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    container.appendChild(img);
    return;
  }

  if (visualization.viz_type === "plotly") {
    const plotContainer = document.createElement("div");
    container.appendChild(plotContainer);
    // Use requestAnimationFrame so Plotly rendering doesn't block the main thread
    requestAnimationFrame(() => {
      try {
        const layout = visualization.data.layout || {};
        // Strip the huge Plotly default template if it somehow arrived
        delete layout.template;
        Plotly.newPlot(plotContainer, visualization.data.data, layout, {
          displayModeBar: false,
          responsive: true
        });
      } catch (err) {
        plotContainer.textContent = "Visualization could not be rendered.";
        console.warn("Plotly render error:", err);
      }
    });
    return;
  }

  if (visualization.viz_type === "manim") {
    const manimData = visualization.data || {};

    if (manimData.url) {
      const url = manimData.url.startsWith("http")
        ? manimData.url
        : `${API_BASE}${manimData.url}`;

      if (manimData.format === "gif") {
        const img = document.createElement("img");
        img.src = url;
        img.alt = visualization.title;
        img.style.width = "100%";
        img.style.borderRadius = "8px";
        container.appendChild(img);
      } else {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.style.width = "100%";
        video.style.borderRadius = "8px";
        container.appendChild(video);
      }
      return;
    }

    const info = document.createElement("div");
    info.className = "viz-placeholder";
    info.textContent = "Manim animation available. Click to render.";
    container.appendChild(info);

    const renderBtn = document.createElement("button");
    renderBtn.className = "btn-primary";
    renderBtn.style.marginTop = "12px";
    renderBtn.textContent = "Render Animation";
    container.appendChild(renderBtn);

    renderBtn.addEventListener("click", async () => {
      if (!manimData.scene_name) {
        showError("Missing Manim scene name.");
        return;
      }

      container.innerHTML = '<div class="viz-placeholder">Rendering animation...</div>';

      try {
        const response = await fetch(`${API_BASE}/api/animations/render`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scene_name: manimData.scene_name,
            quality: manimData.quality || "low",
            output_format: manimData.output_format || "gif"
          })
        });

        if (!response.ok) throw new Error("Render failed");
        const payload = await response.json();

        if (payload.status !== "completed" || !payload.url) {
          throw new Error(payload.error || "Render failed");
        }

        visualization.data = {
          ...manimData,
          url: payload.url,
          format: payload.format || manimData.output_format || "gif"
        };
        showVisualizationIn(container, visualization);
      } catch (error) {
        showError("Failed to render animation.");
        showVisualizationIn(container, visualization);
      }
    });
  }
};

const showVizStatus = (container, message) => {
  if (!container) return;
  container.innerHTML = `<div class="viz-placeholder">${message}</div>`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const renderRenderJobs = (jobs) => {
  if (!tutorJobsList) return;
  tutorJobsList.innerHTML = "";
  if (!Array.isArray(jobs) || jobs.length === 0) {
    tutorJobsList.innerHTML = '<div class="viz-placeholder">No render jobs yet.</div>';
    return;
  }
  jobs.forEach((job) => {
    const card = document.createElement("div");
    card.className = "agent-card";
    const kind = job.kind || "animation";
    const titleCore = job.scene_name || job.question || job.id;
    const title = `${kind.toUpperCase()}: ${titleCore}`;
    const status = `${job.status} • ${Number(job.progress || 0)}%`;
    card.innerHTML = `
      <div class="agent-top">
        <div>
          <div class="agent-name">${title}</div>
          <div class="agent-meta">${status}</div>
        </div>
      </div>
      <div class="agent-details">${job.error || ""}</div>
      <div class="agent-actions" style="margin-top:8px; display:flex; gap:8px;"></div>
    `;
    const actions = card.querySelector(".agent-actions");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn-secondary";
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", async () => {
      const endpoint = kind === "diagram"
        ? `/api/visualizations/jobs/${encodeURIComponent(job.id)}`
        : `/api/animations/${encodeURIComponent(job.id)}`;
      await fetch(`${API_BASE}${endpoint}`, { method: "DELETE" });
      await loadRenderJobs();
    });
    actions.appendChild(removeBtn);
    if (job.status === "error") {
      const retryBtn = document.createElement("button");
      retryBtn.type = "button";
      retryBtn.className = "btn-primary";
      retryBtn.textContent = "Retry";
      retryBtn.addEventListener("click", () => renderOnDemandVisualization(kind === "diagram" ? "diagram" : "animation"));
      actions.appendChild(retryBtn);
    }
    tutorJobsList.appendChild(card);
  });
};

const loadRenderJobs = async () => {
  if (!tutorJobsList) return;
  try {
    const [animResp, diagResp] = await Promise.all([
      fetch(`${API_BASE}/api/animations/jobs?limit=12`),
      fetch(`${API_BASE}/api/visualizations/jobs?limit=12`)
    ]);
    if (!animResp.ok || !diagResp.ok) throw new Error("Failed to load jobs");
    const anim = await animResp.json();
    const diag = await diagResp.json();
    const jobs = [
      ...(anim.jobs || []).map((j) => ({ ...j, kind: "animation" })),
      ...(diag.jobs || []).map((j) => ({ ...j, kind: "diagram" }))
    ].slice(0, 20);
    renderRenderJobs(jobs);
  } catch (_error) {
    tutorJobsList.innerHTML = '<div class="viz-placeholder">Could not load render jobs.</div>';
  }
};

const pollDiagramJob = async (jobId) => {
  if (!jobId) return false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const response = await fetch(`${API_BASE}/api/visualizations/jobs/${encodeURIComponent(jobId)}`);
    const statusPayload = await response.json();
    const status = statusPayload?.status || "unknown";
    const progress = Number(statusPayload?.progress ?? 0);
    if (status === "completed" && statusPayload.visualization) {
      showVisualizationIn(tutorViz, statusPayload.visualization);
      showError("Diagram generated successfully.");
      await loadRenderJobs();
      return true;
    }
    if (status === "error" || status === "not_found") {
      showVizStatus(tutorViz, statusPayload?.error || "Diagram generation failed.");
      showError(statusPayload?.error || "Diagram generation failed.");
      await loadRenderJobs();
      return false;
    }
    showVizStatus(tutorViz, `Generating diagram... ${progress}%`);
    await sleep(1000);
  }
  showVizStatus(tutorViz, "Diagram is taking longer than expected. You can retry.");
  showError("Diagram still rendering. Please try again shortly.");
  await loadRenderJobs();
  return false;
};

const pollAnimationJob = async (animationId) => {
  if (!animationId) return false;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const response = await fetch(`${API_BASE}/api/animations/${encodeURIComponent(animationId)}`);
    const statusPayload = await response.json();
    const status = statusPayload?.status || "unknown";
    const progress = Number(statusPayload?.progress ?? 0);
    if (status === "completed" && statusPayload.url) {
      const viz = {
        viz_id: statusPayload.id || animationId,
        viz_type: "manim",
        title: "Animation",
        data: {
          url: statusPayload.url,
          format: statusPayload.format || "gif"
        }
      };
      showVisualizationIn(tutorViz, viz);
      showError("Animation rendered successfully.");
      await loadRenderJobs();
      return true;
    }
    if (status === "error" || status === "not_found") {
      showVizStatus(tutorViz, statusPayload?.error || "Animation render failed.");
      showError(statusPayload?.error || "Animation render failed.");
      await loadRenderJobs();
      return false;
    }
    showVizStatus(tutorViz, `Generating animation... ${progress}%`);
    await sleep(2000);
  }
  showVizStatus(tutorViz, "Animation is taking longer than expected. You can retry.");
  showError("Animation still rendering. Please try again shortly.");
  await loadRenderJobs();
  return false;
};

const showVisualization = (visualization) => {
  if (!vizContent) return;
  showVisualizationIn(vizContent, visualization);
};

const loadConversations = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/conversations`);
    if (!response.ok) throw new Error("Failed to load conversations");
    const data = await response.json();
    renderConversationList(data.conversations);
  } catch (error) {
    console.error("Error loading conversations:", error);
  }
};

const renderConversationList = (conversations) => {
  conversationList.innerHTML = "";
  conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = `conversation-item${conv.id === currentConversationId ? " active" : ""}`;
    item.textContent = conv.title || "Untitled";
    item.addEventListener("click", () => loadConversation(conv.id));
    conversationList.appendChild(item);
  });
};

const loadConversation = async (conversationId) => {
  showLoading(true);
  try {
    const response = await fetch(`${API_BASE}/api/conversations/${conversationId}`);
    if (!response.ok) throw new Error("Failed to load conversation");
    const conv = await response.json();

    currentConversationId = conv.id;
    messages.innerHTML = "";

    conv.messages.forEach((msg) => {
      addMessage(msg.content, msg.role);
    });

    document.querySelectorAll(".conversation-item").forEach((el) => el.classList.remove("active"));
    const activeItem = [...document.querySelectorAll(".conversation-item")].find(
      (el) => el.textContent === (conv.title || "Untitled")
    );
    if (activeItem) activeItem.classList.add("active");
  } catch (error) {
    showError("Failed to load conversation");
  } finally {
    showLoading(false);
  }
};

const startNewConversation = () => {
  currentConversationId = null;
  messages.innerHTML = "";
  addMessage("Welcome! Try one of the suggested prompts below to explore a visualization.", "assistant");
  showVisualization(null);
  document.querySelectorAll(".conversation-item").forEach((el) => el.classList.remove("active"));
};

const sendMessage = async (message) => {
  if (!message || isLoading) return;
  addMessage(message, "user");
  input.value = "";

  const loadingMsg = addMessage("Thinking...", "assistant", true);
  showLoading(true);

  try {
    if (chatUseTutorToggle && chatUseTutorToggle.checked) {
      const response = await fetch(`${API_BASE}/api/ai/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message })
      });
      const rawText = await response.text();
      let payload = null;
      try {
        payload = JSON.parse(rawText);
      } catch (parseError) {
        throw new Error("Invalid JSON response");
      }

      if (!response.ok) {
        const errorMessage = payload?.detail || payload?.error || "Tutor request failed";
        throw new Error(errorMessage);
      }

      removeLoadingMessage();
      addMessage(
        replaceGreekNamesOutsideMath(normalizeLatexDelimiters(formatTutorOutput(payload))),
        "assistant"
      );
      try {
        showVisualization(payload.visualization);
      } catch (error) {
        console.warn("Visualization render failed:", error);
        showVisualization(null);
      }
      return;
    }

    const body = { message };
    if (currentConversationId) {
      body.conversation_id = currentConversationId;
    }

    const response = await fetch(`${API_BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const rawText = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error("Invalid JSON response");
    }

    if (!response.ok) {
      const errorMessage = payload?.error || payload?.detail || "Request failed";
      throw new Error(errorMessage);
    }
    removeLoadingMessage();
    addMessage(payload.response_text, "assistant");
    try {
      showVisualization(payload.visualization);
    } catch (error) {
      console.warn("Visualization render failed:", error);
      showVisualization(null);
    }

    if (payload.conversation_id && payload.conversation_id !== currentConversationId) {
      currentConversationId = payload.conversation_id;
      loadConversations();
    }
  } catch (error) {
    console.error("Chat request failed:", error);
    removeLoadingMessage();
    showError(error.message || "Sorry, the server did not respond. Make sure the API is running.");
    addMessage("An error occurred. Please try again.", "assistant");
    showVisualization(null);
  } finally {
    showLoading(false);
  }
};

if (form) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    sendMessage(input.value.trim());
  });
}

if (newConversationBtn) {
  newConversationBtn.addEventListener("click", startNewConversation);
}

// =============================================================================
// Mind Map Tab
// =============================================================================
const conceptSelect = document.getElementById("concept-select");
const loadMindmapBtn = document.getElementById("load-mindmap");
const mindmapContainer = document.getElementById("mindmap-container");
const conceptDetails = document.getElementById("concept-details");

const loadConceptsForMindmap = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/concepts`);
    if (!response.ok) throw new Error("Failed to load concepts");
    const data = await response.json();

    conceptSelect.innerHTML = "";
    data.concepts.forEach(c => {
      const option = document.createElement("option");
      option.value = c.slug;
      option.textContent = `${c.name} (${c.category || "general"})`;
      conceptSelect.appendChild(option);
    });
  } catch (error) {
    showError("Failed to load concepts");
  }
};

const renderMindMap = (data) => {
  mindmapContainer.innerHTML = "";
  conceptDetails.innerHTML = "";

  const width = mindmapContainer.clientWidth;
  const height = mindmapContainer.clientHeight || 500;

  const svg = d3.select(mindmapContainer)
    .append("svg")
    .attr("width", width)
    .attr("height", height);

  const simulation = d3.forceSimulation(data.nodes)
    .force("link", d3.forceLink(data.links).id(d => d.id).distance(80))
    .force("charge", d3.forceManyBody().strength(-200))
    .force("center", d3.forceCenter(width / 2, height / 2));

  const link = svg.append("g")
    .selectAll("line")
    .data(data.links)
    .enter().append("line")
    .attr("stroke", "#cbd5f5")
    .attr("stroke-width", 2);

  const node = svg.append("g")
    .selectAll("g")
    .data(data.nodes)
    .enter().append("g")
    .call(d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended));

  node.append("circle")
    .attr("r", d => d.is_target ? 20 : 12)
    .attr("fill", d => {
      if (d.is_target) return "#2563eb";
      if (d.level === 0) return "#8b5cf6";
      if (d.level === 1) return "#10b981";
      return "#f59e0b";
    })
    .attr("stroke", "#fff")
    .attr("stroke-width", 2);

  node.append("text")
    .text(d => d.name)
    .attr("x", 15)
    .attr("y", 4)
    .attr("font-size", "12px")
    .attr("fill", "#1e293b");

  node.on("click", (event, d) => {
    showConceptDetails(d);
  });

  simulation.on("tick", () => {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node.attr("transform", d => `translate(${d.x},${d.y})`);
  });

  function dragstarted(event) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
  }

  function dragged(event) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
  }

  function dragended(event) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
  }
};

const showConceptDetails = (concept) => {
  conceptDetails.innerHTML = `
    <h3>${concept.name}</h3>
    <p>${concept.description || "No description available."}</p>
    ${concept.euclid_ref ? `<p class="euclid-ref">Euclid's Elements: ${concept.euclid_ref}</p>` : ""}
    <p><strong>Level:</strong> ${concept.level} | <strong>Category:</strong> ${concept.category}</p>
    <div style="margin-top:10px;">
      <button type="button" id="concept-open-learning-path" class="btn-primary">Open Learning Path</button>
    </div>
  `;
  const openBtn = document.getElementById("concept-open-learning-path");
  if (openBtn) {
    openBtn.addEventListener("click", () => openLearningPathForConcept(concept));
  }
};

const openLearningPathForConcept = async (concept) => {
  if (!concept) return;
  switchToTab("collections");
  const query = `${concept.id || ""} ${concept.name || ""}`.trim();
  if (collectionsSearch) {
    collectionsSearch.value = query;
  }
  await loadPromptCollections();
  showError(`Loaded prompt paths for: ${concept.name}`);
};

loadMindmapBtn.addEventListener("click", async () => {
  const slug = conceptSelect.value;
  if (!slug) return;

  showLoading(true);
  try {
    const response = await fetch(`${API_BASE}/api/mindmap/${slug}?depth=3`);
    if (!response.ok) throw new Error("Failed to load mind map");
    const data = await response.json();
    renderMindMap(data);
  } catch (error) {
    showError("Failed to load mind map");
  } finally {
    showLoading(false);
  }
});

// =============================================================================
// Euclid Tab
// =============================================================================
const euclidBook = document.getElementById("euclid-book");
const euclidType = document.getElementById("euclid-type");
const euclidSearch = document.getElementById("euclid-search");
const searchEuclidBtn = document.getElementById("search-euclid");
const euclidResults = document.getElementById("euclid-results");

const searchEuclid = async () => {
  const params = new URLSearchParams();
  if (euclidBook.value) params.append("book", euclidBook.value);
  if (euclidType.value) params.append("entry_type", euclidType.value);
  if (euclidSearch.value) params.append("query", euclidSearch.value);

  showLoading(true);
  try {
    const response = await fetch(`${API_BASE}/api/euclid?${params}`);
    if (!response.ok) throw new Error("Failed to search");
    const data = await response.json();
    renderEuclidResults(data.entries);
  } catch (error) {
    showError("Failed to search Euclid's Elements");
  } finally {
    showLoading(false);
  }
};

const renderEuclidResults = (entries) => {
  euclidResults.innerHTML = "";
  if (entries.length === 0) {
    euclidResults.innerHTML = '<div class="viz-placeholder">No entries found.</div>';
    return;
  }

  entries.forEach(e => {
    const div = document.createElement("div");
    div.className = "euclid-entry";
    div.innerHTML = `
      <span class="ref">${e.reference}</span>
      <span class="type">${e.entry_type}</span>
      <p class="original">"${e.original_text}"</p>
      ${e.modern_text ? `<p class="modern">${e.modern_text}</p>` : ""}
    `;
    euclidResults.appendChild(div);
  });
};

searchEuclidBtn.addEventListener("click", searchEuclid);
euclidSearch.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchEuclid();
});

// =============================================================================
// Resources Tab
// =============================================================================
const resourceType = document.getElementById("resource-type");
const resourceDifficulty = document.getElementById("resource-difficulty");
const resourceSearch = document.getElementById("resource-search");
const searchResourcesBtn = document.getElementById("search-resources");
const resourceResults = document.getElementById("resource-results");
const matrixSize = document.getElementById("matrix-size");
const matrixOperation = document.getElementById("matrix-operation");
const matrixPracticeMode = document.getElementById("matrix-practice-mode");
const matrixCompute = document.getElementById("matrix-compute");
const matrixCheckWork = document.getElementById("matrix-check-work");
const matrixExample = document.getElementById("matrix-example");
const matrixReset = document.getElementById("matrix-reset");
const matrixFeedback = document.getElementById("matrix-feedback");
const matrixResults = document.getElementById("matrix-results");
const matrixPlot = document.getElementById("matrix-plot");
const collectionsCategory = document.getElementById("collections-category");
const collectionsSearch = document.getElementById("collections-search");
const collectionsRefresh = document.getElementById("collections-refresh");
const collectionsSummary = document.getElementById("collections-summary");
const collectionsResults = document.getElementById("collections-results");

const searchResources = async () => {
  const params = new URLSearchParams();
  if (resourceType.value) params.append("resource_type", resourceType.value);
  if (resourceDifficulty.value) params.append("difficulty", resourceDifficulty.value);
  if (resourceSearch.value) params.append("query", resourceSearch.value);

  showLoading(true);
  try {
    const response = await fetch(`${API_BASE}/api/resources?${params}`);
    if (!response.ok) throw new Error("Failed to search");
    const data = await response.json();
    renderResourceResults(data.resources);
  } catch (error) {
    showError("Failed to search resources");
  } finally {
    showLoading(false);
  }
};

const matrixInput = (id, fallback = 0) => {
  const el = document.getElementById(id);
  const value = Number(el?.value);
  return Number.isFinite(value) ? value : fallback;
};

const currentMatrixSize = () => Number(matrixSize?.value) === 3 ? 3 : 2;

const readMatrixByPrefix = (prefix, size) => {
  const m = [];
  for (let i = 1; i <= size; i += 1) {
    const row = [];
    for (let j = 1; j <= size; j += 1) {
      const fallback = i === j ? 1 : 0;
      row.push(matrixInput(`${prefix}-${i}${j}`, fallback));
    }
    m.push(row);
  }
  return m;
};

const readVectorByPrefix = (prefix, size, defaults = [1, 1, 1]) => {
  const ids = [`${prefix}-x`, `${prefix}-y`, `${prefix}-z`];
  const out = [];
  for (let i = 0; i < size; i += 1) {
    out.push(matrixInput(ids[i], defaults[i] ?? 0));
  }
  return out;
};

const readMatrixA = () => readMatrixByPrefix("matrix-a", currentMatrixSize());
const readMatrixB = () => readMatrixByPrefix("matrix-b", currentMatrixSize());
const readPredictedMatrixC = () => readMatrixByPrefix("matrix-c", currentMatrixSize());
const readVectorV = () => readVectorByPrefix("matrix-v", currentMatrixSize(), [1, 1, 1]);
const readPredictedCv = () => readVectorByPrefix("matrix-cv", currentMatrixSize(), [0, 0, 0]);

const addMatricesN = (a, b) => a.map((row, i) => row.map((value, j) => value + b[i][j]));
const subtractMatricesN = (a, b) => a.map((row, i) => row.map((value, j) => value - b[i][j]));
const multiplyMatricesN = (a, b) => a.map((row, i) => row.map((_, j) =>
  row.reduce((sum, __, k) => sum + a[i][k] * b[k][j], 0)
));
const applyMatrixToVectorN = (m, v) => m.map((row) => row.reduce((sum, value, i) => sum + value * v[i], 0));

const formatMatrixN = (m) => {
  const rows = m.map((row) =>
    `<tr>${row.map((value) => `<td style="padding:2px 8px;">${Number(value).toFixed(2)}</td>`).join("")}</tr>`
  ).join("");
  return `<table style="border-collapse:collapse; font-family:ui-monospace, monospace;">${rows}</table>`;
};

const formatVectorN = (v) => `(${v.map((n) => Number(n).toFixed(2)).join(", ")})`;

let matrixPracticePassed = false;

const approxEq = (a, b, eps = 1e-6) => Math.abs((a || 0) - (b || 0)) <= eps;

const byHandStepsHtml = (a, b, op, v) => {
  const n = a.length;
  const termsFor = (i, j) => {
    const terms = [];
    for (let k = 0; k < n; k += 1) terms.push(`(${a[i][k]})(${b[k][j]})`);
    return terms.join(" + ");
  };
  const addSubFor = (i, j, symbol) => `${a[i][j]} ${symbol} ${b[i][j]}`;
  const matrixLines = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      const label = `C${i + 1}${j + 1}`;
      if (op === "multiply") matrixLines.push(`<div>${label} = ${termsFor(i, j)}</div>`);
      else matrixLines.push(`<div>${label} = ${addSubFor(i, j, op === "subtract" ? "-" : "+")}</div>`);
    }
  }
  const vectorLines = [];
  for (let i = 0; i < n; i += 1) {
    const axis = ["x", "y", "z"][i] || `c${i + 1}`;
    const terms = [];
    for (let j = 0; j < n; j += 1) {
      terms.push(`C${i + 1}${j + 1}·(${v[j]})`);
    }
    vectorLines.push(`<div>${axis}' = ${terms.join(" + ")}</div>`);
  }
  if (op === "multiply") {
    return `
      <div><strong>Compute C = A × B by hand:</strong></div>
      ${matrixLines.join("")}
      <div style="margin-top:8px;"><strong>Then compute C·v:</strong></div>
      ${vectorLines.join("")}
    `;
  }
  const symbol = op === "subtract" ? "-" : "+";
  return `
    <div><strong>Compute C = A ${symbol} B by hand:</strong></div>
    ${matrixLines.join("")}
    <div style="margin-top:8px;"><strong>Then compute C·v:</strong></div>
    ${vectorLines.join("")}
  `;
};

const vectorTrace = (vec, color, name) => ({
  type: "scatter",
  mode: "lines+markers",
  x: [0, vec[0]],
  y: [0, vec[1]],
  line: { color, width: 3 },
  marker: { color, size: 8 },
  name
});

const transformPoint = (m, p) => [
  m[0][0] * p[0] + m[0][1] * p[1],
  m[1][0] * p[0] + m[1][1] * p[1]
];

const renderMatrixLabPlot = (a, b, c, v) => {
  if (!matrixPlot || !window.Plotly) return;
  const n = c.length;
  const avRaw = applyMatrixToVectorN(a, v);
  const bvRaw = applyMatrixToVectorN(b, v);
  const cvRaw = applyMatrixToVectorN(c, v);
  const projectXY = (vec) => {
    if (n === 2) return [vec[0], vec[1]];
    const z = Math.abs(vec[2]) < 1e-8 ? 1 : vec[2];
    return [vec[0] / z, vec[1] / z];
  };
  const av = projectXY(avRaw);
  const bv = projectXY(bvRaw);
  const cv = projectXY(cvRaw);
  const vxy = projectXY(v);

  const square = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
  const tsquare = square.map((p) => {
    if (n === 2) return transformPoint(c, p);
    const out = applyMatrixToVectorN(c, [p[0], p[1], 1]);
    return projectXY(out);
  });
  const values = [
    ...square.flat(),
    ...tsquare.flat(),
    ...vxy, ...av, ...bv, ...cv
  ];
  const maxAbs = Math.max(2, ...values.map((n) => Math.abs(n)));
  const axisRange = [-Math.ceil(maxAbs + 1), Math.ceil(maxAbs + 1)];

  const traces = [
    {
      type: "scatter",
      mode: "lines",
      x: square.map((p) => p[0]),
      y: square.map((p) => p[1]),
      line: { color: "#94a3b8", dash: "dot", width: 2 },
      name: "Unit Square"
    },
    {
      type: "scatter",
      mode: "lines",
      fill: "toself",
      x: tsquare.map((p) => p[0]),
      y: tsquare.map((p) => p[1]),
      line: { color: "#f59e0b", width: 2 },
      fillcolor: "rgba(245, 158, 11, 0.18)",
      name: "C-transform(Unit Square)"
    },
    vectorTrace(vxy, "#475569", "v"),
    vectorTrace(av, "#2563eb", "A·v"),
    vectorTrace(bv, "#7c3aed", "B·v"),
    vectorTrace(cv, "#dc2626", "C·v"),
  ];

  const layout = {
    title: n === 3
      ? "Vector outputs on x-y grid (3x3 projected with homogeneous coordinates)"
      : "Vector outputs on x-y coordinate grid",
    paper_bgcolor: "#ffffff",
    plot_bgcolor: "#ffffff",
    xaxis: { range: axisRange, zeroline: true, gridcolor: "#e2e8f0", title: "x", scaleanchor: "y", scaleratio: 1 },
    yaxis: { range: axisRange, zeroline: true, gridcolor: "#e2e8f0", title: "y" },
    legend: { orientation: "h", y: 1.1 },
    margin: { l: 50, r: 20, t: 70, b: 45 },
  };
  Plotly.newPlot(matrixPlot, traces, layout, { displayModeBar: false, responsive: true });
};

const computeMatrixLab = () => {
  const a = readMatrixA();
  const b = readMatrixB();
  const v = readVectorV();
  const op = matrixOperation?.value || "add";
  const n = currentMatrixSize();
  const c = op === "subtract"
    ? subtractMatricesN(a, b)
    : op === "multiply"
      ? multiplyMatricesN(a, b)
      : addMatricesN(a, b);

  const av = applyMatrixToVectorN(a, v);
  const bv = applyMatrixToVectorN(b, v);
  const cv = applyMatrixToVectorN(c, v);
  const opLabel = op === "subtract" ? "A - B" : op === "multiply" ? "A × B" : "A + B";
  const practiceMode = !!matrixPracticeMode?.checked;
  const revealAnswers = !practiceMode || matrixPracticePassed;

  if (matrixResults) {
    matrixResults.innerHTML = `
      <h3>Computed Outputs</h3>
      <p><strong>Operation:</strong> C = ${opLabel}</p>
      <div class="tutor-context-hint" style="margin-bottom:8px;">
        ${practiceMode && !matrixPracticePassed
          ? "Practice mode is ON. Final answers are hidden until your check passes."
          : "Answers are visible."}
      </div>
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start;">
        <div><strong>A</strong>${formatMatrixN(a)}</div>
        <div><strong>B</strong>${formatMatrixN(b)}</div>
        <div><strong>C</strong>${revealAnswers ? formatMatrixN(c) : "<div style='padding:8px 0; color:#64748b;'>Hidden (solve by hand first)</div>"}</div>
      </div>
      <p style="margin-top:10px;"><strong>Dimension:</strong> ${n}×${n}</p>
      <p><strong>v</strong> = ${formatVectorN(v)}</p>
      <p><strong>A·v</strong> = ${formatVectorN(av)} | <strong>B·v</strong> = ${formatVectorN(bv)} | <strong>C·v</strong> = ${revealAnswers ? formatVectorN(cv) : "Hidden"}</p>
      <div style="margin-top:10px;"><strong>By-hand steps</strong>${byHandStepsHtml(a, b, op, v)}</div>
    `;
  }

  renderMatrixLabPlot(a, b, c, v);
};

const checkMatrixWork = () => {
  const a = readMatrixA();
  const b = readMatrixB();
  const v = readVectorV();
  const op = matrixOperation?.value || "add";
  const n = currentMatrixSize();
  const c = op === "subtract"
    ? subtractMatricesN(a, b)
    : op === "multiply"
      ? multiplyMatricesN(a, b)
      : addMatricesN(a, b);
  const cv = applyMatrixToVectorN(c, v);
  const predictedC = readPredictedMatrixC();
  const predictedCv = readPredictedCv();

  const cells = [];
  for (let i = 0; i < n; i += 1) {
    for (let j = 0; j < n; j += 1) {
      cells.push([`C${i + 1}${j + 1}`, predictedC[i][j], c[i][j]]);
    }
  }
  const axes = ["x", "y", "z"];
  for (let i = 0; i < n; i += 1) {
    cells.push([`C·v ${axes[i] || `c${i + 1}`}`, predictedCv[i], cv[i]]);
  }
  const wrong = cells.filter(([, got, expected]) => !approxEq(got, expected));
  matrixPracticePassed = wrong.length === 0;

  if (matrixFeedback) {
    if (matrixPracticePassed) {
      matrixFeedback.textContent = "Excellent. Your by-hand solution is correct. Answers unlocked.";
      matrixFeedback.style.color = "#065f46";
    } else {
      const hints = wrong.slice(0, 3).map(([name, got, expected]) =>
        `${name}: expected ${expected.toFixed(2)} (you entered ${Number(got).toFixed(2)})`
      );
      matrixFeedback.textContent = `Keep going. ${wrong.length} value(s) need correction. ${hints.join(" | ")}`;
      matrixFeedback.style.color = "#92400e";
    }
  }
  computeMatrixLab();
};

const loadMatrixLabExample = () => {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = String(value);
  };
  const n = currentMatrixSize();
  if (n === 3) {
    // Homogeneous affine example: shear then translate.
    set("matrix-a-11", 1); set("matrix-a-12", 0.5); set("matrix-a-13", 0);
    set("matrix-a-21", 0); set("matrix-a-22", 1); set("matrix-a-23", 0);
    set("matrix-a-31", 0); set("matrix-a-32", 0); set("matrix-a-33", 1);
    set("matrix-b-11", 1); set("matrix-b-12", 0); set("matrix-b-13", 2);
    set("matrix-b-21", 0); set("matrix-b-22", 1); set("matrix-b-23", 1);
    set("matrix-b-31", 0); set("matrix-b-32", 0); set("matrix-b-33", 1);
    set("matrix-v-x", 1); set("matrix-v-y", 2); set("matrix-v-z", 1);
  } else {
    // Shear + stretch example (2x2).
    set("matrix-a-11", 1); set("matrix-a-12", 1);
    set("matrix-a-21", 0); set("matrix-a-22", 1);
    set("matrix-b-11", 2); set("matrix-b-12", 0);
    set("matrix-b-21", 0); set("matrix-b-22", 1);
    set("matrix-v-x", 1); set("matrix-v-y", 2);
  }
  set("matrix-c-11", 0); set("matrix-c-12", 0); set("matrix-c-13", 0);
  set("matrix-c-21", 0); set("matrix-c-22", 0); set("matrix-c-23", 0);
  set("matrix-c-31", 0); set("matrix-c-32", 0); set("matrix-c-33", 1);
  set("matrix-cv-x", 0); set("matrix-cv-y", 0); set("matrix-cv-z", 0);
  if (matrixOperation) matrixOperation.value = "multiply";
  matrixPracticePassed = false;
  if (matrixFeedback) {
    matrixFeedback.textContent = "Example loaded. Try solving by hand before reveal.";
    matrixFeedback.style.color = "#475569";
  }
  computeMatrixLab();
};

const resetMatrixLab = () => {
  const ids = [
    "matrix-a-11", "matrix-a-12", "matrix-a-13", "matrix-a-21", "matrix-a-22", "matrix-a-23", "matrix-a-31", "matrix-a-32", "matrix-a-33",
    "matrix-b-11", "matrix-b-12", "matrix-b-13", "matrix-b-21", "matrix-b-22", "matrix-b-23", "matrix-b-31", "matrix-b-32", "matrix-b-33",
    "matrix-c-11", "matrix-c-12", "matrix-c-13", "matrix-c-21", "matrix-c-22", "matrix-c-23", "matrix-c-31", "matrix-c-32", "matrix-c-33",
    "matrix-v-x", "matrix-v-y", "matrix-v-z",
    "matrix-cv-x", "matrix-cv-y", "matrix-cv-z"
  ];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = id.endsWith("11") || id.endsWith("22") || id.endsWith("33") ? "1" : "0";
  });
  const vx = document.getElementById("matrix-v-x");
  const vy = document.getElementById("matrix-v-y");
  const vz = document.getElementById("matrix-v-z");
  if (vx) vx.value = "1";
  if (vy) vy.value = "1";
  if (vz) vz.value = "1";
  if (matrixSize) matrixSize.value = "2";
  updateMatrixLabVisibility();
  if (matrixOperation) matrixOperation.value = "add";
  if (matrixPracticeMode) matrixPracticeMode.checked = true;
  matrixPracticePassed = false;
  if (matrixFeedback) {
    matrixFeedback.textContent = "Waiting for your attempt.";
    matrixFeedback.style.color = "#64748b";
  }
  if (matrixResults) matrixResults.innerHTML = '<div class="viz-placeholder">Run an operation to view matrix and vector outputs.</div>';
  if (matrixPlot) matrixPlot.innerHTML = '<div class="viz-placeholder">Transformation grid will appear here.</div>';
};

const updateMatrixLabVisibility = () => {
  const tab = document.getElementById("tab-matrixlab");
  if (!tab) return;
  tab.classList.toggle("matrix-size-2", currentMatrixSize() === 2);
};

const loadMatrixLab = () => {
  updateMatrixLabVisibility();
  // Render once on first open if not already drawn.
  if (matrixResults && matrixResults.querySelector(".viz-placeholder")) {
    computeMatrixLab();
  }
};

const renderPromptCollections = (payload, query = "") => {
  if (!collectionsResults || !collectionsSummary) return;
  const categories = payload?.categories || [];
  const q = (query || "").trim().toLowerCase();
  const filtered = categories.map((cat) => {
    const topics = (cat.topics || []).filter((topic) => {
      if (!q) return true;
      if ((topic.topic_name || "").toLowerCase().includes(q)) return true;
      return (topic.prompts || []).some((p) => String(p).toLowerCase().includes(q));
    });
    return { ...cat, topics };
  }).filter((cat) => cat.topics.length > 0);

  collectionsSummary.textContent = `Categories: ${filtered.length} • Topics: ${payload.total_topics} • Prompts: ${payload.total_prompts}`;
  if (!filtered.length) {
    collectionsResults.innerHTML = '<div class="viz-placeholder">No prompt collections match your filter.</div>';
    return;
  }

  collectionsResults.innerHTML = filtered.map((cat) => {
    const topicsHtml = cat.topics.map((topic) => {
      const prompts = (topic.prompts || []).map((prompt, idx) => (
        `<button type="button" class="btn-secondary collection-prompt-btn" data-prompt="${encodeURIComponent(prompt)}">${idx + 1}. ${prompt}</button>`
      )).join("");
      return `
        <div class="agent-card">
          <div><strong>${topic.icon || "•"} ${topic.topic_name}</strong></div>
          <div class="agent-details" style="margin-top:8px; display:flex; flex-direction:column; gap:6px;">${prompts}</div>
        </div>
      `;
    }).join("");
    return `
      <div class="concept-details">
        <h3 style="color:${cat.color || "#2563eb"}">${cat.category_name}</h3>
        <p>Topics: ${cat.topic_count} • Prompts: ${cat.prompt_count}</p>
        <div style="display:flex; flex-direction:column; gap:10px;">${topicsHtml}</div>
      </div>
    `;
  }).join("");

  collectionsResults.querySelectorAll(".collection-prompt-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const prompt = decodeURIComponent(btn.dataset.prompt || "");
      if (!prompt) return;
      switchToTab("tutor");
      if (tutorInput) tutorInput.value = prompt;
      await sendTutorQuestion(prompt);
    });
  });
};

const loadPromptCollections = async () => {
  if (!collectionsResults) return;
  const category = collectionsCategory?.value || "";
  const params = new URLSearchParams();
  if (category) params.set("category_id", category);
  try {
    const response = await fetch(`${API_BASE}/api/prompt-collections?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to load prompt collections");
    const payload = await response.json();
    if (collectionsCategory && collectionsCategory.options.length <= 1) {
      const allCats = payload.categories || [];
      allCats.forEach((cat) => {
        const opt = document.createElement("option");
        opt.value = cat.category_id;
        opt.textContent = cat.category_name;
        collectionsCategory.appendChild(opt);
      });
    }
    renderPromptCollections(payload, collectionsSearch?.value || "");
  } catch (error) {
    collectionsResults.innerHTML = '<div class="viz-placeholder">Failed to load prompt collections.</div>';
  }
};

// =============================================================================
// Local Tutor Tab
// =============================================================================
const tutorForm = document.getElementById("tutor-form");
const tutorInput = document.getElementById("tutor-input");
const tutorResponseMode = document.getElementById("tutor-response-mode");
const tutorLearnerLevel = document.getElementById("tutor-learner-level");
const tutorSolution = document.getElementById("tutor-solution");
const tutorViz = document.getElementById("tutor-viz");
const tutorSend = document.getElementById("tutor-send");
const tutorFollowups = document.getElementById("tutor-followups");
const tutorRenderDiagram = document.getElementById("tutor-render-diagram");
const tutorRenderAnimation = document.getElementById("tutor-render-animation");
const tutorGenerateImage = document.getElementById("tutor-generate-image");
const tutorGenerateMusic = document.getElementById("tutor-generate-music");
const tutorJobsRefresh = document.getElementById("tutor-jobs-refresh");
const tutorJobsList = document.getElementById("tutor-jobs-list");
const scratchpadCanvas = document.getElementById("scratchpad-canvas");
const scratchpadPen = document.getElementById("scratchpad-pen");
const scratchpadEraser = document.getElementById("scratchpad-eraser");
const scratchpadUndo = document.getElementById("scratchpad-undo");
const scratchpadClear = document.getElementById("scratchpad-clear");
const scratchpadConvert = document.getElementById("scratchpad-convert");
const scratchpadValidate = document.getElementById("scratchpad-validate");
const scratchpadText = document.getElementById("scratchpad-text");
const scratchpadResult = document.getElementById("scratchpad-result");
const latexMode = document.getElementById("latex-mode");
const latexInput = document.getElementById("latex-input");
const latexPreview = document.getElementById("latex-preview");
const latexStatus = document.getElementById("latex-status");
const latexTemplateFrac = document.getElementById("latex-template-frac");
const latexTemplateSqrt = document.getElementById("latex-template-sqrt");
const latexTemplateMatrix = document.getElementById("latex-template-matrix");
const latexInsertTutor = document.getElementById("latex-insert-tutor");
const latexInsertScratchpad = document.getElementById("latex-insert-scratchpad");
const latexCopy = document.getElementById("latex-copy");

let lastTutorQuestion = "";
let tutorHistory = [];
let tutorSessionId = localStorage.getItem("ew_tutor_session_id") || "";
let scratchpadMode = "pen";
let scratchpadDrawing = false;
let scratchpadCtx = null;
let scratchpadUndoStack = [];

const insertTextAtCursor = (el, text) => {
  if (!el) return;
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const before = el.value.slice(0, start);
  const after = el.value.slice(end);
  el.value = `${before}${text}${after}`;
  const cursor = start + text.length;
  el.focus();
  el.setSelectionRange(cursor, cursor);
};

const latexDelimiterWrap = (source) => {
  const raw = String(source || "").trim();
  if (!raw) return "";
  const mode = latexMode?.value === "display" ? "display" : "inline";
  return mode === "display" ? `\\[${raw}\\]` : `\\(${raw}\\)`;
};

const setLatexStatus = (message, color = "#475569") => {
  if (!latexStatus) return;
  latexStatus.textContent = message;
  latexStatus.style.color = color;
};

const renderLatexEditorPreview = () => {
  if (!latexPreview) return;
  const expr = (latexInput?.value || "").trim();
  if (!expr) {
    latexPreview.innerHTML = '<div class="viz-placeholder">Live LaTeX preview appears here.</div>';
    setLatexStatus("");
    return;
  }
  if (!window.katex || typeof window.katex.render !== "function") {
    latexPreview.textContent = expr;
    setLatexStatus("KaTeX not available. Showing raw text preview.", "#92400e");
    return;
  }
  try {
    window.katex.render(expr, latexPreview, {
      throwOnError: false,
      displayMode: latexMode?.value === "display",
      strict: "ignore"
    });
    setLatexStatus("Preview updated.");
  } catch (error) {
    latexPreview.textContent = expr;
    setLatexStatus(`LaTeX parse warning: ${error.message || "invalid expression"}`, "#92400e");
  }
};

const insertLatexTemplate = (template) => {
  if (!latexInput) return;
  insertTextAtCursor(latexInput, template);
  renderLatexEditorPreview();
};

const insertDelimitedLatexInto = (target, label) => {
  if (!target) {
    showError(`${label} is not available.`);
    return;
  }
  const wrapped = latexDelimiterWrap(latexInput?.value || "");
  if (!wrapped) {
    showError("Type a LaTeX expression first.");
    return;
  }
  const spacer = target.value && !/\s$/.test(target.value) ? " " : "";
  insertTextAtCursor(target, `${spacer}${wrapped}`);
  setLatexStatus(`Inserted into ${label}.`, "#065f46");
};

const copyLatexExpression = async () => {
  const expr = (latexInput?.value || "").trim();
  if (!expr) {
    showError("Type a LaTeX expression first.");
    return;
  }
  const wrapped = latexDelimiterWrap(expr);
  try {
    await navigator.clipboard.writeText(wrapped);
    setLatexStatus("Copied delimited LaTeX to clipboard.", "#065f46");
  } catch (error) {
    showError("Clipboard write failed. Copy manually from the editor.");
  }
};

const initLatexEditor = () => {
  if (!latexInput) return;
  renderLatexEditorPreview();
};

const MUSIC_LAB_GAMES = {
  dice: ["mozart", "dice game", "würfelspiel", "musikalisches", "aleatory"],
  harmonics: ["harmonic series", "overtone", "fourier", "timbre", "consonance", "frequency ratio"],
  euclidean: ["euclidean rhythm", "polyrhythm", "modular arithmetic", "rhythm", "meter", "african drum"],
  fibonacci: ["fibonacci", "golden ratio", "pentatonic", "musical scale", "bartók"],
  pythagorean: ["pythagorean tuning", "temperament", "comma", "chromatic scale", "12-tone", "equal temperament"]
};

const addMusicLabLink = (container, question) => {
  const q = (question || "").toLowerCase();
  for (const [game, keywords] of Object.entries(MUSIC_LAB_GAMES)) {
    if (keywords.some((kw) => q.includes(kw))) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "♫ Try it in Music Lab";
      btn.style.cssText = "background:#1c1917;color:#fafaf9;border:none;padding:6px 14px;border-radius:999px;font-size:12px;cursor:pointer;";
      btn.addEventListener("click", () => {
        switchToTab("musiclab");
        setTimeout(() => {
          const gameBtn = document.querySelector(`.music-game-btn[data-game="${game}"]`);
          if (gameBtn) gameBtn.click();
        }, 100);
      });
      container.appendChild(btn);
      break;
    }
  }
};

const renderTutorFollowups = (question) => {
  if (!tutorFollowups) return;
  const base = (question || "").trim();
  if (!base) {
    tutorFollowups.innerHTML = "";
    return;
  }
  const prompts = [
    `Explain ${base} in simpler terms with one analogy.`,
    `Give me a worked example for: ${base}`,
    `Ask me 2 quick questions to test my understanding of: ${base}`,
    `Now explain ${base} more rigorously and axiomatically.`
  ];
  tutorFollowups.innerHTML = "";
  prompts.forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = p;
    btn.addEventListener("click", () => sendTutorQuestion(p));
    tutorFollowups.appendChild(btn);
  });
  addMusicLabLink(tutorFollowups, base);
};

const renderTutorFollowupsFromPayload = (question, payload) => {
  const suggested = Array.isArray(payload?.next_questions) ? payload.next_questions : [];
  if (!suggested.length) {
    renderTutorFollowups(question);
    return;
  }
  if (!tutorFollowups) return;
  tutorFollowups.innerHTML = "";
  suggested.slice(0, 5).forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = p;
    btn.addEventListener("click", () => sendTutorQuestion(p));
    tutorFollowups.appendChild(btn);
  });
  addMusicLabLink(tutorFollowups, question);
};

const buildTutorMarkdown = (payload) => {
  const steps = payload.explanation || payload.steps || [];
  if (Array.isArray(steps) && steps.length > 0) {
    const lines = steps.map((step, idx) => {
      if (typeof step === "string") return `${idx + 1}. ${step}`;
      if (step && typeof step === "object") {
        return `${idx + 1}. ${step.text || step.description || JSON.stringify(step)}`;
      }
      return `${idx + 1}. ${String(step)}`;
    });
    return lines.join("\n");
  }
  if (typeof payload.solution === "string") return payload.solution;
  return "";
};

const renderTutorSolution = (payloadOrText) => {
  if (!payloadOrText) {
    tutorSolution.innerHTML = '<div class="viz-placeholder">Your step-by-step solution will appear here.</div>';
    return;
  }

  let renderedText = "";
  if (typeof payloadOrText === "string") {
    const parsed = tryParseJson(payloadOrText);
    if (parsed) {
      renderedText = formatTutorOutput(parsed) || buildTutorMarkdown(parsed);
    } else {
      renderedText = payloadOrText.replace(/^```json\s*/i, "").replace(/```$/, "");
    }
  } else {
    renderedText = formatTutorOutput(payloadOrText);
  }

  try {
    tutorSolution.innerHTML = parseMarkdown(
      replaceGreekNamesOutsideMath(normalizeLatexDelimiters(renderedText))
    );
  } catch (error) {
    tutorSolution.textContent = renderedText;
  }

  if (window.renderMathInElement) {
    try {
      renderMathInElement(tutorSolution, {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ],
        throwOnError: false,
        strict: "ignore"
      });
    } catch (err) {
      console.warn("Tutor math render failed:", err);
      tutorSolution.innerHTML = degradeMathMarkup(tutorSolution.innerHTML);
    }
  } else {
    tutorSolution.innerHTML = degradeMathMarkup(tutorSolution.innerHTML);
  }
};

const ensureTutorSession = async () => {
  if (tutorSessionId) return tutorSessionId;
  try {
    const resp = await fetch(`${API_BASE}/api/context/session`, { method: "POST" });
    if (resp.ok) {
      const data = await resp.json();
      tutorSessionId = data.session_id;
      localStorage.setItem("ew_tutor_session_id", tutorSessionId);
    }
  } catch (e) {
    console.warn("Could not create context session:", e);
  }
  return tutorSessionId;
};

const sendTutorQuestion = async (question) => {
  if (!question || isLoading) return;
  showLoading(true);
  tutorSend.disabled = true;
  tutorInput.disabled = true;
  lastTutorQuestion = question;
  tutorHistory.push({ role: "user", content: question });
  renderTutorSolution("Generating solution...");
  showVisualizationIn(tutorViz, null);

  try {
    await ensureTutorSession();

    const compactHistory = tutorHistory.slice(-6).map((msg) => ({
      role: msg.role,
      content: String(msg.content || "").slice(0, 1200)
    }));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);
    const response = await fetch(`${API_BASE}/api/ai/tutor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        history: compactHistory,
        session_id: tutorSessionId || undefined,
        response_mode: tutorResponseMode?.value || "both",
        learner_level: tutorLearnerLevel?.value || "teen"
      }),
      signal: controller.signal
    });
    clearTimeout(timeout);
    const rawText = await response.text();
    let payload = null;
    try {
      payload = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error("Invalid JSON response");
    }

    if (!response.ok) {
      const errorMessage = payload?.detail || payload?.error || "Tutor request failed";
      throw new Error(errorMessage);
    }

    renderTutorSolution(payload);
    showVisualizationIn(tutorViz, payload.visualization);
    tutorHistory.push({ role: "assistant", content: payload.solution || "" });
    renderTutorFollowupsFromPayload(question, payload);
    updateContextStatus();
  } catch (error) {
    // Retry via static chat pipeline if tutor request hangs/times out.
    if (error?.name === "AbortError") {
      try {
        const fallbackResp = await fetch(`${API_BASE}/api/chat/message`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: question })
        });
        const fallbackPayload = await fallbackResp.json();
        if (fallbackResp.ok) {
          renderTutorSolution({
            solution: fallbackPayload.response_text || "Here is a quick explanation.",
            visualization: fallbackPayload.visualization,
            needs_visualization: !!fallbackPayload.visualization
          });
          showVisualizationIn(tutorViz, fallbackPayload.visualization);
          tutorHistory.push({ role: "assistant", content: fallbackPayload.response_text || "" });
          showError("Tutor timed out once; served a quick fallback explanation.");
          return;
        }
      } catch (fallbackErr) {
        console.warn("Fallback tutor request failed:", fallbackErr);
      }
    }

    showError(error.message || "Local tutor is not available.");
    renderTutorSolution("Local tutor is not available.");
    showVisualizationIn(tutorViz, null);
  } finally {
    tutorSend.disabled = false;
    tutorInput.disabled = false;
    showLoading(false);
  }
};

const renderOnDemandVisualization = async (style) => {
  if (!lastTutorQuestion) {
    showError("Ask a question first.");
    return;
  }
  const button = style === "animation" ? tutorRenderAnimation : tutorRenderDiagram;
  const label = style === "animation" ? "animation" : "diagram";
  if (button) button.disabled = true;
  let elapsed = 0;
  showVizStatus(tutorViz, `Generating ${label}... 0s`);
  const ticker = setInterval(() => {
    elapsed += 1;
    showVizStatus(tutorViz, `Generating ${label}... ${elapsed}s`);
  }, 1000);
  try {
    const response = await fetch(`${API_BASE}/api/ai/visualize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: lastTutorQuestion,
        style,
        quality: "low",
        output_format: "gif"
      })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.detail || "Visualization request failed");
    }
    clearInterval(ticker);
    if (style === "diagram" && payload.visualization_job_id && !payload.visualization) {
      await loadRenderJobs();
      await pollDiagramJob(payload.visualization_job_id);
      if (payload.message) showError(payload.message);
      return;
    }
    if (style === "animation" && payload.animation_id && !payload.visualization) {
      await loadRenderJobs();
      await pollAnimationJob(payload.animation_id);
      if (payload.message) showError(payload.message);
      return;
    }
    if (payload.visualization) {
      showVisualizationIn(tutorViz, payload.visualization);
    } else if (payload.message) {
      showVizStatus(tutorViz, payload.message);
    }
    if (payload.message) {
      showError(payload.message);
    }
  } catch (error) {
    showVizStatus(tutorViz, `Failed to generate ${label}.`);
    showError(error.message || "Failed to render on-demand visualization");
  } finally {
    clearInterval(ticker);
    if (button) button.disabled = false;
  }
};

const renderMediaPreview = (container, url, type) => {
  if (!url) return;
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  if (type === "image") {
    const img = document.createElement("img");
    img.src = fullUrl;
    img.alt = "Generated visual";
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    container.appendChild(img);
    return;
  }
  const audio = document.createElement("audio");
  audio.src = fullUrl;
  audio.controls = true;
  audio.style.width = "100%";
  container.appendChild(audio);
};

const updateMediaButtons = (enabled) => {
  if (tutorGenerateImage) {
    tutorGenerateImage.disabled = !enabled;
    tutorGenerateImage.title = enabled ? "" : "Enable Media Generation in Settings to use this";
    tutorGenerateImage.style.opacity = enabled ? "1" : "0.45";
  }
  if (tutorGenerateMusic) {
    tutorGenerateMusic.disabled = !enabled;
    tutorGenerateMusic.title = enabled ? "" : "Enable Media Generation in Settings to use this";
    tutorGenerateMusic.style.opacity = enabled ? "1" : "0.45";
  }
};

const syncMediaButtonState = async () => {
  try {
    const resp = await fetch(`${API_BASE}/api/settings`);
    if (!resp.ok) return;
    const data = await resp.json();
    updateMediaButtons(!!data.local_media_enabled);
  } catch (_) { /* ignore */ }
};

const generateMedia = async (type) => {
  if (!lastTutorQuestion) {
    showError("Ask a question first.");
    return;
  }
  const button = type === "image" ? tutorGenerateImage : tutorGenerateMusic;
  if (button) button.disabled = true;

  const prompt = type === "image"
    ? `Create a clear educational visual for: ${lastTutorQuestion}`
    : `Create a short classical-style music clip illustrating: ${lastTutorQuestion}. Emphasize harmonic series and ratios.`;

  try {
    const endpoint = type === "image" ? "/api/ai/media/image" : "/api/ai/media/music";
    const payload = type === "image"
      ? { prompt }
      : { prompt, duration_seconds: 10 };
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.detail || "Media generation failed");
    }
    renderMediaPreview(tutorViz, data.url, type);
  } catch (error) {
    showError(error.message || "Media generation failed");
  } finally {
    if (button) button.disabled = false;
  }
};

const drawScratchpadGrid = () => {
  if (!scratchpadCtx || !scratchpadCanvas) return;
  const { width, height } = scratchpadCanvas;
  scratchpadCtx.fillStyle = "#ffffff";
  scratchpadCtx.fillRect(0, 0, width, height);
  scratchpadCtx.strokeStyle = "#e2e8f0";
  scratchpadCtx.lineWidth = 1;
  for (let x = 0; x <= width; x += 24) {
    scratchpadCtx.beginPath();
    scratchpadCtx.moveTo(x, 0);
    scratchpadCtx.lineTo(x, height);
    scratchpadCtx.stroke();
  }
  for (let y = 0; y <= height; y += 24) {
    scratchpadCtx.beginPath();
    scratchpadCtx.moveTo(0, y);
    scratchpadCtx.lineTo(width, y);
    scratchpadCtx.stroke();
  }
};

const getScratchpadPoint = (event) => {
  if (!scratchpadCanvas) return { x: 0, y: 0 };
  const rect = scratchpadCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (scratchpadCanvas.width / rect.width),
    y: (event.clientY - rect.top) * (scratchpadCanvas.height / rect.height)
  };
};

const saveScratchpadSnapshot = () => {
  if (!scratchpadCtx || !scratchpadCanvas) return;
  const imageData = scratchpadCtx.getImageData(0, 0, scratchpadCanvas.width, scratchpadCanvas.height);
  scratchpadUndoStack.push(imageData);
  if (scratchpadUndoStack.length > 20) scratchpadUndoStack.shift();
};

const startScratchpadStroke = (event) => {
  if (!scratchpadCtx) return;
  event.preventDefault();
  saveScratchpadSnapshot();
  scratchpadDrawing = true;
  const point = getScratchpadPoint(event);
  scratchpadCtx.beginPath();
  scratchpadCtx.moveTo(point.x, point.y);
};

const continueScratchpadStroke = (event) => {
  if (!scratchpadCtx || !scratchpadDrawing) return;
  event.preventDefault();
  const point = getScratchpadPoint(event);
  scratchpadCtx.lineCap = "round";
  scratchpadCtx.lineJoin = "round";
  if (scratchpadMode === "eraser") {
    scratchpadCtx.strokeStyle = "#ffffff";
    scratchpadCtx.lineWidth = 18;
  } else {
    scratchpadCtx.strokeStyle = "#111827";
    scratchpadCtx.lineWidth = 3;
  }
  scratchpadCtx.lineTo(point.x, point.y);
  scratchpadCtx.stroke();
};

const endScratchpadStroke = () => {
  scratchpadDrawing = false;
};

const setScratchpadMode = (mode) => {
  scratchpadMode = mode;
  if (scratchpadPen) scratchpadPen.disabled = mode === "pen";
  if (scratchpadEraser) scratchpadEraser.disabled = mode === "eraser";
};

const undoScratchpad = () => {
  if (!scratchpadCtx || !scratchpadCanvas || scratchpadUndoStack.length === 0) return;
  const previous = scratchpadUndoStack.pop();
  if (previous) scratchpadCtx.putImageData(previous, 0, 0);
};

const clearScratchpad = () => {
  scratchpadUndoStack = [];
  drawScratchpadGrid();
  if (scratchpadResult) scratchpadResult.textContent = "";
};

const convertScratchpadToText = async () => {
  if (!scratchpadCanvas || !scratchpadConvert) return;
  scratchpadConvert.disabled = true;
  if (scratchpadResult) scratchpadResult.textContent = "Converting handwriting...";
  try {
    const response = await fetch(`${API_BASE}/api/ai/handwriting/recognize`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_data: scratchpadCanvas.toDataURL("image/png") })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.detail || "Failed to convert handwriting.");
    }
    if (scratchpadText) scratchpadText.value = payload.text || "";
    if (scratchpadResult) {
      const confidence = typeof payload.confidence === "number"
        ? `${Math.round(payload.confidence * 100)}%`
        : "n/a";
      scratchpadResult.textContent = `${payload.message || "Converted to text."} Confidence: ${confidence}.`;
    }
  } catch (error) {
    if (scratchpadResult) scratchpadResult.textContent = "";
    showError(error.message || "Failed to convert handwriting.");
  } finally {
    scratchpadConvert.disabled = false;
  }
};

const validateScratchpadAnswer = async () => {
  if (!scratchpadValidate) return;
  const answerText = (scratchpadText?.value || "").trim();
  const question = (lastTutorQuestion || tutorInput?.value || "").trim();
  if (!question) {
    showError("Ask or enter a question before validating.");
    return;
  }
  if (!answerText) {
    showError("Convert handwriting first, or type your answer in the scratchpad text box.");
    return;
  }
  scratchpadValidate.disabled = true;
  if (scratchpadResult) scratchpadResult.textContent = "Validating answer...";
  try {
    const response = await fetch(`${API_BASE}/api/ai/handwriting/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, answer_text: answerText })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.detail || "Validation failed.");
    }
    const checks = Array.isArray(payload.checks) ? payload.checks : [];
    const checkSummary = checks.slice(0, 4).map((check) => `${check.status.toUpperCase()}: ${check.details}`).join(" | ");
    const rag = Array.isArray(payload.rag_feedback) && payload.rag_feedback.length
      ? ` Web: ${payload.rag_feedback.join(" ; ")}`
      : "";
    if (scratchpadResult) {
      scratchpadResult.textContent =
        `${payload.message || "Validation complete."} Pass rate: ${Math.round((payload.pass_rate || 0) * 100)}%. ${checkSummary}${rag}`;
    }
  } catch (error) {
    if (scratchpadResult) scratchpadResult.textContent = "";
    showError(error.message || "Validation failed.");
  } finally {
    scratchpadValidate.disabled = false;
  }
};

const initScratchpad = () => {
  if (!scratchpadCanvas) return;
  scratchpadCtx = scratchpadCanvas.getContext("2d");
  if (!scratchpadCtx) return;
  drawScratchpadGrid();
  setScratchpadMode("pen");
  scratchpadCanvas.addEventListener("pointerdown", startScratchpadStroke);
  scratchpadCanvas.addEventListener("pointermove", continueScratchpadStroke);
  scratchpadCanvas.addEventListener("pointerup", endScratchpadStroke);
  scratchpadCanvas.addEventListener("pointerleave", endScratchpadStroke);
};

if (tutorForm) {
  tutorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    sendTutorQuestion(tutorInput.value.trim());
  });
}

if (tutorGenerateImage) {
  tutorGenerateImage.addEventListener("click", () => generateMedia("image"));
}

if (tutorGenerateMusic) {
  tutorGenerateMusic.addEventListener("click", () => generateMedia("music"));
}

if (tutorRenderDiagram) {
  tutorRenderDiagram.addEventListener("click", () => renderOnDemandVisualization("diagram"));
}

if (tutorRenderAnimation) {
  tutorRenderAnimation.addEventListener("click", () => renderOnDemandVisualization("animation"));
}

if (tutorJobsRefresh) {
  tutorJobsRefresh.addEventListener("click", () => loadRenderJobs());
}

if (tutorJobsList) {
  loadRenderJobs();
}

if (scratchpadPen) {
  scratchpadPen.addEventListener("click", () => setScratchpadMode("pen"));
}

if (scratchpadEraser) {
  scratchpadEraser.addEventListener("click", () => setScratchpadMode("eraser"));
}

if (scratchpadUndo) {
  scratchpadUndo.addEventListener("click", undoScratchpad);
}

if (scratchpadClear) {
  scratchpadClear.addEventListener("click", clearScratchpad);
}

if (scratchpadConvert) {
  scratchpadConvert.addEventListener("click", convertScratchpadToText);
}

if (scratchpadValidate) {
  scratchpadValidate.addEventListener("click", validateScratchpadAnswer);
}

if (latexInput) {
  latexInput.addEventListener("input", renderLatexEditorPreview);
}

if (latexMode) {
  latexMode.addEventListener("change", renderLatexEditorPreview);
}

if (latexTemplateFrac) {
  latexTemplateFrac.addEventListener("click", () => insertLatexTemplate("\\frac{a}{b}"));
}

if (latexTemplateSqrt) {
  latexTemplateSqrt.addEventListener("click", () => insertLatexTemplate("\\sqrt{x}"));
}

if (latexTemplateMatrix) {
  latexTemplateMatrix.addEventListener(
    "click",
    () => insertLatexTemplate("\\begin{bmatrix}a & b \\\\ c & d\\end{bmatrix}")
  );
}

if (latexInsertTutor) {
  latexInsertTutor.addEventListener("click", () => insertDelimitedLatexInto(tutorInput, "Tutor input"));
}

if (latexInsertScratchpad) {
  latexInsertScratchpad.addEventListener("click", () => insertDelimitedLatexInto(scratchpadText, "Scratchpad text"));
}

if (latexCopy) {
  latexCopy.addEventListener("click", copyLatexExpression);
}

initScratchpad();
initLatexEditor();
syncMediaButtonState();

// =============================================================================
// Context Window
// =============================================================================
const contextStatusEl = document.getElementById("context-status");
const contextResetBtn = document.getElementById("context-reset-btn");

const updateContextStatus = async () => {
  if (!contextStatusEl) return;
  if (!tutorSessionId) {
    contextStatusEl.textContent = "Context: vector store (new session)";
    return;
  }
  try {
    const resp = await fetch(`${API_BASE}/api/context/session/${tutorSessionId}`);
    if (resp.ok) {
      const s = await resp.json();
      const n = s.message_count || 0;
      contextStatusEl.textContent = `Context: vector store \u2022 ${n} message${n !== 1 ? "s" : ""} indexed`;
    } else if (resp.status === 404) {
      tutorSessionId = "";
      localStorage.removeItem("ew_tutor_session_id");
      contextStatusEl.textContent = "Context: vector store (new session)";
    }
  } catch {
    contextStatusEl.textContent = "Context: offline (fallback mode)";
  }
};

const resetTutorSession = async () => {
  if (tutorSessionId) {
    try {
      await fetch(`${API_BASE}/api/context/session/${tutorSessionId}`, { method: "DELETE" });
    } catch { /* ignore */ }
  }
  tutorSessionId = "";
  tutorHistory = [];
  localStorage.removeItem("ew_tutor_session_id");
  await ensureTutorSession();
  updateContextStatus();
  renderTutorSolution("Session cleared. Ask a new question to start fresh.");
};

if (contextResetBtn) {
  contextResetBtn.addEventListener("click", resetTutorSession);
}

(async () => {
  await ensureTutorSession();
  updateContextStatus();
})();

// =============================================================================
// Settings Tab
// =============================================================================
const loadSettings = async () => {
  if (!settingsForm) return;
  try {
    const response = await fetch(`${API_BASE}/api/settings`);
    if (!response.ok) throw new Error("Failed to load settings");
    const data = await response.json();
    settingsLocalAiEnabled.checked = !!data.local_ai_enabled;
    settingsMultiAgentEnabled.checked = !!data.local_multi_agent_enabled;
    settingsLocalWebRagEnabled.checked = !!data.local_web_rag_enabled;
    settingsFastModeEnabled.checked = !!data.fast_mode_enabled;
    settingsLocalLlmModel.value = data.local_llm_model || "";
    settingsLocalMediaEnabled.checked = !!data.local_media_enabled;
    settingsLocalDiffusionModel.value = data.local_diffusion_model || "";
    settingsLocalDiffusionTimeout.value = data.local_diffusion_timeout_seconds || 60;
    settingsLocalMusicModel.value = data.local_music_model || "";
    settingsLocalMusicFast.checked = !!data.local_music_fast_mode;
    settingsLocalMusicTimeout.value = data.local_music_timeout_seconds || 180;
    settingsLocalMediaDevice.value = data.local_media_device || "cpu";
    updateFastModeState();
    updateMediaButtons(!!data.local_media_enabled);
    await loadAgents();
  } catch (error) {
    showError("Failed to load settings");
  }
};

const saveSettings = async () => {
  try {
    const payload = {
      local_ai_enabled: settingsLocalAiEnabled.checked,
      local_multi_agent_enabled: settingsMultiAgentEnabled.checked,
      local_web_rag_enabled: settingsLocalWebRagEnabled.checked,
      fast_mode_enabled: settingsFastModeEnabled.checked,
      local_llm_model: settingsLocalLlmModel.value.trim(),
      local_media_enabled: settingsLocalMediaEnabled.checked,
      local_diffusion_model: settingsLocalDiffusionModel.value.trim(),
      local_diffusion_timeout_seconds: Number(settingsLocalDiffusionTimeout.value) || 60,
      local_music_model: settingsLocalMusicModel.value.trim(),
      local_music_fast_mode: settingsLocalMusicFast.checked,
      local_music_timeout_seconds: Number(settingsLocalMusicTimeout.value) || 180,
      local_media_device: settingsLocalMediaDevice.value
    };
    const response = await fetch(`${API_BASE}/api/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("Failed to save settings");
    updateMediaButtons(settingsLocalMediaEnabled.checked);
    showError("Settings saved.");
  } catch (error) {
    showError("Failed to save settings");
  }
};

const applyPreset = (preset) => {
  if (!preset) return;
  if (preset === "math") {
    settingsLocalLlmModel.value = "qwen2.5-math:7b";
    settingsLocalDiffusionModel.value = "runwayml/stable-diffusion-v1-5";
    settingsLocalMusicModel.value = "facebook/musicgen-small";
    settingsLocalMediaDevice.value = "cpu";
    return;
  }
  if (preset === "literature") {
    settingsLocalLlmModel.value = "llama3.1:8b";
    settingsLocalDiffusionModel.value = "stabilityai/sdxl-turbo";
    settingsLocalMusicModel.value = "facebook/musicgen-small";
    settingsLocalMediaDevice.value = "cpu";
    return;
  }
  if (preset === "auto") {
    settingsLocalLlmModel.value = "";
    settingsLocalDiffusionModel.value = "";
    settingsLocalMusicModel.value = "";
  }
};

const updateFastModeState = () => {
  if (!settingsFastModeEnabled) return;
  const fastOn = settingsFastModeEnabled.checked;
  settingsMultiAgentEnabled.disabled = fastOn;
  settingsLocalLlmModel.disabled = fastOn;
  if (fastOn) {
    settingsMultiAgentEnabled.checked = false;
  }
};

const validateSettings = async () => {
  try {
    const response = await fetch(`${API_BASE}/api/settings/validate`);
    if (!response.ok) throw new Error("Validation failed");
    const data = await response.json();
    const messages = [
      `Ollama: ${data.ollama_model.available ? "ok" : "missing"} (${data.ollama_model.message || ""})`,
      `Diffusion: ${data.diffusion_model.available ? "ok" : "missing"} (${data.diffusion_model.message || ""})`,
      `Music: ${data.music_model.available ? "ok" : "missing"} (${data.music_model.message || ""})`
    ];
    showError(messages.join(" | "));
  } catch (error) {
    showError("Validation failed");
  }
};

const testModel = async (target) => {
  try {
    const response = await fetch(`${API_BASE}/api/settings/test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target })
    });
    const data = await response.json();
    if (!response.ok || !data.success) {
      throw new Error(data?.message || "Test failed");
    }
    showError(data.message || "Test succeeded");
  } catch (error) {
    showError(error.message || "Test failed");
  }
};

const importAwesomeMathResources = async () => {
  if (!settingsImportAwesome) return;
  const categories = settingsAwesomeCategories
    ? Array.from(settingsAwesomeCategories.selectedOptions).map((opt) => opt.value)
    : [];
  const dryRun = !!(settingsAwesomeDryRun && settingsAwesomeDryRun.checked);
  settingsImportAwesome.disabled = true;
  try {
    const response = await fetch(`${API_BASE}/api/resources/import/awesome-math`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categories, dry_run: dryRun })
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.detail || "Import failed");
    }
    showError(
      `Awesome Math import: matched ${payload.matched_count}, imported ${payload.imported_count}, existing ${payload.existing_count}.`
    );
    if (!dryRun) {
      searchResources();
    }
  } catch (error) {
    showError(error.message || "Awesome Math import failed");
  } finally {
    settingsImportAwesome.disabled = false;
  }
};

const renderEvalSummary = (report) => {
  if (!evalSummary) return;
  if (!report) {
    evalSummary.innerHTML = '<div class="viz-placeholder">No evaluation report loaded yet.</div>';
    return;
  }
  const lines = [
    `<h3>Mode: ${report.mode}</h3>`,
    report.run_label ? `<p><strong>Label:</strong> ${report.run_label}</p>` : "",
    (report.run_tags && report.run_tags.length) ? `<p><strong>Tags:</strong> ${report.run_tags.join(", ")}</p>` : "",
    `<p><strong>Prompts:</strong> ${report.total_prompts} | <strong>Avg latency:</strong> ${report.avg_duration_ms}ms</p>`,
    `<p><strong>Visualization coverage:</strong> ${(report.visualization_coverage * 100).toFixed(1)}% | <strong>Avg check pass rate:</strong> ${(report.avg_checks_pass_rate * 100).toFixed(1)}%</p>`,
    `<p><strong>Timeouts:</strong> ${report.timeout_count} | <strong>Errors:</strong> ${report.error_count}</p>`,
    `<p><strong>Latency buckets:</strong> &lt;500ms ${report.latency_histogram?.lt_500ms ?? 0}, 500-1000ms ${report.latency_histogram?.["500_to_1000ms"] ?? 0}, 1000-2000ms ${report.latency_histogram?.["1000_to_2000ms"] ?? 0}, ≥2000ms ${report.latency_histogram?.gte_2000ms ?? 0}</p>`
  ];
  evalSummary.innerHTML = lines.join("");
};

const renderEvalHistory = (history) => {
  if (!evalHistory) return;
  const runs = history?.runs || [];
  if (!runs.length) {
    evalHistory.innerHTML = '<div class="viz-placeholder">No eval history yet.</div>';
    return;
  }
  const cards = runs.map((run) => `
    <div class="agent-card">
      <div><strong>${run.mode.toUpperCase()}</strong> • ${new Date(run.created_at).toLocaleString()}</div>
      ${run.run_label ? `<div><strong>Label:</strong> ${run.run_label}</div>` : ""}
      ${(run.run_tags && run.run_tags.length) ? `<div><strong>Tags:</strong> ${run.run_tags.join(", ")}</div>` : ""}
      <div>Prompts: ${run.total_prompts} | Avg latency: ${run.avg_duration_ms}ms</div>
      <div>Viz coverage: ${(run.visualization_coverage * 100).toFixed(1)}% | Pass rate: ${(run.avg_checks_pass_rate * 100).toFixed(1)}%</div>
      <div>Timeouts: ${run.timeout_count} | Errors: ${run.error_count}</div>
    </div>
  `);
  evalHistory.innerHTML = cards.join("");
};

const populateCompareSelectors = (history) => {
  if (!evalCompareA || !evalCompareB) return;
  const runs = history?.runs || [];
  const options = runs.map((run) => {
    const label = run.run_label ? `${run.run_label} (${run.mode})` : `${run.mode} • ${new Date(run.created_at).toLocaleString()}`;
    return `<option value="${run.id}">${label}</option>`;
  }).join("");
  evalCompareA.innerHTML = `<option value="">Select run A</option>${options}`;
  evalCompareB.innerHTML = `<option value="">Select run B</option>${options}`;
};

const renderCompareResult = (cmp) => {
  if (!evalCompareResult) return;
  if (!cmp) {
    evalCompareResult.innerHTML = '<div class="viz-placeholder">No comparison selected.</div>';
    return;
  }
  const d = cmp.delta || {};
  evalCompareResult.innerHTML = `
    <h3>Comparison</h3>
    <p><strong>A:</strong> ${cmp.run_a?.label || cmp.run_a?.id} | <strong>B:</strong> ${cmp.run_b?.label || cmp.run_b?.id}</p>
    <p><strong>Δ Latency:</strong> ${d.avg_duration_ms}ms | <strong>Δ Pass Rate:</strong> ${(d.avg_checks_pass_rate * 100).toFixed(2)}%</p>
    <p><strong>Δ Viz Coverage:</strong> ${(d.visualization_coverage * 100).toFixed(2)}% | <strong>Δ Timeouts:</strong> ${d.timeout_count} | <strong>Δ Errors:</strong> ${d.error_count}</p>
  `;
};

const renderEvalCharts = (report, history) => {
  if (window.Plotly && evalLatencyChart && report?.latency_histogram) {
    const bins = ["<500ms", "500-1000ms", "1000-2000ms", ">=2000ms"];
    const vals = [
      report.latency_histogram.lt_500ms || 0,
      report.latency_histogram["500_to_1000ms"] || 0,
      report.latency_histogram["1000_to_2000ms"] || 0,
      report.latency_histogram.gte_2000ms || 0
    ];
    Plotly.newPlot(
      evalLatencyChart,
      [{ type: "bar", x: bins, y: vals, marker: { color: "#2563eb" } }],
      { title: "Latency Histogram", margin: { l: 30, r: 10, t: 35, b: 35 } },
      { displayModeBar: false, responsive: true }
    );
  }

  if (window.Plotly && evalTrendChart && history?.runs?.length) {
    const ordered = [...history.runs].reverse();
    const x = ordered.map((run, idx) => `${idx + 1}`);
    const yLatency = ordered.map((run) => run.avg_duration_ms);
    const yPass = ordered.map((run) => (run.avg_checks_pass_rate || 0) * 100);
    Plotly.newPlot(
      evalTrendChart,
      [
        { type: "scatter", mode: "lines+markers", name: "Avg Latency (ms)", x, y: yLatency, yaxis: "y1" },
        { type: "scatter", mode: "lines+markers", name: "Pass Rate (%)", x, y: yPass, yaxis: "y2" }
      ],
      {
        title: "Run Trends",
        margin: { l: 40, r: 40, t: 35, b: 35 },
        yaxis: { title: "Latency (ms)" },
        yaxis2: { title: "Pass Rate (%)", overlaying: "y", side: "right", range: [0, 100] }
      },
      { displayModeBar: false, responsive: true }
    );
  }
};

const loadEvalDashboard = async (live = false) => {
  try {
    const label = encodeURIComponent((evalRunLabel?.value || "").trim());
    const tags = encodeURIComponent((evalRunTags?.value || "").trim());
    const reportResp = await fetch(
      `${API_BASE}/api/eval/report?live=${live ? "true" : "false"}&persist=true&run_label=${label}&run_tags=${tags}`
    );
    if (!reportResp.ok) throw new Error("Failed to load eval report");
    const report = await reportResp.json();
    renderEvalSummary(report);

    const mode = (evalFilterMode?.value || "").trim();
    const filterTag = (evalFilterTag?.value || "").trim();
    const filterLabel = (evalFilterLabel?.value || "").trim();
    const historyParams = new URLSearchParams({ limit: "20" });
    if (mode) historyParams.set("mode", mode);
    if (filterTag) historyParams.set("tag", filterTag);
    if (filterLabel) historyParams.set("label_contains", filterLabel);
    const historyResp = await fetch(
      `${API_BASE}/api/eval/history?${historyParams.toString()}`
    );
    if (!historyResp.ok) throw new Error("Failed to load eval history");
    const history = await historyResp.json();
    renderEvalHistory(history);
    populateCompareSelectors(history);
    renderEvalCharts(report, history);
  } catch (error) {
    showError(error.message || "Failed to load evaluation dashboard");
  }
};

const exportEvalReport = async (format) => {
  const label = encodeURIComponent((evalRunLabel?.value || "").trim());
  const tags = encodeURIComponent((evalRunTags?.value || "").trim());
  const url = `${API_BASE}/api/eval/report/export?format=${format}&latest=true&run_label=${label}&run_tags=${tags}`;
  window.open(url, "_blank");
};

const compareEvalRuns = async () => {
  const a = evalCompareA?.value;
  const b = evalCompareB?.value;
  if (!a || !b) {
    showError("Select two runs to compare.");
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/api/eval/compare?run_a_id=${encodeURIComponent(a)}&run_b_id=${encodeURIComponent(b)}`);
    if (!response.ok) throw new Error("Failed to compare runs");
    const payload = await response.json();
    renderCompareResult(payload);
  } catch (error) {
    showError(error.message || "Failed to compare runs");
  }
};

const loadAgents = async () => {
  if (!agentsList) return;
  try {
    const response = await fetch(`${API_BASE}/api/agents`);
    if (!response.ok) throw new Error("Failed to load agents");
    const data = await response.json();
    agentsList.innerHTML = "";
    data.agents.forEach((agent) => {
      const card = document.createElement("div");
      card.className = "agent-card";
      const metrics = [
        agent.run_count !== null ? `Runs: ${agent.run_count}` : null,
        agent.last_run_ms ? `Last: ${agent.last_run_ms} ms` : null,
        agent.last_run_at ? `At: ${agent.last_run_at}` : null,
        agent.last_error ? `Error: ${agent.last_error}` : null
      ].filter(Boolean).join(" | ");

      card.innerHTML = `
        <div class="name">${agent.name}</div>
        <div class="status">Status: ${agent.status}</div>
        <div class="details">${agent.details || ""}</div>
        ${metrics ? `<div class="details">${metrics}</div>` : ""}
      `;
      agentsList.appendChild(card);
    });
  } catch (error) {
    agentsList.innerHTML = '<div class="viz-placeholder">Failed to load agents.</div>';
  }
};

if (settingsForm) {
  settingsForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveSettings();
  });
}

if (settingsFastModeEnabled) {
  settingsFastModeEnabled.addEventListener("change", updateFastModeState);
}

if (settingsPreset) {
  settingsPreset.addEventListener("change", (event) => {
    applyPreset(event.target.value);
  });
}

if (settingsValidate) {
  settingsValidate.addEventListener("click", () => validateSettings());
}

if (settingsTestOllama) {
  settingsTestOllama.addEventListener("click", () => testModel("ollama"));
}

if (settingsTestDiffusion) {
  settingsTestDiffusion.addEventListener("click", () => testModel("diffusion"));
}

if (settingsTestMusic) {
  settingsTestMusic.addEventListener("click", () => testModel("music"));
}

if (settingsImportAwesome) {
  settingsImportAwesome.addEventListener("click", importAwesomeMathResources);
}

if (evalRefreshBtn) {
  evalRefreshBtn.addEventListener("click", () => loadEvalDashboard(false));
}

if (evalRefreshLiveBtn) {
  evalRefreshLiveBtn.addEventListener("click", () => loadEvalDashboard(true));
}

if (evalExportJsonBtn) {
  evalExportJsonBtn.addEventListener("click", () => exportEvalReport("json"));
}

if (evalExportCsvBtn) {
  evalExportCsvBtn.addEventListener("click", () => exportEvalReport("csv"));
}

if (evalFilterMode) {
  evalFilterMode.addEventListener("change", () => loadEvalDashboard(false));
}

if (evalFilterTag) {
  evalFilterTag.addEventListener("change", () => loadEvalDashboard(false));
}

if (evalFilterLabel) {
  evalFilterLabel.addEventListener("change", () => loadEvalDashboard(false));
}

if (evalCompareRunBtn) {
  evalCompareRunBtn.addEventListener("click", compareEvalRuns);
}

const renderResourceResults = (resources) => {
  resourceResults.innerHTML = "";
  if (resources.length === 0) {
    resourceResults.innerHTML = '<div class="viz-placeholder">No resources found.</div>';
    return;
  }

  resources.forEach(r => {
    const div = document.createElement("div");
    div.className = "resource-card";
    div.innerHTML = `
      <div class="title">${r.title}</div>
      ${r.author ? `<div class="author">by ${r.author}</div>` : ""}
      ${r.description ? `<div class="description">${r.description}</div>` : ""}
      <div class="meta">
        <span class="badge ${r.resource_type}">${r.resource_type}</span>
        ${r.difficulty ? `<span class="badge ${r.difficulty}">${r.difficulty}</span>` : ""}
      </div>
      ${r.url ? `<a href="${r.url}" target="_blank">Open Resource →</a>` : ""}
    `;
    resourceResults.appendChild(div);
  });
};

searchResourcesBtn.addEventListener("click", searchResources);
resourceSearch.addEventListener("keypress", (e) => {
  if (e.key === "Enter") searchResources();
});

if (collectionsRefresh) {
  collectionsRefresh.addEventListener("click", () => loadPromptCollections());
}

if (collectionsCategory) {
  collectionsCategory.addEventListener("change", () => loadPromptCollections());
}

if (collectionsSearch) {
  collectionsSearch.addEventListener("input", () => loadPromptCollections());
}

if (matrixCompute) {
  matrixCompute.addEventListener("click", computeMatrixLab);
}

if (matrixCheckWork) {
  matrixCheckWork.addEventListener("click", checkMatrixWork);
}

if (matrixExample) {
  matrixExample.addEventListener("click", loadMatrixLabExample);
}

if (matrixReset) {
  matrixReset.addEventListener("click", resetMatrixLab);
}

if (matrixSize) {
  matrixSize.addEventListener("change", () => {
    matrixPracticePassed = false;
    updateMatrixLabVisibility();
    if (matrixFeedback) {
      matrixFeedback.textContent = `Switched to ${currentMatrixSize()}x${currentMatrixSize()} mode.`;
      matrixFeedback.style.color = "#475569";
    }
    computeMatrixLab();
  });
}

if (matrixPracticeMode) {
  matrixPracticeMode.addEventListener("change", () => {
    matrixPracticePassed = false;
    if (matrixFeedback) {
      matrixFeedback.textContent = matrixPracticeMode.checked
        ? "Practice mode enabled. Solve first, then check."
        : "Practice mode disabled. Answers will be shown.";
      matrixFeedback.style.color = "#475569";
    }
    computeMatrixLab();
  });
}

// =============================================================================
// Initialize
// =============================================================================
if (messages) {
  addMessage("Welcome! Try one of the suggested prompts below to explore a visualization.", "assistant");
  renderSuggestions();
  loadConversations();
}

// Expose for cross-script access (Music Lab, etc.)
window.switchToTab = switchToTab;
window.sendTutorQuestion = sendTutorQuestion;

// Check for prompt in URL query parameter (from Math Map)
const urlParams = new URLSearchParams(window.location.search);
const promptFromUrl = urlParams.get("prompt");
if (promptFromUrl) {
  setTimeout(() => {
    sendTutorQuestion(promptFromUrl);
  }, 500);
}
