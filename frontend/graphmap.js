/* Interactive concept-graph explorer for the Map of Mathematics.
   Renders /api/graph as a force-directed graph (D3 v7): drag nodes, scroll to
   zoom, hover to highlight a concept's neighbours, click to open its lesson. */
(function () {
  "use strict";
  const API_BASE = window.location.origin.startsWith("http")
    ? window.location.origin
    : "";
  let loaded = false;
  let sim = null;

  function show(view) {
    const cats = document.getElementById("map-container");
    const graph = document.getElementById("graph-view");
    const bCats = document.getElementById("view-categories");
    const bGraph = document.getElementById("view-graph");
    const isGraph = view === "graph";
    graph.classList.toggle("hidden", !isGraph);
    cats.classList.toggle("hidden", isGraph);
    bGraph.classList.toggle("active", isGraph);
    bCats.classList.toggle("active", !isGraph);
    if (isGraph && !loaded) {
      loaded = true;
      render();
    }
  }

  async function render() {
    const svgEl = document.getElementById("concept-graph-svg");
    let data;
    try {
      const resp = await fetch(`${API_BASE}/api/graph`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      data = await resp.json();
    } catch (err) {
      svgEl.innerHTML =
        '<text x="24" y="40" fill="#b91c1c">Concept graph unavailable.</text>';
      return;
    }

    const nodes = data.nodes.map((n) => ({ ...n }));
    const links = data.edges.map((e) => ({ source: e.source, target: e.target }));
    const width = svgEl.clientWidth || 900;
    const height = svgEl.clientHeight || 640;

    const svg = d3.select(svgEl).attr("viewBox", [0, 0, width, height]);
    svg.selectAll("*").remove();
    const g = svg.append("g");
    svg.call(
      d3.zoom().scaleExtent([0.2, 4]).on("zoom", (ev) => g.attr("transform", ev.transform))
    );

    // Adjacency for hover highlighting (accessor works before or after the
    // simulation swaps string ids for node objects).
    const idOf = (x) => (x && x.id != null ? x.id : x);
    const adj = new Map(nodes.map((n) => [n.id, new Set()]));
    links.forEach((l) => {
      adj.get(idOf(l.source)).add(idOf(l.target));
      adj.get(idOf(l.target)).add(idOf(l.source));
    });

    const radius = (d) => 5 + Math.min(d.degree, 12);
    const color = d3.scaleOrdinal(d3.schemeTableau10);

    const link = g
      .append("g")
      .attr("stroke", "#cbd5e1")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(links)
      .join("line");

    const node = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .style("cursor", "pointer")
      .call(dragBehavior());

    node
      .append("circle")
      .attr("r", radius)
      .attr("fill", (d) => color(d.degree % 10))
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5);

    node
      .append("text")
      .text((d) => d.name)
      .attr("x", (d) => radius(d) + 3)
      .attr("y", 4)
      .attr("font-size", 10)
      .attr("fill", "#334155")
      .style("pointer-events", "none");

    node.append("title").text((d) => `${d.name} · ${d.degree} links`);

    node.on("click", (ev, d) => {
      window.location.href =
        "index.html?prompt=" + encodeURIComponent("explain " + d.name);
    });

    node
      .on("mouseover", (ev, d) => {
        const near = adj.get(d.id);
        node.style("opacity", (o) => (o.id === d.id || near.has(o.id) ? 1 : 0.12));
        link.style("stroke-opacity", (l) =>
          idOf(l.source) === d.id || idOf(l.target) === d.id ? 0.9 : 0.04
        );
      })
      .on("mouseout", () => {
        node.style("opacity", 1);
        link.style("stroke-opacity", 0.6);
      });

    sim = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(60).strength(0.25))
      .force("charge", d3.forceManyBody().strength(-140))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(20))
      .on("tick", () => {
        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);
        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });

    const search = document.getElementById("graph-search");
    if (search) {
      search.addEventListener("input", () => {
        const q = search.value.trim().toLowerCase();
        node.style("opacity", (o) => (!q || o.name.toLowerCase().includes(q) ? 1 : 0.1));
      });
    }
  }

  function dragBehavior() {
    return d3
      .drag()
      .on("start", (ev, d) => {
        if (!ev.active) sim.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (ev, d) => {
        d.fx = ev.x;
        d.fy = ev.y;
      })
      .on("end", (ev, d) => {
        if (!ev.active) sim.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const bCats = document.getElementById("view-categories");
    const bGraph = document.getElementById("view-graph");
    if (bCats) bCats.addEventListener("click", () => show("categories"));
    if (bGraph) bGraph.addEventListener("click", () => show("graph"));
  });
})();
