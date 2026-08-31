from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.utils import get_utc_now

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=List[schemas.NotificationRead])
async def list_notifications(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List notifications for the authenticated user, newest first."""
    result = await db.execute(
        select(models.Notification)
        .where(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.created_at.desc())
    )
    return result.scalars().all()


@router.patch("/read-all")
async def mark_all_read(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark all notifications as read for the authenticated user."""
    await db.execute(
        update(models.Notification)
        .where(models.Notification.user_id == current_user.id)
        .where(models.Notification.read == False)
        .values(read=True)
    )
    await db.commit()
    return {"status": "ok"}


@router.patch("/{notification_id}/read", response_model=schemas.NotificationRead)
async def mark_read(
    notification_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Mark a specific notification as read."""
    result = await db.execute(
        select(models.Notification)
        .where(models.Notification.id == notification_id)
        .where(models.Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    notification.read = True
    await db.commit()
    await db.refresh(notification)
    return notification


@router.delete("/{notification_id}", status_code=204)
async def delete_notification(
    notification_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Dismiss/delete a notification."""
    result = await db.execute(
        select(models.Notification)
        .where(models.Notification.id == notification_id)
        .where(models.Notification.user_id == current_user.id)
    )
    notification = result.scalar_one_or_none()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    await db.delete(notification)
    await db.commit()
