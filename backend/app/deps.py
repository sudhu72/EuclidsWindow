"""Shared FastAPI dependencies.

Kept separate from ``main.py`` so routers (which ``main.py`` imports) can
depend on auth without a circular import back into ``main``.
"""
from typing import Optional

from fastapi import Depends, Header
from fastapi import HTTPException
from sqlalchemy.orm import Session

from .db import User, get_db
from .services import UserService

__all__ = ["get_db", "get_current_user", "require_user"]


def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """Get current user from Authorization header (optional)."""
    if not authorization:
        return None
    if not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    service = UserService(db)
    return service.get_user_from_token(token)


def require_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
) -> User:
    """Require authenticated user."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization[7:]
    service = UserService(db)
    user = service.get_user_from_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user
