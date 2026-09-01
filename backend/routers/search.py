from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_
from typing import List, Optional

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user

router = APIRouter(prefix="/search", tags=["search"])

@router.get("", response_model=schemas.SearchResults)
async def search(
    q: Optional[str] = Query(None, description="Search term"),
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Global search for projects, stories, and tasks accessible to the user.
    """
    # 1. Get user's projects
    proj_result = await db.execute(
        select(models.ProjectMember.project_id)
        .where(models.ProjectMember.user_id == current_user.id)
    )
    user_project_ids = proj_result.scalars().all()
    
    if not user_project_ids:
        return schemas.SearchResults(projects=[], stories=[], tasks=[])
        
    term = f"%{q.lower()}%" if q else None
    
    from sqlalchemy.orm import selectinload

    # Projects
    p_query = select(models.Project).where(models.Project.id.in_(user_project_ids))
    if term:
        p_query = p_query.where(
            or_(
                models.Project.name.ilike(term),
                models.Project.key.ilike(term),
                models.Project.description.ilike(term)
            )
        )
    p_query = p_query.options(selectinload(models.Project.members)).limit(6 if term else 3)
    projects_result = await db.execute(p_query)
    projects = projects_result.scalars().all()
    
    # Stories
    s_query = select(models.UserStory).where(models.UserStory.project_id.in_(user_project_ids))
    if term:
        s_query = s_query.where(
            or_(
                models.UserStory.title.ilike(term),
                models.UserStory.ref.ilike(term),
                models.UserStory.description.ilike(term)
            )
        )
    s_query = s_query.limit(8 if term else 3)
    stories_result = await db.execute(s_query)
    stories = stories_result.scalars().all()
    
    # Tasks
    t_query = select(models.Task).where(models.Task.project_id.in_(user_project_ids))
    if term:
        t_query = t_query.where(
            or_(
                models.Task.title.ilike(term),
                models.Task.ref.ilike(term),
                models.Task.description.ilike(term)
            )
        )
    t_query = t_query.limit(10 if term else 4)
    tasks_result = await db.execute(t_query)
    tasks = tasks_result.scalars().all()
    
    return schemas.SearchResults(
        projects=[schemas.ProjectRead.model_validate(p) for p in projects],
        stories=[schemas.UserStoryRead.model_validate(s) for s in stories],
        tasks=[schemas.TaskRead.model_validate(t) for t in tasks]
    )
