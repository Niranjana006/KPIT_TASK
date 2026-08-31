import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from backend import models
from backend.tests.conftest import TestingSessionLocal, db_setup
from backend.workers.job_runner import scan_overdue_tasks, process_jobs, start_scheduler, stop_scheduler

# Use asyncio loop scope
pytestmark = pytest.mark.asyncio

@pytest.fixture(autouse=True)
def patch_db_session(monkeypatch):
    """Ensure the worker functions use the in-memory test database."""
    monkeypatch.setattr("backend.workers.job_runner.AsyncSessionLocal", TestingSessionLocal)

async def test_scheduler_lifecycle():
    # just ensure it doesn't crash
    start_scheduler()
    stop_scheduler()

async def test_overdue_scan_and_process():
    async with TestingSessionLocal() as db:
        now_dt = datetime.now(timezone.utc)
        now_iso = now_dt.isoformat()
        
        # We need a user to assign tasks to
        user = models.User(name="Worker User", email="worker@test.com", role="member", initials="WU", password_hash="hash")
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        project = models.Project(key="WRK", name="Worker Project", owner_id=user.id)
        db.add(project)
        await db.commit()
        await db.refresh(project)
        
        story = models.UserStory(ref="WRK-1", project_id=project.id, title="Story 1", status="backlog")
        db.add(story)
        await db.commit()
        await db.refresh(story)
        
        # 1. Overdue task
        overdue_task = models.Task(
            ref="WRK-T1", project_id=project.id, story_id=story.id,
            title="Overdue Task", status="in-progress", assignee_id=user.id,
            due_date=(now_dt - timedelta(days=1)).isoformat()
        )
        # 2. Non-overdue task
        future_task = models.Task(
            ref="WRK-T2", project_id=project.id, story_id=story.id,
            title="Future Task", status="todo", assignee_id=user.id,
            due_date=(now_dt + timedelta(days=1)).isoformat()
        )
        # 3. Completed task (overdue but done)
        done_task = models.Task(
            ref="WRK-T3", project_id=project.id, story_id=story.id,
            title="Done Task", status="done", assignee_id=user.id,
            due_date=(now_dt - timedelta(days=1)).isoformat()
        )
        
        db.add_all([overdue_task, future_task, done_task])
        await db.commit()
        
    # RUN SCAN
    await scan_overdue_tasks()
    
    async with TestingSessionLocal() as db:
        jobs = (await db.execute(select(models.BackgroundJob).where(models.BackgroundJob.status == "pending"))).scalars().all()
        job_payloads = [j.payload for j in jobs]
        
        # Ensure our specific tasks are handled correctly
        assert any(f'"task_id": "{overdue_task.id}"' in p for p in job_payloads), "Overdue task should be picked up"
        assert not any(f'"task_id": "{future_task.id}"' in p for p in job_payloads), "Future task should NOT be picked up"
        assert not any(f'"task_id": "{done_task.id}"' in p for p in job_payloads), "Done task should NOT be picked up"
        
        # Grab our specific job for the rest of the test
        my_job = next(j for j in jobs if f'"task_id": "{overdue_task.id}"' in j.payload)
        
    # RUN SCAN AGAIN (Duplicate scan does not create duplicate jobs)
    await scan_overdue_tasks()
    async with TestingSessionLocal() as db:
        jobs_again = (await db.execute(select(models.BackgroundJob).where(models.BackgroundJob.status == "pending"))).scalars().all()
        assert len(jobs_again) == len(jobs), "Duplicate jobs should not be created"
        
    # RUN PROCESS
    await process_jobs()
    
    async with TestingSessionLocal() as db:
        # Job should be succeeded
        job = (await db.execute(select(models.BackgroundJob).where(models.BackgroundJob.id == my_job.id))).scalars().first()
        assert job.status == "succeeded"
        
        # One notification created
        notifs = (await db.execute(select(models.Notification).where(models.Notification.user_id == user.id))).scalars().all()
        assert len(notifs) == 1
        assert "Overdue" in notifs[0].title
        
    # PROCESS AGAIN (Repeated processing remains idempotent)
    # If a job was manually set to pending again:
    async with TestingSessionLocal() as db:
        job = (await db.execute(select(models.BackgroundJob).where(models.BackgroundJob.id == my_job.id))).scalars().first()
        job.status = "pending"
        await db.commit()
        
    await process_jobs()
    
    async with TestingSessionLocal() as db:
        notifs = (await db.execute(select(models.Notification).where(models.Notification.user_id == user.id))).scalars().all()
        assert len(notifs) == 1, "Idempotency key prevents duplicate notifications"
        job = (await db.execute(select(models.BackgroundJob).where(models.BackgroundJob.id == my_job.id))).scalars().first()
        assert job.status == "succeeded"


async def test_worker_failure_and_backoff(monkeypatch):
    """Test job failure, attempts increment, exponential backoff, and dead status."""
    
    async with TestingSessionLocal() as db:
        # Create a job that will fail
        # We can simulate failure by pointing to a valid task but monkeypatching create_notification to raise exception
        job = models.BackgroundJob(
            job_type="overdue_notification",
            status="pending",
            payload='{"task_id": "dummy_task_123"}',
            max_attempts=3
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        job_id = job.id
        
        # We also need a dummy task to exist, otherwise it resolves gracefully as "stale"
        task = models.Task(
            id="dummy_task_123", ref="DUM-1", project_id="p1", story_id="s1",
            title="Dummy", status="todo", due_date="2020-01-01T00:00:00Z", assignee_id="u1"
        )
        db.add(task)
        await db.commit()
        
    # Monkeypatch the notification function to raise an error
    import backend.workers.job_runner as runner_module
    
    async def mock_create_notif(*args, **kwargs):
        raise ValueError("Simulated failure")
        
    monkeypatch.setattr(runner_module, "create_notification", mock_create_notif)
    
    # ATTEMPT 1
    await runner_module.process_jobs()
    
    async with TestingSessionLocal() as db:
        job = await db.get(models.BackgroundJob, job_id)
        assert job.status == "failed"
        assert job.attempts == 1
        assert "Simulated failure" in job.last_error
        # check backoff: 2 ** 1 = 2 minutes
        scheduled_dt = datetime.fromisoformat(job.scheduled_at)
        now_dt = datetime.now(timezone.utc)
        diff = (scheduled_dt - now_dt).total_seconds()
        assert 110 < diff < 130  # ~120 seconds
        
        # ATTEMPT 2 (should not run yet because scheduled_at is in future)
        # It's failed and scheduled_at > now
        await db.commit()
        
    await runner_module.process_jobs()
    async with TestingSessionLocal() as db:
        job = await db.get(models.BackgroundJob, job_id)
        assert job.attempts == 1, "Should not retry before scheduled time"
        
        # Fast forward time
        job.scheduled_at = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
        await db.commit()
        
    # ATTEMPT 2 (now runs)
    await runner_module.process_jobs()
    async with TestingSessionLocal() as db:
        job = await db.get(models.BackgroundJob, job_id)
        assert job.status == "failed"
        assert job.attempts == 2
        
        scheduled_dt = datetime.fromisoformat(job.scheduled_at)
        diff = (scheduled_dt - datetime.now(timezone.utc)).total_seconds()
        assert 230 < diff < 250  # ~240 seconds (4 minutes)
        
        # Fast forward time
        job.scheduled_at = (datetime.now(timezone.utc) - timedelta(minutes=1)).isoformat()
        await db.commit()
        
    # ATTEMPT 3 (now runs)
    await runner_module.process_jobs()
    async with TestingSessionLocal() as db:
        job = await db.get(models.BackgroundJob, job_id)
        assert job.status == "dead"
        assert job.attempts == 3
