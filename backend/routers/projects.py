from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timezone

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.utils import get_utc_now, generate_id, log_activity

router = APIRouter(prefix="/projects", tags=["projects"])

def get_current_time():
    return get_utc_now()

from sqlalchemy.orm import selectinload

@router.get("", response_model=List[schemas.ProjectRead])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """List projects accessible to the user."""
    stmt = (
        select(models.Project)
        .join(models.ProjectMember, models.Project.id == models.ProjectMember.project_id)
        .where(models.ProjectMember.user_id == current_user.id)
        .options(selectinload(models.Project.members))
    )
    result = await db.execute(stmt)
    projects = result.scalars().unique().all()
    
    # We also need to fetch members for each project to populate the list.
    # Let's ensure lazy loading or selectinload is configured in models, 
    # but await db.refresh might be needed if lazy="selectin" is not set.
    # Actually, SQLAlchemy 2.0 with async requires lazy="selectin" on relationships for this to work without greenlet errors.
    # Let's assume models.py has lazy="selectin" on Project.members.
    return [schemas.ProjectRead.model_validate(p) for p in projects]

@router.get("/{project_id}", response_model=schemas.ProjectRead)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get project details."""
    stmt = (
        select(models.Project)
        .join(models.ProjectMember, models.Project.id == models.ProjectMember.project_id)
        .where(and_(models.Project.id == project_id, models.ProjectMember.user_id == current_user.id))
        .options(selectinload(models.Project.members))
    )
    result = await db.execute(stmt)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or accessible")
        
    return schemas.ProjectRead.model_validate(project)

@router.post("", response_model=schemas.ProjectRead, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: schemas.ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new project."""
    now = get_current_time()
    project = models.Project(
        id=generate_id("p_"),
        key=body.key.upper(),
        name=body.name,
        description=body.description,
        status=body.status,
        owner_id=current_user.id, # Automatically assign creator as owner
        start_date=body.start_date,
        due_date=body.due_date,
        created_at=now,
        updated_at=now
    )
    
    db.add(project)
    
    # Add owner as a member
    member = models.ProjectMember(project_id=project.id, user_id=current_user.id)
    db.add(member)
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="created",
        entity_type="project",
        entity_id=project.id,
        entity_ref=project.key,
        entity_title=project.name,
        project_id=project.id
    )
    
    await db.commit()
    
    # Re-query to eagerly load members
    stmt = select(models.Project).where(models.Project.id == project.id).options(selectinload(models.Project.members))
    result = await db.execute(stmt)
    project_loaded = result.scalars().first()
    
    return schemas.ProjectRead.model_validate(project_loaded)

@router.patch("/{project_id}", response_model=schemas.ProjectRead)
async def update_project(
    project_id: str,
    body: schemas.ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a project."""
    stmt = (
        select(models.Project)
        .join(models.ProjectMember, models.Project.id == models.ProjectMember.project_id)
        .where(and_(models.Project.id == project_id, models.ProjectMember.user_id == current_user.id))
        .options(selectinload(models.Project.members))
    )
    result = await db.execute(stmt)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or accessible")
        
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return schemas.ProjectRead.model_validate(project)
        
    for key, value in update_data.items():
        setattr(project, key, value)
        
    project.updated_at = get_current_time()
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="updated",
        entity_type="project",
        entity_id=project.id,
        entity_ref=project.key,
        entity_title=project.name,
        project_id=project.id
    )
    
    await db.commit()
    
    # Re-query to eagerly load members
    stmt = select(models.Project).where(models.Project.id == project.id).options(selectinload(models.Project.members))
    result = await db.execute(stmt)
    project_loaded = result.scalars().first()
    
    return schemas.ProjectRead.model_validate(project_loaded)

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a project."""
    stmt = (
        select(models.Project)
        .where(and_(models.Project.id == project_id, models.Project.owner_id == current_user.id))
    )
    result = await db.execute(stmt)
    project = result.scalars().first()
    
    if not project:
        raise HTTPException(
            status_code=404, 
            detail="Project not found or you do not have permission to delete it"
        )
        
    # Log activity before deletion
    await log_activity(
        db,
        actor_id=current_user.id,
        action="deleted",
        entity_type="project",
        entity_id=project.id,
        entity_ref=project.key,
        entity_title=project.name,
        project_id=project.id
    )
    
    await db.delete(project)
    await db.commit()
    return None
