"""
auth.py — JWT authentication helpers.

Security design:
  - Passwords hashed with bcrypt via passlib (work factor = 12).
  - Access tokens are signed JWTs (HS256) with a 24-hour expiry.
  - Token is stored in an httpOnly, SameSite=Lax cookie so it is never
    accessible to JavaScript (mitigates XSS token theft).
  - The same token is also accepted in the Authorization: Bearer header
    for programmatic API access (e.g. tests, curl).
  - HTTPS is required in production; the Secure cookie flag must be set
    behind a TLS-terminating reverse proxy (documented in DECISIONS.md).

Tradeoff: httpOnly cookies prevent JavaScript from reading the token
  (XSS mitigation) but require CORS credentials mode and a SameSite
  policy to prevent CSRF. SameSite=Lax is used here, which blocks
  cross-site POST requests while allowing GET navigation — a reasonable
  default for a same-site SPA.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend import models

# ---------------------------------------------------------------------------
# Configuration (override with environment variables in production)
# ---------------------------------------------------------------------------

SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production-do-not-use-as-is")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24
COOKIE_NAME = "flowforge_access_token"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)


# ---------------------------------------------------------------------------
# Password utilities
# ---------------------------------------------------------------------------

def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ---------------------------------------------------------------------------
# JWT utilities
# ---------------------------------------------------------------------------

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    payload = {"sub": user_id, "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[str]:
    """Return user_id from a valid token, or None on any error."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# FastAPI dependency: resolve current authenticated user
# ---------------------------------------------------------------------------

async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
    bearer: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> models.User:
    """
    Resolves the authenticated user from:
      1. Authorization: Bearer <token> header (API clients, tests)
      2. httpOnly cookie (browser SPA)

    Raises HTTP 401 if no valid token is found.
    """
    token: Optional[str] = None

    # Prefer the Authorization header (higher priority for API clients)
    if bearer and bearer.credentials:
        token = bearer.credentials
    else:
        # Fall back to httpOnly cookie
        token = request.cookies.get(COOKIE_NAME)

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = decode_token(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(models.User).where(models.User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
        )

    return user
