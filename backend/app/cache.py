"""Simple in-memory cache with TTL (Redis-compatible interface)."""
import time
from typing import Any, Dict, Optional


class SimpleCache:
    """Thread-safe in-memory cache with TTL support."""

    def __init__(self):
        self._cache: Dict[str, tuple[Any, float]] = {}

    def get(self, key: str) -> Optional[Any]:
        """Get value by key if not expired."""
        if key not in self._cache:
            return None
        value, expires_at = self._cache[key]
        if expires_at and time.time() > expires_at:
            del self._cache[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        """Set value with optional TTL in seconds."""
        expires_at = time.time() + ttl if ttl else None
        self._cache[key] = (value, expires_at)

    def delete(self, key: str) -> bool:
        """Delete key and return True if existed."""
        if key in self._cache:
            del self._cache[key]
            return True
        return False

    def clear(self) -> None:
        """Clear all cached values."""
        self._cache.clear()

    def cleanup_expired(self) -> int:
        """Remove expired entries and return count removed."""
        now = time.time()
        expired = [k for k, (_, exp) in self._cache.items() if exp and now > exp]
        for key in expired:
            del self._cache[key]
        return len(expired)


# Global cache instance
cache = SimpleCache()
