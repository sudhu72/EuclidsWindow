"""Resource catalog service."""
from typing import List, Optional

from sqlalchemy.orm import Session

from ..db.models import Resource


class ResourceService:
    """Manages learning resources."""

    def __init__(self, db: Session):
        self.db = db

    def search(
        self,
        query: Optional[str] = None,
        resource_type: Optional[str] = None,
        difficulty: Optional[str] = None,
        limit: int = 20,
    ) -> List[Resource]:
        q = self.db.query(Resource)

        if query:
            pattern = f"%{query}%"
            q = q.filter(
                (Resource.title.ilike(pattern))
                | (Resource.description.ilike(pattern))
                | (Resource.author.ilike(pattern))
            )

        if resource_type:
            q = q.filter(Resource.resource_type == resource_type)

        if difficulty:
            q = q.filter(Resource.difficulty == difficulty)

        return q.order_by(Resource.title).limit(limit).all()

    def get_by_id(self, resource_id: str) -> Optional[Resource]:
        return self.db.query(Resource).filter(Resource.id == resource_id).first()

    def get_for_concept(self, concept_slug: str) -> List[Resource]:
        from ..db.models import Concept
        concept = self.db.query(Concept).filter(Concept.slug == concept_slug).first()
        if not concept:
            return []
        return list(concept.resources)
