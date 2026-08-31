from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.dependencies import get_project_if_member

router = APIRouter(prefix="", tags=["activity"])


@router.get("/activity", response_model=List[schemas.ActivityEventRead])
async def list_global_activity(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List global activity events accessible to the authenticated user.
    This includes activity from projects the user is a member of,
    or activity performed by the user themselves.
    """
    # Get IDs of projects the user is a member of
    proj_result = await db.execute(
        select(models.ProjectMember.project_id)
        .where(models.ProjectMember.user_id == current_user.id)
    )
    user_project_ids = proj_result.scalars().all()
    
    # Select events that belong to those projects, OR were performed by the user.
    result = await db.execute(
        select(models.ActivityEvent)
        .where(
            or_(
                models.ActivityEvent.project_id.in_(user_project_ids),
                models.ActivityEvent.actor_id == current_user.id
            )
        )
        .order_by(models.ActivityEvent.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()


@router.get("/projects/{project_id}/activity", response_model=List[schemas.ActivityEventRead])
async def list_project_activity(
    project_id: str,
    project: models.Project = Depends(get_project_if_member),
    db: AsyncSession = Depends(get_db)
):
    """
    List activity events for a specific project.
    Only accessible if the user is a member of the project.
    """
    result = await db.execute(
        select(models.ActivityEvent)
        .where(models.ActivityEvent.project_id == project_id)
        .order_by(models.ActivityEvent.created_at.desc())
        .limit(50)
    )
    return result.scalars().all()
