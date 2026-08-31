from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.utils import get_utc_now, log_activity

router = APIRouter(prefix="/users", tags=["users"])

@router.get("", response_model=List[schemas.UserRead])
async def list_users(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a list of all users."""
    result = await db.execute(select(models.User))
    users = result.scalars().all()
    return [schemas.UserRead.model_validate(u) for u in users]

@router.patch("/me", response_model=schemas.UserRead)
async def update_me(
    body: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update the current user's profile."""
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return schemas.UserRead.model_validate(current_user)
        
    for key, value in update_data.items():
        setattr(current_user, key, value)
        
    current_user.updated_at = get_utc_now()
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="updated",
        entity_type="user",
        entity_id=current_user.id,
        entity_ref=current_user.email,
        entity_title=current_user.name
    )
    
    await db.commit()
    await db.refresh(current_user)
    return schemas.UserRead.model_validate(current_user)
