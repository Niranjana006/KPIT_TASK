from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend import models, schemas
from backend.database import get_db
from backend.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])

@router.get("", response_model=List[schemas.BackgroundJobRead])
async def list_jobs(
    status: str | None = None,
    job_type: str | None = None,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """
    List background jobs.
    Only allows access to users (in a real app, this should probably be restricted to admins).
    Can be filtered by status and job_type.
    """
    query = select(models.BackgroundJob).order_by(models.BackgroundJob.scheduled_at.desc())
    
    if status:
        query = query.filter(models.BackgroundJob.status == status)
    if job_type:
        query = query.filter(models.BackgroundJob.job_type == job_type)
        
    result = await db.execute(query)
    jobs = result.scalars().all()
    return jobs

@router.get("/{job_id}", response_model=schemas.BackgroundJobRead)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    """Get a specific background job by ID."""
    job = await db.get(models.BackgroundJob, job_id)
    if not job:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Job not found")
    return job
