from datetime import datetime, timezone
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from backend import models

def get_utc_now() -> str:
    """Return the current UTC time in ISO format."""
    return datetime.now(timezone.utc).isoformat()

def generate_id(prefix: str) -> str:
    """Generate a short unique ID with a prefix, e.g. p_abcdef"""
    return f"{prefix}{uuid.uuid4().hex[:8]}"

async def log_activity(
    db: AsyncSession,
    actor_id: str,
    action: str,
    entity_type: str,
    entity_id: str,
    entity_ref: str,
    entity_title: str,
    project_id: str | None = None,
    story_id: str | None = None,
    task_id: str | None = None,
    from_value: str | None = None,
    to_value: str | None = None,
):
    """
    Record an activity event in the database.
    """
    event = models.ActivityEvent(
        id=generate_id("a_"),
        actor_id=actor_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        entity_ref=entity_ref,
        entity_title=entity_title,
        project_id=project_id,
        story_id=story_id,
        task_id=task_id,
        from_value=from_value,
        to_value=to_value,
        created_at=get_utc_now(),
    )
    db.add(event)
    # The caller is responsible for committing the session

async def create_notification(
    db: AsyncSession,
    user_id: str,
    kind: str,
    title: str,
    body: str,
    link: str | None = None,
    idempotency_key: str | None = None,
):
    """
    Create a notification for a user.
    """
    notification = models.Notification(
        id=generate_id("n_"),
        user_id=user_id,
        kind=kind,
        title=title,
        body=body,
        link=link,
        idempotency_key=idempotency_key,
        created_at=get_utc_now(),
    )
    db.add(notification)
    return notification
