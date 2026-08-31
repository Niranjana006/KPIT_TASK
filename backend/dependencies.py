from fastapi import Depends, HTTPException, Path
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from backend.database import get_db
from backend.models import User, Project, ProjectMember
from backend.auth import get_current_user

async def get_project_if_member(
    project_id: str = Path(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Project:
    """Dependency that checks if the user is a member of the project."""
    stmt = (
        select(Project)
        .join(ProjectMember, Project.id == ProjectMember.project_id)
        .where(and_(Project.id == project_id, ProjectMember.user_id == current_user.id))
    )
    result = await db.execute(stmt)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or not accessible")
        
    return project
