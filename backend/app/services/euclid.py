"""Euclid's Elements service."""
from typing import List, Optional

from sqlalchemy.orm import Session

from ..db.models import EuclidEntry


class EuclidService:
    """Manages Euclid's Elements content."""

    def __init__(self, db: Session):
        self.db = db

    def get_by_reference(self, reference: str) -> Optional[EuclidEntry]:
        return self.db.query(EuclidEntry).filter(EuclidEntry.reference == reference).first()

    def search(
        self,
        query: Optional[str] = None,
        book: Optional[int] = None,
        entry_type: Optional[str] = None,
        limit: int = 20,
    ) -> List[EuclidEntry]:
        q = self.db.query(EuclidEntry)

        if query:
            pattern = f"%{query}%"
            q = q.filter(
                (EuclidEntry.original_text.ilike(pattern))
                | (EuclidEntry.modern_text.ilike(pattern))
            )

        if book:
            q = q.filter(EuclidEntry.book == book)

        if entry_type:
            q = q.filter(EuclidEntry.entry_type == entry_type)

        return q.order_by(EuclidEntry.book, EuclidEntry.number).limit(limit).all()

    def list_by_book(self, book: int) -> List[EuclidEntry]:
        return (
            self.db.query(EuclidEntry)
            .filter(EuclidEntry.book == book)
            .order_by(EuclidEntry.entry_type, EuclidEntry.number)
            .all()
        )
