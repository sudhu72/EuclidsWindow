const API_BASE = window.location.origin.startsWith("http")
  ? window.location.origin
  : "http://127.0.0.1:8000";

// =============================================================================
// Markdown Parser - Converts markdown to styled HTML
// =============================================================================
const parseMarkdown = (text) => {
  if (!text) return "";
  
  const lines = text.split('\n');
  const result = [];
  let inTable = false;
  let tableRows = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Skip table separator rows
    if (/^\|[-:\s|]+\|$/.test(line)) continue;
    
    // Handle table rows
    if (/^\|.+\|$/.test(line)) {
      if (!inTable) { inTable = true; tableRows = []; }
      const cells = line.slice(1, -1).split('|').map(c => c.trim());
      const isHeader = tableRows.length === 0;
      const cellTag = isHeader ? 'th' : 'td';
      const cellsHtml = cells.map(c => `<${cellTag}>${formatInline(c)}</${cellTag}>`).join('');
      tableRows.push(`<tr>${cellsHtml}</tr>`);
      continue;
    } else if (inTable) {
      result.push(`<table class="md-table"><tbody>${tableRows.join('')}</tbody></table>`);
      inTable = false; tableRows = [];
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
  
  if (inTable) {
    result.push(`<table class="md-table"><tbody>${tableRows.join('')}</tbody></table>`);
  }
  
  return result.join('');
};

const formatInline = (text) => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(?!\*)([^*]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');
};

// DOM Elements
const mapContainer = document.getElementById("map-container");
const searchInput = document.getElementById("search-input");
const searchResults = document.getElementById("search-results");
const topicModal = document.getElementById("topic-modal");
const explanationModal = document.getElementById("explanation-modal");

// State
let currentTopic = null;
let currentPrompt = null;
let mapData = null;

// Category icons
const categoryIcons = {
  foundations: "⊢",
  number_systems: "#",
  arithmetic: "+",
  algebra: "x",
  geometry: "△",
  trigonometry: "∠",
  calculus: "∫",
  linear_algebra: "→",
  probability: "🎲",
  discrete_math: "◯",
  applied: "⚙",
  advanced: "∞"
};

// Load and render the math map
async function loadMathMap() {
  try {
    const response = await fetch(`${API_BASE}/api/mathmap`);
    if (!response.ok) throw new Error("Failed to load math map");
    mapData = await response.json();
    renderMap(mapData.categories);
  } catch (error) {
    console.error("Error loading math map:", error);
    mapContainer.innerHTML = '<p style="color:white;text-align:center;">Failed to load math map. Make sure the API is running.</p>';
  }
}

function renderMap(categories) {
  mapContainer.innerHTML = "";
  
  categories.forEach(category => {
    const categoryEl = document.createElement("div");
    categoryEl.className = `category category-${category.id}`;
    
    categoryEl.innerHTML = `
      <div class="category-header">
        <div class="category-icon" style="background: ${category.color}">
          ${categoryIcons[category.id] || "📐"}
        </div>
        <h2 class="category-name">${category.name}</h2>
      </div>
      <div class="topics-grid">
        ${category.topics.map(topic => `
          <button 
            class="topic-chip" 
            data-topic-id="${topic.id}"
            style="color: ${category.color}"
          >
            <span class="topic-icon">${topic.icon}</span>
            <span>${topic.name}</span>
          </button>
        `).join("")}
      </div>
    `;
    
    mapContainer.appendChild(categoryEl);
  });
  
  // Add click handlers
  document.querySelectorAll(".topic-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      const topicId = chip.dataset.topicId;
      openTopicModal(topicId);
    });
  });
}

async function openTopicModal(topicId) {
  try {
    const response = await fetch(`${API_BASE}/api/mathmap/topic/${topicId}`);
    if (!response.ok) throw new Error("Topic not found");
    currentTopic = await response.json();
    
    document.getElementById("modal-icon").style.background = currentTopic.category_color;
    document.getElementById("modal-icon").textContent = currentTopic.icon;
    document.getElementById("modal-title").textContent = currentTopic.name;
    document.getElementById("modal-category").textContent = `Category: ${currentTopic.category_name}`;
    
    const promptsList = document.getElementById("prompts-list");
    promptsList.innerHTML = currentTopic.prompts.map((prompt, index) => `
      <button class="prompt-item" data-prompt="${encodeURIComponent(prompt)}">
        <span class="prompt-number">${index + 1}</span>
        <span class="prompt-text">${prompt}</span>
        <span class="prompt-arrow">→</span>
      </button>
    `).join("");
    
    // Add click handlers for prompts
    promptsList.querySelectorAll(".prompt-item").forEach(item => {
      item.addEventListener("click", () => {
        const prompt = decodeURIComponent(item.dataset.prompt);
        showExplanation(prompt);
      });
    });
    
    topicModal.classList.remove("hidden");
  } catch (error) {
    console.error("Error opening topic:", error);
  }
}

async function showExplanation(prompt) {
  currentPrompt = prompt;
  topicModal.classList.add("hidden");
  
  document.getElementById("explanation-title").textContent = prompt;
  document.getElementById("explanation-text").innerHTML = `
    <div class="loading-spinner"></div>
    <p style="text-align:center;">Generating explanation...</p>
  `;
  
  explanationModal.classList.remove("hidden");
  
  try {
    const response = await fetch(`${API_BASE}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: prompt })
    });
    
    if (!response.ok) throw new Error("Failed to get explanation");
    
    const data = await response.json();
    
    // Format with markdown parser and make topic links clickable
    let content = parseMarkdown(data.response_text);
    content = makeTopicLinksClickable(content);
    
    // Add related concepts section if available
    if (data.related_concepts && data.related_concepts.length > 0) {
      content += renderRelatedConcepts(data.related_concepts);
    }
    
    document.getElementById("explanation-text").innerHTML = content;
    
    // Add click handlers for topic links
    document.querySelectorAll(".topic-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const query = link.dataset.query;
        showExplanation(`What is ${query}?`);
      });
    });
    
    // Render math
    if (window.renderMathInElement) {
      renderMathInElement(document.getElementById("explanation-text"), {
        delimiters: [
          { left: "\\(", right: "\\)", display: false },
          { left: "\\[", right: "\\]", display: true }
        ]
      });
    }
  } catch (error) {
    console.error("Error getting explanation:", error);
    document.getElementById("explanation-text").innerHTML = `
      <p style="color: #ef4444;">Failed to generate explanation. Please try again.</p>
    `;
  }
}

// Render related concepts as clickable tags
function renderRelatedConcepts(concepts) {
  const tags = concepts.map(concept => 
    `<a href="#" class="topic-link related-tag" data-query="${concept}">${concept}</a>`
  ).join('');
  
  return `
    <div class="related-concepts-section">
      <hr class="md-hr">
      <div class="related-concepts-header">🔗 <strong>Explore Related Topics</strong></div>
      <div class="related-tags-container">${tags}</div>
    </div>
  `;
}

// Make inline topic references clickable
function makeTopicLinksClickable(html) {
  // Common math topics to look for and make clickable
  const linkableTopics = [
    'curve fitting', 'taylor series', 'cryptography', 'algebra', 'calculus',
    'geometry', 'trigonometry', 'probability', 'statistics', 'matrices',
    'vectors', 'eigenvalues', 'derivatives', 'integrals', 'limits',
    'polynomials', 'quadratic', 'linear equations', 'differential equations',
    'graph theory', 'set theory', 'number theory', 'topology', 'fractals',
    'chaos theory', 'game theory', 'combinatorics', 'prime numbers',
    'complex numbers', 'real numbers', 'integers', 'fractions', 'logarithms',
    'exponents', 'functions', 'sequences', 'series', 'proof', 'axioms',
    'neural network', 'backpropagation', 'attention mechanism', 'transformers',
    'game of life', 'conway', 'fibonacci', 'golden ratio', 'pascal'
  ];
  
  linkableTopics.forEach(topic => {
    // Case insensitive replacement, but only in text (not in tags or code)
    const regex = new RegExp(`\\b(${topic})\\b(?![^<]*>)`, 'gi');
    html = html.replace(regex, (match) => {
      // Don't double-link
      if (html.includes(`data-query="${match.toLowerCase()}"`)) return match;
      return `<a href="#" class="topic-link inline-link" data-query="${match.toLowerCase()}">${match}</a>`;
    });
  });
  
  return html;
}

// Search functionality
let searchTimeout;

searchInput.addEventListener("input", () => {
  clearTimeout(searchTimeout);
  const query = searchInput.value.trim();
  
  if (query.length < 2) {
    searchResults.classList.add("hidden");
    return;
  }
  
  searchTimeout = setTimeout(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/mathmap/search?query=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      
      if (data.results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
      } else {
        searchResults.innerHTML = data.results.map(topic => `
          <div class="search-result-item" data-topic-id="${topic.id}">
            <div class="search-result-icon" style="background: ${topic.category_color}">
              ${topic.icon}
            </div>
            <div>
              <strong>${topic.name}</strong>
              <div style="font-size:0.85rem;color:#64748b;">${topic.category_name}</div>
            </div>
          </div>
        `).join("");
        
        searchResults.querySelectorAll(".search-result-item").forEach(item => {
          if (item.dataset.topicId) {
            item.addEventListener("click", () => {
              searchResults.classList.add("hidden");
              searchInput.value = "";
              openTopicModal(item.dataset.topicId);
            });
          }
        });
      }
      
      searchResults.classList.remove("hidden");
    } catch (error) {
      console.error("Search error:", error);
    }
  }, 300);
});

// Close search results when clicking outside
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-bar")) {
    searchResults.classList.add("hidden");
  }
});

// Modal close handlers
document.getElementById("modal-close").addEventListener("click", () => {
  topicModal.classList.add("hidden");
});

document.getElementById("explanation-close").addEventListener("click", () => {
  explanationModal.classList.add("hidden");
});

document.getElementById("back-to-prompts").addEventListener("click", () => {
  explanationModal.classList.add("hidden");
  if (currentTopic) {
    openTopicModal(currentTopic.id);
  }
});

document.getElementById("continue-chat").addEventListener("click", () => {
  // Redirect to chat with the current conversation
  const chatUrl = `index.html?prompt=${encodeURIComponent(currentPrompt)}`;
  window.location.href = chatUrl;
});

// Close modals on escape key
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    topicModal.classList.add("hidden");
    explanationModal.classList.add("hidden");
  }
});

// Close modals when clicking backdrop
topicModal.addEventListener("click", (e) => {
  if (e.target === topicModal) {
    topicModal.classList.add("hidden");
  }
});

explanationModal.addEventListener("click", (e) => {
  if (e.target === explanationModal) {
    explanationModal.classList.add("hidden");
  }
});

// Initialize
loadMathMap();
