"""routers/auth.py — Authentication endpoints."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend import models
from backend.auth import (
    COOKIE_NAME,
    ACCESS_TOKEN_EXPIRE_HOURS,
    verify_password,
    create_access_token,
    get_current_user,
)
from backend.schemas import LoginRequest, TokenResponse, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, response: Response, db: AsyncSession = Depends(get_db)):
    """
    Authenticate with email and password.
    Returns the access token in:
      - Response body (for API clients)
      - httpOnly cookie (for browser SPA)
    """
    result = await db.execute(select(models.User).where(models.User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        # Deliberately vague message to not leak whether email exists.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(user.id)

    # Set httpOnly cookie (browser SPA path).
    # SameSite=Lax: blocks cross-site POST (CSRF protection) while allowing
    # same-site navigation. Set Secure=True in production behind HTTPS.
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=ACCESS_TOKEN_EXPIRE_HOURS * 3600,
        path="/",
        # secure=True  # Uncomment when deployed behind HTTPS
    )

    return TokenResponse(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
async def get_me(current_user: models.User = Depends(get_current_user)):
    """Return the currently authenticated user's profile."""
    return UserRead.model_validate(current_user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    """Clear the authentication cookie."""
    response.delete_cookie(key=COOKIE_NAME, path="/", samesite="lax")
