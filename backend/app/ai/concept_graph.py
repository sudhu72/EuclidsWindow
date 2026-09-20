"""Concept knowledge graph (GraphRAG) — ground answers in relationships.

Vector RAG (``library.py``) finds *text* that looks similar to a query; it can
blur two things that read alike ("Euler's identity" vs "Euler's formula for
planar graphs"). A concept graph instead finds *relationships*: each math topic
is a node, and ``related_concepts`` links are edges. Resolving a query to a
specific node and injecting that node's actual neighbourhood keeps an answer on
the intended concept instead of drifting to a look-alike.

The graph is built from ``data/demo_topics.json`` (the curated topic set), so it
stays in sync with the app's content with no separate authoring step. Nodes are
topics; edges come from each topic's ``related_concepts`` strings resolved back
to nodes by id, name, or keyword.
"""
from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

from ..logging_config import logger

_WORD = re.compile(r"[a-z0-9]+")

# Filler words stripped before judging how much of a query an alias actually
# explains — so "explain" and "the" in "explain the schrodinger equation"
# don't get credited to whichever alias happens to match.
_STOPWORDS = frozenset(
    "a an the is are was were do does did explain what why how when where "
    "which who whom this that these those of in on at to for and or not no "
    "please tell show describe about it its can could would should will "
    "really actually just very".split()
)


def _norm(text: str) -> str:
    return " ".join(_WORD.findall((text or "").lower()))


class ConceptGraph:
    def __init__(self, topics_path: Path) -> None:
        self._nodes: Dict[str, Dict[str, Any]] = {}
        self._edges: Set[Tuple[str, str]] = set()          # undirected pairs (a<b)
        self._adj: Dict[str, Set[str]] = {}
        self._alias_index: Dict[str, str] = {}             # normalized alias -> node id
        try:
            self._build(topics_path)
        except Exception as exc:  # pragma: no cover - defensive
            logger.error(f"ConceptGraph: failed to build from {topics_path}: {exc}")

    # ------------------------------------------------------------------
    # Build
    # ------------------------------------------------------------------

    def _build(self, topics_path: Path) -> None:
        data = json.loads(topics_path.read_text())
        topics = data.get("topics", []) if isinstance(data, dict) else data
        for t in topics:
            tid = t.get("id")
            if not tid:
                continue
            self._nodes[tid] = {
                "id": tid,
                "name": t.get("name", tid),
                "keywords": [k for k in (t.get("keywords") or []) if isinstance(k, str)],
                "related": [r for r in (t.get("related_concepts") or []) if isinstance(r, str)],
            }
            self._adj.setdefault(tid, set())

        # Alias index: id, name, and each keyword point back to their node. When
        # two nodes claim the same alias the more specific (longer id) wins is not
        # meaningful here, so first-writer keeps it and we skip duplicates.
        for tid, node in self._nodes.items():
            for alias in [tid, node["name"], *node["keywords"]]:
                self._register_alias(alias, tid)

        # Merge the Cogito seed (gallery visualizations → concept nodes/edges)
        # BEFORE building edges, so cogito↔cogito related links resolve too.
        self._merge_cogito(topics_path.parent / "cogito_concepts.json")

        # Edges: resolve each related_concepts string to a node.
        for tid, node in self._nodes.items():
            for rel in node["related"]:
                target = self._resolve_alias(rel)
                if target and target != tid:
                    self._add_edge(tid, target)
        logger.info(
            f"ConceptGraph: {len(self._nodes)} nodes, {len(self._edges)} edges"
        )

    def _register_alias(self, alias: str, tid: str) -> None:
        key = _norm(alias)
        if key and key not in self._alias_index:
            self._alias_index[key] = tid

    def _merge_cogito(self, cogito_path: Path) -> None:
        """Fold the Cogito seed into the graph.

        Each entry attaches a Cogito Gallery visualization (``viz``) and its
        source tutorial (``source``) to a concept. If the id already exists it
        enriches that node (viz/source + extra ``related`` links); otherwise a
        new node is added and indexed. Edges are built by the caller afterwards.
        """
        if not cogito_path.exists():
            return
        try:
            entries = json.loads(cogito_path.read_text()).get("concepts", [])
        except Exception as exc:  # pragma: no cover - defensive
            logger.error(f"ConceptGraph: failed to read {cogito_path}: {exc}")
            return
        added = 0
        for e in entries:
            cid = e.get("id")
            if not cid:
                continue
            related = [r for r in (e.get("related") or []) if isinstance(r, str)]
            viz = e.get("viz")
            source = e.get("source")
            existing = self._nodes.get(cid)
            if existing is not None:
                # Enrich an existing topic node.
                existing.setdefault("related", [])
                for r in related:
                    if r not in existing["related"]:
                        existing["related"].append(r)
                if viz:
                    existing["viz"] = viz
                if source:
                    existing["source"] = source
            else:
                node = {
                    "id": cid,
                    "name": e.get("name", cid),
                    "keywords": [k for k in (e.get("keywords") or []) if isinstance(k, str)],
                    "related": related,
                    "viz": viz,
                    "source": source,
                }
                self._nodes[cid] = node
                self._adj.setdefault(cid, set())
                for alias in [cid, node["name"], *node["keywords"]]:
                    self._register_alias(alias, cid)
                added += 1
        logger.info(f"ConceptGraph: merged Cogito seed ({added} new nodes, {len(entries)} entries)")

    def _add_edge(self, a: str, b: str) -> None:
        self._edges.add((a, b) if a < b else (b, a))
        self._adj[a].add(b)
        self._adj[b].add(a)

    def _resolve_alias(self, text: str) -> Optional[str]:
        """Resolve an exact-ish alias string (from related_concepts) to a node."""
        key = _norm(text)
        if not key:
            return None
        if key in self._alias_index:
            return self._alias_index[key]
        # Singular/plural slack: "triangles" -> "triangle".
        if key.endswith("s") and key[:-1] in self._alias_index:
            return self._alias_index[key[:-1]]
        return None

    # ------------------------------------------------------------------
    # Query
    # ------------------------------------------------------------------

    def is_available(self) -> bool:
        return bool(self._nodes)

    def resolve(self, query: str) -> Optional[str]:
        """Resolve free-text (a question or lesson topic) to its concept node.

        Prefers the most *specific* alias that appears in the query — a longer,
        multi-word alias beats a short generic one, so "Euler's identity" binds
        to the ``euler`` node rather than to a stray ``e`` or ``identity``.

        A candidate must also account for at least half of the query's
        actual content (stopwords aside), weighted by word length, not just
        be present somewhere in it — otherwise a single generic keyword
        (e.g. "equation" inside "the Navier-Stokes equation" or "the
        Schrodinger equation") would hijack an unrelated, more specific
        topic just by being the only thing that matches at all. Weighting by
        length (rather than token count) keeps short filler content words
        ("area", "measure", "need") from outweighing a legitimate single-word
        match the way an unrecognized proper noun ("navier-stokes",
        "schrodinger") should.
        """
        q = _norm(query)
        if not q:
            return None
        if q in self._alias_index:
            return self._alias_index[q]
        q_tokens = set(q.split())
        # Drop stopwords and 1-2 letter noise (stray variable names, units)
        # so they neither inflate nor deflate how "explained" a query is.
        content_tokens = {t for t in q_tokens if t not in _STOPWORDS and len(t) > 2}
        content_len = sum(len(t) for t in content_tokens) or 1
        best_id, best_score = None, 0
        for alias, tid in self._alias_index.items():
            a_tokens = alias.split()
            if not a_tokens:
                continue
            # Alias must appear wholly in the query (as a phrase or token set).
            if alias in q or set(a_tokens) <= q_tokens:
                # Longer, multi-word aliases are more specific → higher score.
                score = len(alias) + 5 * (len(a_tokens) - 1)
                if score <= best_score:
                    continue
                # A content token counts as "explained" by this alias if it
                # (or its singular form) appears in the alias text — matches
                # how the alias itself matched the query above, including the
                # plural/singular slack ("numbers" vs. "imaginary number").
                covered_len = sum(
                    len(t)
                    for t in content_tokens
                    if t in alias or (len(t) > 3 and t.endswith("s") and t[:-1] in alias)
                )
                if covered_len * 2 < content_len:
                    continue  # explains less than half the query — too weak
                best_id, best_score = tid, score
        # Require a non-trivial match so a single 2-3 char token can't hijack.
        return best_id if best_score >= 4 else None

    def neighbors(self, node_id: str, hops: int = 1) -> List[str]:
        """Node ids within ``hops`` of ``node_id`` (excluding itself)."""
        if node_id not in self._adj:
            return []
        seen = {node_id}
        frontier = {node_id}
        for _ in range(max(1, hops)):
            nxt: Set[str] = set()
            for n in frontier:
                nxt |= self._adj.get(n, set())
            frontier = nxt - seen
            seen |= nxt
        return [n for n in seen if n != node_id]

    def node(self, node_id: str) -> Optional[Dict[str, Any]]:
        return self._nodes.get(node_id)

    def context_for(self, query: str, hops: int = 1) -> str:
        """Relationship grounding block for prompt injection, or '' if no match.

        Names the specific concept the query resolves to plus its directly
        related concepts, and tells the model to stay on that concept — the
        disambiguation that plain vector similarity misses.
        """
        nid = self.resolve(query)
        if not nid:
            return ""
        node = self._nodes[nid]
        related = [self._nodes[n]["name"] for n in sorted(self.neighbors(nid, hops))]
        lines = [
            "Concept map (ground your answer in these relationships):",
            f"- Focus concept: {node['name']}",
        ]
        if related:
            lines.append(f"- Directly related concepts: {', '.join(related)}")
        if node.get("viz"):
            lines.append(
                "- An interactive visualization of this concept is available in the "
                "app's Cogito Gallery; you may invite the learner to open it."
            )
        lines.append(
            f"Answer about \"{node['name']}\" specifically; do not drift to a "
            "different topic that merely shares a name or keyword."
        )
        return "\n".join(lines)

    # ------------------------------------------------------------------
    # Serialization (for the explorer UI / API)
    # ------------------------------------------------------------------

    @staticmethod
    def _viz_url(node: Dict[str, Any]) -> Optional[str]:
        viz = node.get("viz")
        return f"/visualizations/cogito/{viz}" if viz else None

    def to_dict(self) -> Dict[str, Any]:
        def _node(n: Dict[str, Any]) -> Dict[str, Any]:
            d = {"id": n["id"], "name": n["name"], "degree": len(self._adj.get(n["id"], ()))}
            url = self._viz_url(n)
            if url:
                d["viz"] = url
                if n.get("source"):
                    d["source"] = n["source"]
            return d

        return {
            "nodes": [_node(n) for n in self._nodes.values()],
            "edges": [{"source": a, "target": b} for a, b in sorted(self._edges)],
        }

    def neighborhood(self, query: str, hops: int = 1) -> Optional[Dict[str, Any]]:
        """A focus node plus its ``hops``-neighbourhood as a small subgraph."""
        nid = self.resolve(query)
        if not nid:
            return None
        keep = {nid, *self.neighbors(nid, hops)}
        nodes = []
        for i in keep:
            n = self._nodes[i]
            item = {"id": i, "name": n["name"], "focus": i == nid}
            url = self._viz_url(n)
            if url:
                item["viz"] = url
            nodes.append(item)
        edges = [
            {"source": a, "target": b}
            for a, b in self._edges
            if a in keep and b in keep
        ]
        return {"focus": nid, "nodes": nodes, "edges": edges}


_graph: Optional[ConceptGraph] = None


def get_concept_graph() -> ConceptGraph:
    global _graph
    if _graph is None:
        base = Path(__file__).resolve().parents[2]  # backend/
        _graph = ConceptGraph(base / "data" / "demo_topics.json")
    return _graph
