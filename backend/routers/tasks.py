import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.utils import get_utc_now, generate_id, log_activity

router = APIRouter(tags=["tasks"])

async def get_authorized_story(story_id: str, current_user_id: str, db: AsyncSession) -> models.UserStory:
    stmt = (
        select(models.UserStory)
        .join(models.Project, models.Project.id == models.UserStory.project_id)
        .join(models.ProjectMember, models.Project.id == models.ProjectMember.project_id)
        .where(and_(
            models.UserStory.id == story_id,
            models.ProjectMember.user_id == current_user_id
        ))
    )
    result = await db.execute(stmt)
    story = result.scalars().first()
    if not story:
        raise HTTPException(status_code=404, detail="Story not found or not accessible")
    return story

async def get_authorized_task(task_id: str, current_user_id: str, db: AsyncSession) -> models.Task:
    stmt = (
        select(models.Task)
        .join(models.Project, models.Project.id == models.Task.project_id)
        .join(models.ProjectMember, models.Project.id == models.ProjectMember.project_id)
        .where(and_(
            models.Task.id == task_id,
            models.ProjectMember.user_id == current_user_id
        ))
    )
    result = await db.execute(stmt)
    task = result.scalars().first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found or not accessible")
    return task


async def get_next_task_ref(db: AsyncSession, project_id: str, project_key: str) -> str:
    stmt = select(func.count(models.UserStory.id)).where(models.UserStory.project_id == project_id)
    story_count = (await db.execute(stmt)).scalar() or 0
    
    stmt2 = select(func.count(models.Task.id)).where(models.Task.project_id == project_id)
    task_count = (await db.execute(stmt2)).scalar() or 0
    
    next_num = story_count + task_count + 1
    return f"{project_key}-{next_num}"


@router.get("/api/stories/{story_id}/tasks", response_model=List[schemas.TaskRead])
async def list_tasks_for_story(
    story_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    story = await get_authorized_story(story_id, current_user.id, db)
    
    stmt = select(models.Task).where(models.Task.story_id == story_id)
    result = await db.execute(stmt)
    tasks = result.scalars().all()
    return [schemas.TaskRead.model_validate(t) for t in tasks]

@router.get("/api/tasks/{task_id}", response_model=schemas.TaskRead)
async def get_task(
    task_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = await get_authorized_task(task_id, current_user.id, db)
    return schemas.TaskRead.model_validate(task)

@router.post("/api/stories/{story_id}/tasks", response_model=schemas.TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    story_id: str,
    body: schemas.TaskCreate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    story = await get_authorized_story(story_id, current_user.id, db)
    
    # We need the project key
    stmt_p = select(models.Project.key).where(models.Project.id == story.project_id)
    project_key = (await db.execute(stmt_p)).scalar()
    
    ref = await get_next_task_ref(db, story.project_id, project_key)
    
    task = models.Task(
        id=generate_id("t_"),
        ref=ref,
        project_id=story.project_id,
        story_id=story.id,
        title=body.title,
        description=body.description,
        status=body.status,
        priority=body.priority,
        assignee_id=body.assignee_id,
        due_date=body.due_date,
        estimated_hours=body.estimated_hours,
        labels=json.dumps(body.labels),
        created_at=get_utc_now(),
        updated_at=get_utc_now()
    )
    
    db.add(task)
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="created",
        entity_type="task",
        entity_id=task.id,
        entity_ref=task.ref,
        entity_title=task.title,
        project_id=task.project_id,
        story_id=task.story_id,
        task_id=task.id
    )
    
    await db.commit()
    await db.refresh(task)
    return schemas.TaskRead.model_validate(task)

@router.patch("/api/tasks/{task_id}", response_model=schemas.TaskRead)
async def update_task(
    task_id: str,
    body: schemas.TaskUpdate,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = await get_authorized_task(task_id, current_user.id, db)
    
    update_data = body.model_dump(exclude_unset=True)
    if not update_data:
        return schemas.TaskRead.model_validate(task)
        
    for key, value in update_data.items():
        if key == "labels":
            setattr(task, key, json.dumps(value))
        elif key == "status" and value == "done" and task.status != "done":
            task.completed_at = get_utc_now()
            setattr(task, key, value)
        elif key == "status" and value != "done" and task.status == "done":
            task.completed_at = None
            setattr(task, key, value)
        else:
            setattr(task, key, value)
            
    task.updated_at = get_utc_now()
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="updated",
        entity_type="task",
        entity_id=task.id,
        entity_ref=task.ref,
        entity_title=task.title,
        project_id=task.project_id,
        story_id=task.story_id,
        task_id=task.id
    )
    
    await db.commit()
    await db.refresh(task)
    return schemas.TaskRead.model_validate(task)

@router.delete("/api/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = await get_authorized_task(task_id, current_user.id, db)
    
    await log_activity(
        db,
        actor_id=current_user.id,
        action="deleted",
        entity_type="task",
        entity_id=task.id,
        entity_ref=task.ref,
        entity_title=task.title,
        project_id=task.project_id,
        story_id=task.story_id,
        task_id=task.id
    )
    
    await db.delete(task)
    await db.commit()
    return None
