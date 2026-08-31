"""
models.py — SQLAlchemy ORM models.

Mirrors the TypeScript type definitions in src/types/index.ts and the
database schema proposed in the implementation plan.

Cascade behaviour:
  - Deleting a Project cascades to its UserStories, Tasks, Notifications,
    ActivityEvents, and ProjectMember join rows.
  - Deleting a UserStory cascades to its Tasks.
  - Deleting a User sets assignee_id to NULL on Stories and Tasks (SET NULL).
    Owner FK on Project is RESTRICT (must reassign first).
"""

import uuid
from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    Column,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _uuid() -> str:
    return str(uuid.uuid4())


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    role: Mapped[str] = mapped_column(String, nullable=False)  # see Role type
    initials: Mapped[str] = mapped_column(String, nullable=False)
    color: Mapped[str] = mapped_column(String, nullable=False, default="accent-1")
    password_hash: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)
    updated_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)

    # Relationships
    owned_projects: Mapped[List["Project"]] = relationship(
        back_populates="owner", foreign_keys="Project.owner_id"
    )
    member_of: Mapped[List["ProjectMember"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    assigned_stories: Mapped[List["UserStory"]] = relationship(back_populates="assignee", foreign_keys="UserStory.assignee_id")
    assigned_tasks: Mapped[List["Task"]] = relationship(back_populates="assignee", foreign_keys="Task.assignee_id")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user", cascade="all, delete-orphan")
    activity_events: Mapped[List["ActivityEvent"]] = relationship(back_populates="actor", foreign_keys="ActivityEvent.actor_id")


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    key: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="planning")
    owner_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False
    )
    start_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    due_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)
    updated_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)

    # Relationships
    owner: Mapped["User"] = relationship(back_populates="owned_projects", foreign_keys=[owner_id])
    members: Mapped[List["ProjectMember"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    stories: Mapped[List["UserStory"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    activity_events: Mapped[List["ActivityEvent"]] = relationship(
        back_populates="project",
        foreign_keys="ActivityEvent.project_id",
        cascade="all, delete-orphan",
    )


class ProjectMember(Base):
    """M:N join table between projects and users."""
    __tablename__ = "project_members"

    project_id: Mapped[str] = mapped_column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    project: Mapped["Project"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship(back_populates="member_of")


# ---------------------------------------------------------------------------
# User Stories
# ---------------------------------------------------------------------------

class UserStory(Base):
    __tablename__ = "user_stories"
    __table_args__ = (UniqueConstraint("project_id", "ref", name="uq_story_ref_per_project"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    ref: Mapped[str] = mapped_column(String, nullable=False)           # e.g. "US-101"
    project_id: Mapped[str] = mapped_column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    acceptance_criteria: Mapped[str] = mapped_column(Text, nullable=False, default="[]")  # JSON
    status: Mapped[str] = mapped_column(String, nullable=False, default="backlog")
    priority: Mapped[str] = mapped_column(String, nullable=False, default="medium")
    assignee_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    story_points: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sprint: Mapped[str] = mapped_column(String, nullable=False, default="")
    labels: Mapped[str] = mapped_column(Text, nullable=False, default="[]")  # JSON
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)
    updated_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="stories")
    assignee: Mapped[Optional["User"]] = relationship(back_populates="assigned_stories", foreign_keys=[assignee_id])
    tasks: Mapped[List["Task"]] = relationship(back_populates="story", cascade="all, delete-orphan")
    activity_events: Mapped[List["ActivityEvent"]] = relationship(
        back_populates="story",
        foreign_keys="ActivityEvent.story_id",
        passive_deletes=True,
    )


Index("idx_stories_project", UserStory.project_id)


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (UniqueConstraint("project_id", "ref", name="uq_task_ref_per_project"),)

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    ref: Mapped[str] = mapped_column(String, nullable=False)          # e.g. "TASK-201"
    project_id: Mapped[str] = mapped_column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    story_id: Mapped[str] = mapped_column(
        String, ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    status: Mapped[str] = mapped_column(String, nullable=False, default="backlog")
    priority: Mapped[str] = mapped_column(String, nullable=False, default="medium")
    assignee_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    due_date: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    estimated_hours: Mapped[float] = mapped_column(Float, nullable=False, default=0)
    labels: Mapped[str] = mapped_column(Text, nullable=False, default="[]")  # JSON
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)
    updated_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)
    completed_at: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Relationships
    project: Mapped["Project"] = relationship()
    story: Mapped["UserStory"] = relationship(back_populates="tasks")
    assignee: Mapped[Optional["User"]] = relationship(back_populates="assigned_tasks", foreign_keys=[assignee_id])
    activity_events: Mapped[List["ActivityEvent"]] = relationship(
        back_populates="task",
        foreign_keys="ActivityEvent.task_id",
        passive_deletes=True,
    )


Index("idx_tasks_story", Task.story_id)
Index("idx_tasks_project", Task.project_id)
Index("idx_tasks_assignee", Task.assignee_id)
Index("idx_tasks_due_status", Task.due_date, Task.status)


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    kind: Mapped[str] = mapped_column(String, nullable=False)  # assignment|update|due_soon|milestone
    title: Mapped[str] = mapped_column(String, nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    read: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    link: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    # Idempotency key: prevents duplicate overdue notifications.
    # Format: "{kind}:{entity_id}:{YYYY-MM-DD}"  — nullable for manual notifications.
    idempotency_key: Mapped[Optional[str]] = mapped_column(String, nullable=True, unique=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)

    user: Mapped["User"] = relationship(back_populates="notifications")


Index("idx_notifications_user_read", Notification.user_id, Notification.read)


# ---------------------------------------------------------------------------
# Activity Events
# ---------------------------------------------------------------------------

class ActivityEvent(Base):
    __tablename__ = "activity_events"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    actor_id: Mapped[str] = mapped_column(
        String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    action: Mapped[str] = mapped_column(String, nullable=False)
    entity_type: Mapped[str] = mapped_column(String, nullable=False)  # project|story|task
    entity_id: Mapped[str] = mapped_column(String, nullable=False)
    entity_ref: Mapped[str] = mapped_column(String, nullable=False)
    entity_title: Mapped[str] = mapped_column(String, nullable=False)
    project_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("projects.id", ondelete="SET NULL"), nullable=True
    )
    story_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("user_stories.id", ondelete="SET NULL"), nullable=True
    )
    task_id: Mapped[Optional[str]] = mapped_column(
        String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True
    )
    from_value: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    to_value: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)

    actor: Mapped["User"] = relationship(back_populates="activity_events", foreign_keys=[actor_id])
    project: Mapped[Optional["Project"]] = relationship(back_populates="activity_events", foreign_keys=[project_id])
    story: Mapped[Optional["UserStory"]] = relationship(back_populates="activity_events", foreign_keys=[story_id])
    task: Mapped[Optional["Task"]] = relationship(back_populates="activity_events", foreign_keys=[task_id])


Index("idx_activity_project_time", ActivityEvent.project_id, ActivityEvent.created_at)
Index("idx_activity_entity", ActivityEvent.entity_id)


# ---------------------------------------------------------------------------
# Background Jobs
# ---------------------------------------------------------------------------

class BackgroundJob(Base):
    __tablename__ = "background_jobs"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=_uuid)
    job_type: Mapped[str] = mapped_column(String, nullable=False)  # overdue_check|etc
    status: Mapped[str] = mapped_column(String, nullable=False, default="pending")
    # pending | running | succeeded | failed | dead
    payload: Mapped[str] = mapped_column(Text, nullable=False, default="{}")  # JSON
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=3)
    last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    scheduled_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)
    started_at: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    completed_at: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_at: Mapped[str] = mapped_column(String, nullable=False, default=_now)


Index("idx_jobs_status_scheduled", BackgroundJob.status, BackgroundJob.scheduled_at)
