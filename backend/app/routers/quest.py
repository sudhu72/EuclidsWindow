"""Math Quest: a story-driven game over the existing Concept prerequisite DAG.

Stateless by design — lock/unlock/completed state is computed client-side from
this graph plus the player's own completed-node set (localStorage, or
``/api/progress`` when logged in). This endpoint only ever returns structure
and flavor text, so it stays cacheable and needs no per-user branching.
"""
import json
from pathlib import Path
from typing import Dict, List, Literal, Optional

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..db import Concept, get_db

router = APIRouter(tags=["quest"])

Theme = Literal["mystery", "treasure"]

_FLAVOR_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "quest_flavor.json"
_flavor_cache: Optional[Dict] = None


def _load_flavor() -> Dict:
    global _flavor_cache
    if _flavor_cache is None:
        _flavor_cache = json.loads(_FLAVOR_PATH.read_text())
    return _flavor_cache


class QuestNode(BaseModel):
    slug: str
    name: str
    description: str = ""
    level: int
    category: str
    euclid_ref: Optional[str] = None
    prerequisites: List[str]
    x: int
    y: int
    flavor_title: str
    flavor_intro: str
    flavor_hint: str
    flavor_success: str


class QuestEdge(BaseModel):
    source: str
    target: str


class QuestChapter(BaseModel):
    level: int
    title: str


class QuestGraphResponse(BaseModel):
    theme: Theme
    nodes: List[QuestNode]
    edges: List[QuestEdge]
    chapters: List[QuestChapter]


@router.get("/api/quest/graph", response_model=QuestGraphResponse)
async def quest_graph(
    theme: Theme = Query("mystery"),
    db: Session = Depends(get_db),
) -> QuestGraphResponse:
    """The full 110-concept prerequisite DAG, laid out and flavored for ``theme``."""
    flavor = _load_flavor()
    categories = flavor["categories"]
    chapters = flavor["chapters"]

    concepts = db.query(Concept).order_by(Concept.level, Concept.name).all()

    # Deterministic layered layout: y = level band, x = index within that band.
    level_counts: Dict[int, int] = {}
    nodes: List[QuestNode] = []
    edges: List[QuestEdge] = []
    for concept in concepts:
        category = concept.category or "foundations"
        cat_flavor = categories.get(category, categories["foundations"])[theme]
        x = level_counts.get(concept.level, 0)
        level_counts[concept.level] = x + 1
        name = concept.name
        nodes.append(
            QuestNode(
                slug=concept.slug,
                name=name,
                description=concept.description or "",
                level=concept.level,
                category=category,
                euclid_ref=concept.euclid_ref,
                prerequisites=[p.slug for p in concept.prerequisites],
                x=x,
                y=concept.level,
                flavor_title=name,
                flavor_intro=cat_flavor["intro"].format(name=name),
                flavor_hint=cat_flavor["hint"].format(name=name),
                flavor_success=cat_flavor["success"].format(name=name),
            )
        )
        for prereq in concept.prerequisites:
            edges.append(QuestEdge(source=prereq.slug, target=concept.slug))

    chapter_list = [
        QuestChapter(level=int(lvl), title=titles[theme])
        for lvl, titles in sorted(chapters.items(), key=lambda kv: int(kv[0]))
    ]

    return QuestGraphResponse(theme=theme, nodes=nodes, edges=edges, chapters=chapter_list)
