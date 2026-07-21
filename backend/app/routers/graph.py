"""Concept graph (GraphRAG) routes: full graph + focused neighbourhood.

These power the interactive explorer and let clients inspect how a query
resolves to a concept and what it connects to.
"""
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from ..ai.concept_graph import get_concept_graph

router = APIRouter(tags=["graph"])


class GraphNode(BaseModel):
    id: str
    name: str
    degree: int


class GraphEdge(BaseModel):
    source: str
    target: str


class GraphResponse(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]


class NeighborhoodNode(BaseModel):
    id: str
    name: str
    focus: bool


class NeighborhoodResponse(BaseModel):
    focus: str
    nodes: List[NeighborhoodNode]
    edges: List[GraphEdge]


@router.get("/api/graph", response_model=GraphResponse)
async def graph_full() -> GraphResponse:
    """The whole concept graph (nodes + edges) for the explorer view."""
    graph = get_concept_graph()
    if not graph.is_available():
        raise HTTPException(status_code=503, detail="Concept graph is unavailable")
    return GraphResponse(**graph.to_dict())


@router.get("/api/graph/neighborhood", response_model=NeighborhoodResponse)
async def graph_neighborhood(
    concept: str = Query(..., min_length=1, max_length=300),
    hops: int = Query(1, ge=1, le=3),
) -> NeighborhoodResponse:
    """Resolve a query to a concept and return its ``hops``-neighbourhood."""
    result: Optional[Dict[str, Any]] = get_concept_graph().neighborhood(concept, hops=hops)
    if not result:
        raise HTTPException(status_code=404, detail=f"No concept matched '{concept}'")
    return NeighborhoodResponse(**result)
