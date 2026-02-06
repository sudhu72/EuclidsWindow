"""Authentication utilities: password hashing and JWT tokens."""
import hashlib
import hmac
import os
import time
from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timedelta
from typing import Optional
import json

from .config import get_settings

settings = get_settings()


# Simple password hashing using PBKDF2 (no external dependencies)
def hash_password(password: str) -> str:
    """Hash a password using PBKDF2-SHA256."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
    return urlsafe_b64encode(salt + key).decode()


def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash."""
    try:
        decoded = urlsafe_b64decode(hashed.encode())
        salt = decoded[:16]
        stored_key = decoded[16:]
        key = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 100000)
        return hmac.compare_digest(key, stored_key)
    except Exception:
        return False


# Simple JWT implementation (no external dependencies)
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a simple JWT-like token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=24))
    to_encode["exp"] = int(expire.timestamp())
    
    # Create header and payload
    header = urlsafe_b64encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode()).decode().rstrip("=")
    payload = urlsafe_b64encode(json.dumps(to_encode).encode()).decode().rstrip("=")
    
    # Create signature
    message = f"{header}.{payload}"
    secret = settings.jwt_secret.encode()
    signature = urlsafe_b64encode(
        hmac.new(secret, message.encode(), hashlib.sha256).digest()
    ).decode().rstrip("=")
    
    return f"{header}.{payload}.{signature}"


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and verify a JWT-like token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        
        header, payload, signature = parts
        
        # Verify signature
        message = f"{header}.{payload}"
        secret = settings.jwt_secret.encode()
        expected_sig = urlsafe_b64encode(
            hmac.new(secret, message.encode(), hashlib.sha256).digest()
        ).decode().rstrip("=")
        
        if not hmac.compare_digest(signature, expected_sig):
            return None
        
        # Decode payload
        # Add padding if needed
        payload_padded = payload + "=" * (4 - len(payload) % 4)
        data = json.loads(urlsafe_b64decode(payload_padded).decode())
        
        # Check expiration
        if data.get("exp", 0) < time.time():
            return None
        
        return data
    except Exception:
        return None
