"""
schemas.py — Pydantic v2 request and response models.

Each schema mirrors the TypeScript types in src/types/index.ts.
Separate Read (response) and Write (request body) models keep
the API surface explicit and prevent over-posting.
"""

import json
from datetime import datetime
from typing import List, Optional, Any

from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator


# ---------------------------------------------------------------------------
# Enums (plain strings — validated via Pydantic literals)
# ---------------------------------------------------------------------------

PROJECT_STATUSES = {"planning", "active", "on_hold", "completed", "archived"}
WORK_STATUSES = {"backlog", "todo", "in_progress", "in_review", "done"}
PRIORITIES = {"low", "medium", "high", "critical"}
ROLES = {"Product Owner", "Scrum Master", "Engineer", "Designer", "QA Engineer"}
NOTIFICATION_KINDS = {"assignment", "update", "due_soon", "milestone"}
ACTIVITY_ACTIONS = {
    "created", "assigned", "status_changed", "priority_changed",
    "due_date_changed", "updated", "deleted", "commented",
}
ENTITY_TYPES = {"project", "story", "task"}
JOB_TYPES = {"overdue_check", "notification_dispatch", "digest_send"}
JOB_STATUSES = {"pending", "running", "succeeded", "failed", "dead"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _parse_json_list(v: Any) -> List[str]:
    """Deserialize a JSON string into a list of strings if needed."""
    if isinstance(v, str):
        try:
            parsed = json.loads(v)
            if isinstance(parsed, list):
                return [str(i) for i in parsed]
        except json.JSONDecodeError:
            pass
        return []
    if isinstance(v, list):
        return [str(i) for i in v]
    return []


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserRead"


# ---------------------------------------------------------------------------
# Users
# ---------------------------------------------------------------------------

class UserRead(BaseModel):
    id: str
    name: str
    email: str
    role: str
    initials: str
    color: str
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    initials: Optional[str] = Field(None, max_length=4)
    color: Optional[str] = None

    @field_validator("role")
    @classmethod
    def validate_role(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ROLES:
            raise ValueError(f"role must be one of {sorted(ROLES)}")
        return v


# ---------------------------------------------------------------------------
# Projects
# ---------------------------------------------------------------------------

class ProjectRead(BaseModel):
    id: str
    key: str
    name: str
    description: str
    status: str
    owner_id: str
    member_ids: List[str] = Field(default_factory=list)
    start_date: Optional[str]
    due_date: Optional[str]
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def extract_member_ids(cls, data: Any) -> Any:
        """Convert ProjectMember ORM rows to a list of user_id strings."""
        if hasattr(data, "members"):
            data.__dict__["member_ids"] = [m.user_id for m in data.members]
        return data


class ProjectCreate(BaseModel):
    key: str = Field(min_length=2, max_length=6)
    name: str = Field(min_length=1, max_length=200)
    description: str = Field(default="", max_length=2000)
    status: str = "planning"
    owner_id: str
    start_date: Optional[str] = None
    due_date: Optional[str] = None

    @field_validator("key")
    @classmethod
    def validate_key(cls, v: str) -> str:
        import re
        if not re.match(r"^[A-Z][A-Z0-9]{1,5}$", v):
            raise ValueError("Key must be 2–6 uppercase letters or digits starting with a letter.")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in PROJECT_STATUSES:
            raise ValueError(f"status must be one of {sorted(PROJECT_STATUSES)}")
        return v

    @model_validator(mode="after")
    def validate_dates(self) -> "ProjectCreate":
        if self.start_date and self.due_date and self.due_date < self.start_date:
            raise ValueError("due_date must be after start_date.")
        return self


class ProjectUpdate(BaseModel):
    key: Optional[str] = None
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = None
    status: Optional[str] = None
    owner_id: Optional[str] = None
    start_date: Optional[str] = None
    due_date: Optional[str] = None

    @field_validator("key")
    @classmethod
    def validate_key(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            import re
            if not re.match(r"^[A-Z][A-Z0-9]{1,5}$", v):
                raise ValueError("Key must be 2–6 uppercase letters or digits.")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PROJECT_STATUSES:
            raise ValueError(f"status must be one of {sorted(PROJECT_STATUSES)}")
        return v


# ---------------------------------------------------------------------------
# User Stories
# ---------------------------------------------------------------------------

class UserStoryRead(BaseModel):
    id: str
    ref: str
    project_id: str
    title: str
    description: str
    acceptance_criteria: List[str]
    status: str
    priority: str
    assignee_id: Optional[str]
    story_points: int
    sprint: str
    labels: List[str]
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def parse_json_fields(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            d = data.__dict__
            if "acceptance_criteria" in d and isinstance(d["acceptance_criteria"], str):
                data.__dict__["acceptance_criteria"] = _parse_json_list(d["acceptance_criteria"])
            if "labels" in d and isinstance(d["labels"], str):
                data.__dict__["labels"] = _parse_json_list(d["labels"])
        return data


class UserStoryCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=5000)
    acceptance_criteria: List[str] = Field(default_factory=list)
    status: str = "backlog"
    priority: str = "medium"
    assignee_id: Optional[str] = None
    story_points: int = Field(default=0, ge=0, le=100)
    sprint: str = Field(default="", max_length=100)
    labels: List[str] = Field(default_factory=list)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in WORK_STATUSES:
            raise ValueError(f"status must be one of {sorted(WORK_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in PRIORITIES:
            raise ValueError(f"priority must be one of {sorted(PRIORITIES)}")
        return v


class UserStoryUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    acceptance_criteria: Optional[List[str]] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    story_points: Optional[int] = Field(None, ge=0, le=100)
    sprint: Optional[str] = None
    labels: Optional[List[str]] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in WORK_STATUSES:
            raise ValueError(f"status must be one of {sorted(WORK_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PRIORITIES:
            raise ValueError(f"priority must be one of {sorted(PRIORITIES)}")
        return v


# ---------------------------------------------------------------------------
# Tasks
# ---------------------------------------------------------------------------

class TaskRead(BaseModel):
    id: str
    ref: str
    project_id: str
    story_id: str
    title: str
    description: str
    status: str
    priority: str
    assignee_id: Optional[str]
    due_date: Optional[str]
    estimated_hours: float
    labels: List[str]
    created_at: str
    updated_at: str
    completed_at: Optional[str]

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def parse_json_fields(cls, data: Any) -> Any:
        if hasattr(data, "__dict__"):
            d = data.__dict__
            if "labels" in d and isinstance(d["labels"], str):
                data.__dict__["labels"] = _parse_json_list(d["labels"])
        return data


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str = Field(default="", max_length=5000)
    status: str = "backlog"
    priority: str = "medium"
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: float = Field(default=0, ge=0, le=200)
    labels: List[str] = Field(default_factory=list)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        if v not in WORK_STATUSES:
            raise ValueError(f"status must be one of {sorted(WORK_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: str) -> str:
        if v not in PRIORITIES:
            raise ValueError(f"priority must be one of {sorted(PRIORITIES)}")
        return v


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[str] = None
    estimated_hours: Optional[float] = Field(None, ge=0, le=200)
    labels: Optional[List[str]] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in WORK_STATUSES:
            raise ValueError(f"status must be one of {sorted(WORK_STATUSES)}")
        return v

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in PRIORITIES:
            raise ValueError(f"priority must be one of {sorted(PRIORITIES)}")
        return v


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------

class NotificationRead(BaseModel):
    id: str
    user_id: str
    kind: str
    title: str
    body: str
    read: bool
    link: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Activity Events
# ---------------------------------------------------------------------------

class ActivityEventRead(BaseModel):
    id: str
    actor_id: str
    action: str
    entity_type: str
    entity_id: str
    entity_ref: str
    entity_title: str
    project_id: Optional[str]
    story_id: Optional[str]
    task_id: Optional[str]
    from_value: Optional[str]
    to_value: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Background Jobs
# ---------------------------------------------------------------------------

class BackgroundJobRead(BaseModel):
    id: str
    job_type: str
    status: str
    payload: str
    attempts: int
    max_attempts: int
    last_error: Optional[str]
    scheduled_at: str
    started_at: Optional[str]
    completed_at: Optional[str]
    created_at: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Dashboard Metrics
# ---------------------------------------------------------------------------

class ProjectProgress(BaseModel):
    project: ProjectRead
    story_count: int
    task_count: int
    done_tasks: int
    progress: int  # 0–100


class StatusCount(BaseModel):
    status: str
    count: int


class DashboardMetrics(BaseModel):
    total_projects: int
    active_projects: int
    open_stories: int
    open_tasks: int
    completed_tasks: int
    overdue_tasks: int
    status_distribution: List[StatusCount]
    project_progress: List[ProjectProgress]
    upcoming_deadlines: List[TaskRead]
    my_tasks: List[TaskRead]
    open_stories_list: List[UserStoryRead]


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

class SearchResult(BaseModel):
    type: str         # "project" | "story" | "task"
    id: str
    ref: str
    title: str
    status: str
    project_id: Optional[str] = None
    story_id: Optional[str] = None


class SearchResponse(BaseModel):
    query: str
    projects: List[SearchResult]
    stories: List[SearchResult]
    tasks: List[SearchResult]


# ---------------------------------------------------------------------------
# Error response (standard shape returned by all exception handlers)
# ---------------------------------------------------------------------------

class ErrorResponse(BaseModel):
    error: str
    message: str
    detail: Optional[Any] = None
