"""User auth service: register, login, JWT issue/verify.

Storage is a JSON file keyed by lowercased email; fine for a single-process
dev backend. Swap for SQLite/Postgres without touching the router by keeping
the function signatures the same.
"""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt

from app.config import settings
from app.services.store import read_json, write_json

# bcrypt's native limit is 72 bytes; truncate before hashing to avoid surprise errors.
_BCRYPT_MAX = 72


def _hash_password(password: str) -> str:
    pw = password.encode("utf-8")[:_BCRYPT_MAX]
    return bcrypt.hashpw(pw, bcrypt.gensalt(rounds=12)).decode("utf-8")


def _verify_password(password: str, hashed: str) -> bool:
    pw = password.encode("utf-8")[:_BCRYPT_MAX]
    try:
        return bcrypt.checkpw(pw, hashed.encode("utf-8"))
    except ValueError:
        return False


# ── Storage primitives ────────────────────────────────────────────────────

def _all() -> dict:
    return read_json(settings.users_file, default={})


def _save(users: dict) -> None:
    write_json(settings.users_file, users)


def _public(user: dict) -> dict:
    """Strip the password hash before returning to the client."""
    return {k: v for k, v in user.items() if k != "password_hash"}


# ── CRUD ──────────────────────────────────────────────────────────────────

def find_by_email(email: str) -> Optional[dict]:
    return _all().get(email.lower().strip())


def find_by_id(user_id: str) -> Optional[dict]:
    for u in _all().values():
        if u.get("id") == user_id:
            return u
    return None


def register(name: str, email: str, password: str) -> dict:
    """Create a new user; raises ValueError if email already taken."""
    email_key = email.lower().strip()
    users = _all()
    if email_key in users:
        raise ValueError("Email already registered")

    user = {
        "id": uuid.uuid4().hex,
        "name": name.strip() or email_key,
        "email": email_key,
        "password_hash": _hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    users[email_key] = user
    _save(users)
    return _public(user)


def authenticate(email: str, password: str) -> Optional[dict]:
    user = find_by_email(email)
    if not user:
        return None
    if not _verify_password(password, user["password_hash"]):
        return None
    return _public(user)


# ── JWT ───────────────────────────────────────────────────────────────────

def issue_token(user_id: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_expires_min)).timestamp()),
    }
    return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    """Decode a token; raises jwt.PyJWTError on failure."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
