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
  "What is a prime number?"
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
  if (!window.renderMathInElement) return;
  try {
    renderMathInElement(messages, {
      delimiters: [
        { left: "\\(", right: "\\)", display: false },
        { left: "\\[", right: "\\]", display: true }
      ]
    });
  } catch (error) {
    console.warn("Math render failed:", error);
  }
};

// =============================================================================
// Tab Navigation
// =============================================================================
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const tabId = btn.dataset.tab;
    tabBtns.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${tabId}`).classList.add("active");

    // Load data for specific tabs
    if (tabId === "mindmap") loadConceptsForMindmap();
    if (tabId === "euclid") searchEuclid();
    if (tabId === "resources") searchResources();
  });
});

// =============================================================================
// Chat Tab
// =============================================================================
const addMessage = (text, role, loading = false) => {
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
  const loadingMsg = messages.querySelector(".message.loading");
  if (loadingMsg) loadingMsg.remove();
};

const renderSuggestions = () => {
  suggestions.innerHTML = "";
  demoPrompts.forEach((prompt) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = prompt;
    button.addEventListener("click", () => sendMessage(prompt));
    suggestions.appendChild(button);
  });
};

const showVisualization = (visualization) => {
  vizContent.innerHTML = "";
  if (!visualization) {
    vizContent.innerHTML = '<div class="viz-placeholder">No visualization for this topic.</div>';
    return;
  }

  const title = document.createElement("div");
  title.style.fontWeight = "600";
  title.style.marginBottom = "8px";
  title.textContent = visualization.title;
  vizContent.appendChild(title);

  if (visualization.viz_type === "svg") {
    const img = document.createElement("img");
    const url = visualization.data.url.startsWith("http")
      ? visualization.data.url
      : `${API_BASE}${visualization.data.url}`;
    img.src = url;
    img.alt = visualization.title;
    img.style.width = "100%";
    img.style.borderRadius = "8px";
    vizContent.appendChild(img);
    return;
  }

  if (visualization.viz_type === "plotly") {
    const plotContainer = document.createElement("div");
    vizContent.appendChild(plotContainer);
    Plotly.newPlot(plotContainer, visualization.data.data, visualization.data.layout, {
      displayModeBar: false
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
        vizContent.appendChild(img);
      } else {
        const video = document.createElement("video");
        video.src = url;
        video.controls = true;
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.style.width = "100%";
        video.style.borderRadius = "8px";
        vizContent.appendChild(video);
      }
      return;
    }

    const info = document.createElement("div");
    info.className = "viz-placeholder";
    info.textContent = "Manim animation available. Click to render.";
    vizContent.appendChild(info);

    const renderBtn = document.createElement("button");
    renderBtn.className = "btn-primary";
    renderBtn.style.marginTop = "12px";
    renderBtn.textContent = "Render Animation";
    vizContent.appendChild(renderBtn);

    renderBtn.addEventListener("click", async () => {
      if (!manimData.scene_name) {
        showError("Missing Manim scene name.");
        return;
      }

      vizContent.innerHTML = '<div class="viz-placeholder">Rendering animation...</div>';

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
        showVisualization(visualization);
      } catch (error) {
        showError("Failed to render animation.");
        showVisualization(visualization);
      }
    });

    return;
  }
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

form.addEventListener("submit", (event) => {
  event.preventDefault();
  sendMessage(input.value.trim());
});

newConversationBtn.addEventListener("click", startNewConversation);

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
  `;
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

// =============================================================================
// Initialize
// =============================================================================
addMessage("Welcome! Try one of the suggested prompts below to explore a visualization.", "assistant");
renderSuggestions();
loadConversations();

// Check for prompt in URL query parameter (from Math Map)
const urlParams = new URLSearchParams(window.location.search);
const promptFromUrl = urlParams.get("prompt");
if (promptFromUrl) {
  // Auto-send the prompt after a short delay to let the page load
  setTimeout(() => {
    sendMessage(promptFromUrl);
  }, 500);
}
