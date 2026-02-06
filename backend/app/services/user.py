"""User management service."""
from typing import List, Optional

from sqlalchemy.orm import Session

from ..auth import hash_password, verify_password, create_access_token, decode_access_token
from ..db.models import User, UserProgress


class UserService:
    """Manages user accounts and authentication."""

    def __init__(self, db: Session):
        self.db = db

    def create_user(self, email: str, password: str, name: Optional[str] = None) -> User:
        """Create a new user account."""
        if self.get_by_email(email):
            raise ValueError("Email already registered")
        
        user = User(
            email=email.lower(),
            hashed_password=hash_password(password),
            name=name,
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_id(self, user_id: str) -> Optional[User]:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email.lower()).first()

    def authenticate(self, email: str, password: str) -> Optional[User]:
        """Authenticate user and return user if valid."""
        user = self.get_by_email(email)
        if not user or not user.is_active:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user

    def create_token(self, user: User) -> str:
        """Create access token for user."""
        return create_access_token({"sub": user.id, "email": user.email})

    def get_user_from_token(self, token: str) -> Optional[User]:
        """Get user from access token."""
        payload = decode_access_token(token)
        if not payload:
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        return self.get_by_id(user_id)

    def update_profile(
        self,
        user: User,
        name: Optional[str] = None,
        learning_level: Optional[str] = None,
    ) -> User:
        """Update user profile."""
        if name is not None:
            user.name = name
        if learning_level is not None:
            user.learning_level = learning_level
        self.db.commit()
        self.db.refresh(user)
        return user


class ProgressService:
    """Manages user progress on concepts."""

    def __init__(self, db: Session):
        self.db = db

    def get_progress(self, user_id: str, concept_slug: str) -> Optional[UserProgress]:
        return (
            self.db.query(UserProgress)
            .filter(UserProgress.user_id == user_id, UserProgress.concept_slug == concept_slug)
            .first()
        )

    def update_progress(
        self,
        user_id: str,
        concept_slug: str,
        status: str,
        score: Optional[int] = None,
    ) -> UserProgress:
        """Update or create progress record."""
        progress = self.get_progress(user_id, concept_slug)
        if not progress:
            progress = UserProgress(
                user_id=user_id,
                concept_slug=concept_slug,
                status=status,
                score=score,
            )
            self.db.add(progress)
        else:
            progress.status = status
            if score is not None:
                progress.score = score
        self.db.commit()
        self.db.refresh(progress)
        return progress

    def list_progress(self, user_id: str) -> List[UserProgress]:
        return (
            self.db.query(UserProgress)
            .filter(UserProgress.user_id == user_id)
            .order_by(UserProgress.last_accessed.desc())
            .all()
        )
