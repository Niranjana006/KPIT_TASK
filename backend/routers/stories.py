import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.dependencies import get_project_if_member
from backend.utils import get_utc_now, generate_id, log_activity

router = APIRouter(prefix="/projects/{project_id}/stories", tags=["stories"])

async def get_next_ref(db: AsyncSession, project_id: str, project_key: str) -> str:
    # Example logic: count stories and tasks in project and add 1
    stmt = select(func.count(models.UserStory.id)).where(models.UserStory.project_id == project_id)
    result = await db.execute(stmt)
    story_count = result.scalar() or 0
    
    stmt2 = select(func.count(models.Task.id)).where(models.Task.project_id == project_id)
    result2 = await db.execute(stmt2)
    task_count = result2.scalar() or 0
    
    next_num = story_count + task_count + 1
    return f"{project_key}-{next_num}"

@router.get("", response_model=List[schemas.UserStoryRead])
async def list_stories(
    project_id: str,
    project: models.Project = Depends(get_project_if_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(models.UserStory).where(models.UserStory.project_id == project_id)
    result = await db.execute(stmt)
    stories = result.scalars().all()
    return [schemas.UserStoryRead.model_validate(s) for s in stories]

@router.post("", response_model=schemas.UserStoryRead, status_code=status.HTTP_201_CREATED)
async def create_story(
    project_id: str,
    body: schemas.UserStoryCreate,
    project: models.Project = Depends(get_project_if_member),
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    ref = await get_next_ref(db, project_id, project.key)
    
    story = models.UserStory(
        id=generate_id("us_"),
        ref=ref,
        project_id=project_id,
        title=body.title,
        description=body.description,
        acceptance_criteria=json.dumps(body.acceptance_criteria),
        status=body.status,
        priority=body.priority,
        assignee_id=body.assignee_id,
        story_points=body.story_points,
        sprint=body.sprint,
        labels=json.dumps(body.labels),
        created_at=get_utc_now(),
        updated_at=get_utc_now()
    )
    
    db.add(story)
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="created",
        entity_type="story",
        entity_id=story.id,
        entity_ref=story.ref,
        entity_title=story.title,
        project_id=project_id,
        story_id=story.id
    )
    
    await db.commit()
    await db.refresh(story)
    return schemas.UserStoryRead.model_validate(story)

@router.get("/{story_id}", response_model=schemas.UserStoryRead)
async def get_story(
    project_id: str,
    story_id: str,
    project: models.Project = Depends(get_project_if_member),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(models.UserStory).where(and_(
        models.UserStory.id == story_id,
        models.UserStory.project_id == project_id
    ))
    result = await db.execute(stmt)
    story = result.scalars().first()
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    return schemas.UserStoryRead.model_validate(story)

@router.patch("/{story_id}", response_model=schemas.UserStoryRead)
async def update_story(
    project_id: str,
    story_id: str,
    body: schemas.UserStoryUpdate,
    project: models.Project = Depends(get_project_if_member),
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(models.UserStory).where(and_(
        models.UserStory.id == story_id,
        models.UserStory.project_id == project_id
    ))
    result = await db.execute(stmt)
    story = result.scalars().first()
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return schemas.UserStoryRead.model_validate(story)
        
    for key, value in update_data.items():
        if key in ("acceptance_criteria", "labels"):
            setattr(story, key, json.dumps(value))
        else:
            setattr(story, key, value)
            
    story.updated_at = get_utc_now()
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="updated",
        entity_type="story",
        entity_id=story.id,
        entity_ref=story.ref,
        entity_title=story.title,
        project_id=project_id,
        story_id=story.id
    )
    
    await db.commit()
    await db.refresh(story)
    return schemas.UserStoryRead.model_validate(story)

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(
    project_id: str,
    story_id: str,
    project: models.Project = Depends(get_project_if_member),
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(models.UserStory).where(and_(
        models.UserStory.id == story_id,
        models.UserStory.project_id == project_id
    ))
    result = await db.execute(stmt)
    story = result.scalars().first()
    
    if not story:
        raise HTTPException(status_code=404, detail="Story not found")
        
    await log_activity(
        db,
        actor_id=current_user.id,
        action="deleted",
        entity_type="story",
        entity_id=story.id,
        entity_ref=story.ref,
        entity_title=story.title,
        project_id=project_id
    )
    
    await db.delete(story)
    await db.commit()
    return None
