"""
job_runner.py — APScheduler-based asynchronous workflow worker.

Tradeoffs and Architecture:
- Uses `APScheduler` + `AsyncIOScheduler` running inside the FastAPI event loop.
- Uses the `background_jobs` SQLite table as the job queue.
- Why no Redis/Celery? The KPIT assignment targets a 3-10 user system running locally.
  A local SQLite polling mechanism (1 minute interval) is extremely robust, has zero external dependencies,
  and offers excellent ACID consistency since jobs and app data share the same database.

Job Lifecycle:
1. `scan_overdue_tasks` (every 15m) identifies overdue, open tasks.
2. If no job exists for a task, it queues a `BackgroundJob` in `pending` status.
3. `process_jobs` (every 1m) locks pending/failed jobs and executes them.
4. On success: job -> 'succeeded'.
5. On failure: job -> 'failed' and applies exponential backoff (2 ** attempts minutes).
6. Dead-letter: After max attempts, job -> 'dead'.

Idempotency:
Notifications are deduplicated via an idempotency_key in `create_notification`.
Even if a job runs twice, the notification won't duplicate.

Stale-job safety:
Tasks are re-checked at runtime to ensure they haven't been completed or due dates changed.
"""
from datetime import datetime, timezone, timedelta
import logging
import json
from sqlalchemy import select, and_, or_
from backend.database import AsyncSessionLocal
from backend import models
from backend.utils import create_notification
from apscheduler.schedulers.asyncio import AsyncIOScheduler

logger = logging.getLogger(__name__)
scheduler = AsyncIOScheduler()

async def scan_overdue_tasks():
    """Scans for overdue tasks and creates background jobs for them."""
    async with AsyncSessionLocal() as db:
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()
        
        # 1. Find overdue tasks not done
        stmt = select(models.Task).where(
            and_(
                models.Task.due_date < now_iso,
                models.Task.status != "done"
            )
        )
        tasks = (await db.execute(stmt)).scalars().all()
        
        for task in tasks:
            # 2. Prevent duplicate jobs: check if there's already an active job for this task
            payload_str = json.dumps({"task_id": task.id})
            
            existing = await db.execute(
                select(models.BackgroundJob).where(
                    and_(
                        models.BackgroundJob.job_type == "overdue_notification",
                        models.BackgroundJob.payload == payload_str,
                        models.BackgroundJob.status.in_(["pending", "running", "failed"])
                    )
                )
            )
            
            # If there's no active job, queue one.
            if not existing.scalars().first():
                new_job = models.BackgroundJob(
                    job_type="overdue_notification",
                    status="pending",
                    payload=payload_str,
                    max_attempts=3
                )
                db.add(new_job)
        
        await db.commit()

async def process_jobs():
    """Processes pending background jobs."""
    async with AsyncSessionLocal() as db:
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()
        
        # 1. Find eligible jobs
        stmt = select(models.BackgroundJob).where(
            and_(
                models.BackgroundJob.job_type == "overdue_notification",
                or_(
                    models.BackgroundJob.status == "pending",
                    and_(
                        models.BackgroundJob.status == "failed",
                        models.BackgroundJob.attempts < models.BackgroundJob.max_attempts,
                        models.BackgroundJob.scheduled_at <= now_iso
                    )
                )
            )
        )
        jobs = (await db.execute(stmt)).scalars().all()
        
        for job in jobs:
            # Mark as running
            job.status = "running"
            job.started_at = now_iso
            await db.commit()
            
            try:
                # Process the job
                payload = json.loads(job.payload)
                task_id = payload.get("task_id")
                
                # STALE JOB SAFETY
                task = await db.get(models.Task, task_id)
                
                if not task:
                    job.status = "succeeded" # Resolving safely
                    job.completed_at = datetime.now(timezone.utc).isoformat()
                    await db.commit()
                    continue
                
                if task.status == "done" or not task.due_date or task.due_date >= now_iso:
                    job.status = "succeeded" # Resolving safely
                    job.completed_at = datetime.now(timezone.utc).isoformat()
                    await db.commit()
                    continue
                
                if not task.assignee_id:
                    # No one to notify
                    job.status = "succeeded"
                    job.completed_at = datetime.now(timezone.utc).isoformat()
                    await db.commit()
                    continue
                
                # 2. Create notification safely and idempotently
                today = now_dt.strftime("%Y-%m-%d")
                idemp_key = f"overdue:{task.id}:{today}"
                
                # Ensure idempotency natively before inserting
                existing_notif = await db.execute(
                    select(models.Notification).where(
                        models.Notification.idempotency_key == idemp_key
                    )
                )
                if not existing_notif.scalars().first():
                    await create_notification(
                        db=db,
                        user_id=task.assignee_id,
                        kind="due_soon",
                        title=f"Task Overdue: {task.ref}",
                        body=f"The task '{task.title}' was due on {task.due_date}.",
                        link=f"/projects/{task.project_id}/tasks",
                        idempotency_key=idemp_key
                    )
                
                # Update job status
                job.status = "succeeded"
                job.completed_at = datetime.now(timezone.utc).isoformat()
                await db.commit()
                
            except Exception as e:
                # FAILURE HANDLING
                logger.error(f"Job {job.id} failed: {str(e)}")
                job.attempts += 1
                job.last_error = str(e)
                
                if job.attempts >= job.max_attempts:
                    job.status = "dead"
                else:
                    job.status = "failed"
                    # EXPONENTIAL BACKOFF: 2 ** attempts minutes
                    backoff_minutes = 2 ** job.attempts
                    next_run = datetime.now(timezone.utc) + timedelta(minutes=backoff_minutes)
                    job.scheduled_at = next_run.isoformat()
                
                await db.commit()

def start_scheduler():
    """Starts the background scheduler."""
    if not scheduler.running:
        # scan every 15 minutes
        scheduler.add_job(scan_overdue_tasks, "interval", minutes=15, id="scan_overdue")
        # process jobs every 1 minute
        scheduler.add_job(process_jobs, "interval", minutes=1, id="process_jobs")
        scheduler.start()

def stop_scheduler():
    """Stops the background scheduler."""
    if scheduler.running:
        scheduler.shutdown()
