"""Conversation persistence service."""
from typing import List, Optional

from sqlalchemy.orm import Session

from ..db.models import Conversation, Message


class ConversationService:
    """Manages conversation and message persistence."""

    def __init__(self, db: Session):
        self.db = db

    def create_conversation(
        self, title: Optional[str] = None, user_id: Optional[str] = None
    ) -> Conversation:
        conversation = Conversation(title=title, user_id=user_id)
        self.db.add(conversation)
        self.db.commit()
        self.db.refresh(conversation)
        return conversation

    def get_conversation(self, conversation_id: str) -> Optional[Conversation]:
        return self.db.query(Conversation).filter(Conversation.id == conversation_id).first()

    def list_conversations(
        self, user_id: Optional[str] = None, limit: int = 50
    ) -> List[Conversation]:
        query = self.db.query(Conversation)
        if user_id:
            query = query.filter(Conversation.user_id == user_id)
        else:
            # For anonymous users, only show conversations without user_id
            query = query.filter(Conversation.user_id.is_(None))
        return (
            query.order_by(Conversation.updated_at.desc())
            .limit(limit)
            .all()
        )

    def add_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        visualization_id: Optional[str] = None,
    ) -> Message:
        message = Message(
            conversation_id=conversation_id,
            role=role,
            content=content,
            visualization_id=visualization_id,
        )
        self.db.add(message)
        self.db.commit()
        self.db.refresh(message)
        return message

    def get_messages(self, conversation_id: str) -> List[Message]:
        return (
            self.db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at)
            .all()
        )
