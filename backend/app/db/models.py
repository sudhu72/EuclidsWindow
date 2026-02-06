"""Database models for conversations, concepts, users, and resources."""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import relationship

from .base import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


# Association tables
concept_prerequisites = Table(
    "concept_prerequisites",
    Base.metadata,
    Column("concept_id", String(36), ForeignKey("concepts.id"), primary_key=True),
    Column("prerequisite_id", String(36), ForeignKey("concepts.id"), primary_key=True),
)

concept_resources = Table(
    "concept_resources",
    Base.metadata,
    Column("concept_id", String(36), ForeignKey("concepts.id"), primary_key=True),
    Column("resource_id", String(36), ForeignKey("resources.id"), primary_key=True),
)


class User(Base):
    """User account."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(128), nullable=True)
    learning_level = Column(String(32), default="beginner")  # beginner, intermediate, advanced
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    conversations = relationship("Conversation", back_populates="user")
    progress = relationship("UserProgress", back_populates="user")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="conversations")
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(36), ForeignKey("conversations.id"), nullable=False)
    role = Column(String(16), nullable=False)
    content = Column(Text, nullable=False)
    visualization_id = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("Conversation", back_populates="messages")


class UserProgress(Base):
    """Track user's progress on concepts."""
    __tablename__ = "user_progress"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    concept_slug = Column(String(64), nullable=False)
    status = Column(String(32), default="not_started")  # not_started, in_progress, completed
    score = Column(Integer, nullable=True)  # Quiz score if applicable
    last_accessed = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress")


class Concept(Base):
    """Mathematical concept for the knowledge graph."""
    __tablename__ = "concepts"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(128), nullable=False)
    description = Column(Text, nullable=True)
    level = Column(Integer, default=0)
    category = Column(String(64), nullable=True)
    euclid_ref = Column(String(64), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    prerequisites = relationship(
        "Concept",
        secondary=concept_prerequisites,
        primaryjoin=id == concept_prerequisites.c.concept_id,
        secondaryjoin=id == concept_prerequisites.c.prerequisite_id,
        backref="leads_to",
    )
    resources = relationship("Resource", secondary=concept_resources, back_populates="concepts")


class EuclidEntry(Base):
    """Entry from Euclid's Elements."""
    __tablename__ = "euclid_entries"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    reference = Column(String(32), unique=True, nullable=False, index=True)
    book = Column(Integer, nullable=False)
    entry_type = Column(String(32), nullable=False)
    number = Column(Integer, nullable=False)
    original_text = Column(Text, nullable=False)
    modern_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Resource(Base):
    """Learning resource (book, video, course, etc.)."""
    __tablename__ = "resources"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    title = Column(String(255), nullable=False)
    author = Column(String(255), nullable=True)
    resource_type = Column(String(32), nullable=False)
    difficulty = Column(String(32), nullable=True)
    url = Column(String(512), nullable=True)
    isbn = Column(String(32), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    concepts = relationship("Concept", secondary=concept_resources, back_populates="resources")
