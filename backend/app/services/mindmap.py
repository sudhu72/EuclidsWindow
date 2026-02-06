"""Mind map generation service using NetworkX."""
from typing import Any, Dict, List, Optional

import networkx as nx
from sqlalchemy.orm import Session

from ..db.models import Concept


class MindMapService:
    """Generates concept dependency graphs for visualization."""

    def __init__(self, db: Session):
        self.db = db

    def get_concept_by_slug(self, slug: str) -> Optional[Concept]:
        return self.db.query(Concept).filter(Concept.slug == slug).first()

    def build_mind_map(
        self,
        target_slug: str,
        depth: int = 3,
        include_leads_to: bool = True,
    ) -> Optional[Dict[str, Any]]:
        """Build a mind map centered on the target concept.

        Returns D3.js-compatible JSON with nodes and links.
        """
        target = self.get_concept_by_slug(target_slug)
        if not target:
            return None

        graph = nx.DiGraph()
        visited = set()

        # Add target node
        self._add_node(graph, target, is_target=True)
        visited.add(target.id)

        # Traverse prerequisites (ancestors)
        self._traverse_prerequisites(graph, target, depth, visited)

        # Optionally traverse leads_to (descendants)
        if include_leads_to:
            self._traverse_leads_to(graph, target, depth, visited)

        return self._to_d3_json(graph, target.slug)

    def _add_node(self, graph: nx.DiGraph, concept: Concept, is_target: bool = False):
        graph.add_node(
            concept.slug,
            id=concept.id,
            name=concept.name,
            description=concept.description or "",
            level=concept.level,
            category=concept.category or "general",
            euclid_ref=concept.euclid_ref,
            is_target=is_target,
        )

    def _traverse_prerequisites(
        self, graph: nx.DiGraph, concept: Concept, depth: int, visited: set
    ):
        if depth <= 0:
            return

        for prereq in concept.prerequisites:
            if prereq.id not in visited:
                self._add_node(graph, prereq)
                visited.add(prereq.id)
                self._traverse_prerequisites(graph, prereq, depth - 1, visited)

            # Add edge: prereq -> concept (prerequisite points to what it enables)
            graph.add_edge(prereq.slug, concept.slug, relation="prerequisite")

    def _traverse_leads_to(
        self, graph: nx.DiGraph, concept: Concept, depth: int, visited: set
    ):
        if depth <= 0:
            return

        for next_concept in concept.leads_to:
            if next_concept.id not in visited:
                self._add_node(graph, next_concept)
                visited.add(next_concept.id)
                self._traverse_leads_to(graph, next_concept, depth - 1, visited)

            # Add edge: concept -> next_concept
            graph.add_edge(concept.slug, next_concept.slug, relation="leads_to")

    def _to_d3_json(self, graph: nx.DiGraph, target_slug: str) -> Dict[str, Any]:
        nodes = []
        for node_id in graph.nodes():
            data = graph.nodes[node_id]
            nodes.append({
                "id": node_id,
                "name": data.get("name", node_id),
                "description": data.get("description", ""),
                "level": data.get("level", 0),
                "category": data.get("category", "general"),
                "euclid_ref": data.get("euclid_ref"),
                "is_target": data.get("is_target", False),
            })

        links = []
        for source, target in graph.edges():
            edge_data = graph.edges[source, target]
            links.append({
                "source": source,
                "target": target,
                "relation": edge_data.get("relation", "related"),
            })

        return {
            "target": target_slug,
            "nodes": nodes,
            "links": links,
        }

    def list_concepts(self, category: Optional[str] = None, limit: int = 100) -> List[Concept]:
        query = self.db.query(Concept)
        if category:
            query = query.filter(Concept.category == category)
        return query.order_by(Concept.level, Concept.name).limit(limit).all()
