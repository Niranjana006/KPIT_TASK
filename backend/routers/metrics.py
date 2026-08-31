from datetime import datetime
from typing import List, Dict
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from backend.database import get_db
from backend import models, schemas
from backend.auth import get_current_user
from backend.utils import get_utc_now

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/dashboard", response_model=schemas.DashboardMetrics)
async def get_dashboard_metrics(
    current_user: models.User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get dashboard metrics for the authenticated user, calculated from the database.
    Only includes data from projects the user is a member of.
    """
    # 1. Get user's project IDs
    proj_result = await db.execute(
        select(models.ProjectMember.project_id)
        .where(models.ProjectMember.user_id == current_user.id)
    )
    user_project_ids = proj_result.scalars().all()

    if not user_project_ids:
        return schemas.DashboardMetrics(
            total_projects=0,
            active_projects=0,
            open_stories=0,
            open_tasks=0,
            completed_tasks=0,
            overdue_tasks=0,
            status_distribution=[],
            project_progress=[],
            upcoming_deadlines=[],
            my_tasks=[],
            open_stories_list=[]
        )

    from sqlalchemy.orm import selectinload

    # 2. Project counts
    projects_result = await db.execute(
        select(models.Project)
        .where(models.Project.id.in_(user_project_ids))
        .options(selectinload(models.Project.members))
    )
    projects = projects_result.scalars().all()
    total_projects = len(projects)
    active_projects = sum(1 for p in projects if p.status == "active")

    # 3. Story metrics
    stories_result = await db.execute(
        select(models.UserStory)
        .where(models.UserStory.project_id.in_(user_project_ids))
        .order_by(models.UserStory.updated_at.desc())
    )
    stories = stories_result.scalars().all()
    open_stories = sum(1 for s in stories if s.status != "done")
    
    # 4. Task metrics
    tasks_result = await db.execute(
        select(models.Task)
        .where(models.Task.project_id.in_(user_project_ids))
        .order_by(models.Task.due_date.asc().nulls_last())
    )
    tasks = tasks_result.scalars().all()
    
    open_tasks = 0
    completed_tasks = 0
    overdue_tasks = 0
    status_counts: Dict[str, int] = {}
    my_tasks = []
    upcoming_deadlines = []
    
    now_str = get_utc_now()
    
    for t in tasks:
        # Status distribution
        status_counts[t.status] = status_counts.get(t.status, 0) + 1
        
        if t.status == "done":
            completed_tasks += 1
        else:
            open_tasks += 1
            if t.due_date and t.due_date < now_str:
                overdue_tasks += 1
            
            # Upcoming deadlines (next 7 days approx, or just 5 soonest)
            if t.due_date and t.due_date >= now_str:
                if len(upcoming_deadlines) < 5:
                    upcoming_deadlines.append(t)
            
        # My tasks
        if t.assignee_id == current_user.id and t.status != "done":
            my_tasks.append(t)

    status_distribution = [
        schemas.StatusCount(status=k, count=v) 
        for k, v in status_counts.items()
    ]
    
    # 5. Project Progress
    project_progress_list = []
    for p in projects:
        p_stories = [s for s in stories if s.project_id == p.id]
        p_tasks = [t for t in tasks if t.project_id == p.id]
        p_done_tasks = [t for t in p_tasks if t.status == "done"]
        
        prog = 0
        if len(p_tasks) > 0:
            prog = int((len(p_done_tasks) / len(p_tasks)) * 100)
            
        project_progress_list.append(schemas.ProjectProgress(
            project=schemas.ProjectRead.model_validate(p),
            story_count=len(p_stories),
            task_count=len(p_tasks),
            done_tasks=len(p_done_tasks),
            progress=prog
        ))

    return schemas.DashboardMetrics(
        total_projects=total_projects,
        active_projects=active_projects,
        open_stories=open_stories,
        open_tasks=open_tasks,
        completed_tasks=completed_tasks,
        overdue_tasks=overdue_tasks,
        status_distribution=status_distribution,
        project_progress=project_progress_list,
        upcoming_deadlines=[schemas.TaskRead.model_validate(t) for t in upcoming_deadlines[:5]],
        my_tasks=[schemas.TaskRead.model_validate(t) for t in my_tasks],
        open_stories_list=[schemas.UserStoryRead.model_validate(s) for s in stories if s.status != "done"][:5]
    )
