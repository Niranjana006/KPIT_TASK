"""
seed.py — Populates the database with realistic initial data.

Translates the TypeScript seed data from src/data/seed.ts into Python.
Run this once after `init_db()`. Skips seeding if users already exist.

Default credentials for all seeded users: password = "password"
(bcrypt hash is computed at seed time)
"""

import json
from datetime import datetime, timezone, timedelta


def day_iso(offset: int, hour: int = 9) -> str:
    """Return an ISO timestamp offset from today's UTC midnight."""
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    dt = today + timedelta(days=offset, hours=hour)
    return dt.isoformat()


USERS_DATA = [
    {"id": "u1", "name": "Priya Raman",   "email": "priya@flowforge.dev",   "role": "Product Owner", "initials": "PR", "color": "accent-1"},
    {"id": "u2", "name": "Arun Mehta",    "email": "arun@flowforge.dev",    "role": "Scrum Master",  "initials": "AM", "color": "accent-2"},
    {"id": "u3", "name": "Karthik Iyer",  "email": "karthik@flowforge.dev", "role": "Engineer",      "initials": "KI", "color": "accent-3"},
    {"id": "u4", "name": "Sneha Kapoor",  "email": "sneha@flowforge.dev",   "role": "Engineer",      "initials": "SK", "color": "accent-4"},
    {"id": "u5", "name": "Divya Nair",    "email": "divya@flowforge.dev",   "role": "Designer",      "initials": "DN", "color": "accent-5"},
    {"id": "u6", "name": "Rahul Verma",   "email": "rahul@flowforge.dev",   "role": "QA Engineer",   "initials": "RV", "color": "accent-6"},
    {"id": "u7", "name": "Meera Joshi",   "email": "meera@flowforge.dev",   "role": "Engineer",      "initials": "MJ", "color": "accent-1"},
]

PROJECTS_DATA = [
    {
        "id": "p1", "key": "ATL", "name": "Atlas Platform",
        "description": "Core customer-facing platform: authentication, workspaces and the analytics dashboard used by every paying team.",
        "status": "active", "owner_id": "u1",
        "member_ids": ["u1","u2","u3","u4","u5","u6"],
        "start_date": day_iso(-58), "due_date": day_iso(28),
        "created_at": day_iso(-58), "updated_at": day_iso(0, 7),
    },
    {
        "id": "p2", "key": "PLS", "name": "Pulse Notifications",
        "description": "Asynchronous notification service with email digests, in-app inbox and per-user delivery preferences.",
        "status": "active", "owner_id": "u2",
        "member_ids": ["u2","u3","u6","u7"],
        "start_date": day_iso(-31), "due_date": day_iso(-2),
        "created_at": day_iso(-31), "updated_at": day_iso(-1, 16),
    },
    {
        "id": "p3", "key": "INS", "name": "Insight Reporting",
        "description": "Reporting module: scheduled exports, saved report definitions and query performance work for large workspaces.",
        "status": "planning", "owner_id": "u1",
        "member_ids": ["u1","u4","u5","u7"],
        "start_date": day_iso(-9), "due_date": day_iso(62),
        "created_at": day_iso(-12), "updated_at": day_iso(-3, 11),
    },
]

STORIES_DATA = [
    {"id":"s1","ref":"US-101","project_id":"p1","title":"User authentication","description":"As a user, I want to securely log in so that I can access my projects from any device.","acceptance_criteria":["User can enter an email address","User can enter a password","Invalid credentials show an inline error","Successful login redirects to the dashboard"],"status":"done","priority":"critical","assignee_id":"u3","story_points":8,"sprint":"Sprint 12","labels":["auth","security"],"created_at":day_iso(-56,10),"updated_at":day_iso(-6,14)},
    {"id":"s2","ref":"US-102","project_id":"p1","title":"Workspace dashboard","description":"As a team lead, I want a dashboard of delivery metrics so that I can see progress without opening every project.","acceptance_criteria":["Dashboard shows open and completed work counts","Cards link through to the underlying project","Overdue work is visually distinct"],"status":"in_progress","priority":"high","assignee_id":"u4","story_points":13,"sprint":"Sprint 13","labels":["dashboard","metrics"],"created_at":day_iso(-40,10),"updated_at":day_iso(0,14)},
    {"id":"s3","ref":"US-103","project_id":"p1","title":"Team member management","description":"As an admin, I want to invite and deactivate team members so that workspace access stays accurate.","acceptance_criteria":["Admin can invite a member by email","Roles can be changed from the members table","Deactivating a member requires confirmation"],"status":"in_review","priority":"medium","assignee_id":"u7","story_points":5,"sprint":"Sprint 13","labels":["admin","users"],"created_at":day_iso(-28,10),"updated_at":day_iso(-1,14)},
    {"id":"s4","ref":"US-104","project_id":"p1","title":"Global search","description":"As a user, I want to search across projects, stories and tasks so that I can jump to work in one keystroke.","acceptance_criteria":["Search is reachable with a keyboard shortcut","Results are grouped by entity type","Empty queries show recent items"],"status":"todo","priority":"medium","assignee_id":"u3","story_points":5,"sprint":"Sprint 14","labels":["search","ux"],"created_at":day_iso(-14,10),"updated_at":day_iso(-2,14)},
    {"id":"s5","ref":"US-201","project_id":"p2","title":"In-app notification inbox","description":"As a user, I want an inbox of notifications so that I never miss work assigned to me.","acceptance_criteria":["Unread notifications are visually marked","User can mark one or all as read","Notifications deep-link to the related item"],"status":"in_progress","priority":"high","assignee_id":"u6","story_points":8,"sprint":"Sprint 13","labels":["notifications"],"created_at":day_iso(-30,10),"updated_at":day_iso(0,14)},
    {"id":"s6","ref":"US-202","project_id":"p2","title":"Background digest worker","description":"As a user, I want a daily digest email so that I get a summary without checking the app.","acceptance_criteria":["Digest job runs on a schedule","Failed sends are retried with backoff","Users with no activity receive no email"],"status":"todo","priority":"critical","assignee_id":"u3","story_points":13,"sprint":"Sprint 14","labels":["async","email"],"created_at":day_iso(-25,10),"updated_at":day_iso(-1,14)},
    {"id":"s7","ref":"US-203","project_id":"p2","title":"Notification preferences","description":"As a user, I want to choose which events notify me so that my inbox stays relevant.","acceptance_criteria":["Preferences persist per user","Channel toggles cover in-app and email","Defaults are applied to new users"],"status":"backlog","priority":"low","assignee_id":"u7","story_points":3,"sprint":"Backlog","labels":["settings"],"created_at":day_iso(-18,10),"updated_at":day_iso(-4,14)},
    {"id":"s8","ref":"US-301","project_id":"p3","title":"Scheduled report exports","description":"As a manager, I want reports exported on a schedule so that stakeholders get numbers automatically.","acceptance_criteria":["User can pick a weekly or monthly cadence","Exports are available as CSV","Export history is visible"],"status":"todo","priority":"high","assignee_id":"u4","story_points":8,"sprint":"Sprint 14","labels":["reporting","async"],"created_at":day_iso(-9,10),"updated_at":day_iso(-2,14)},
    {"id":"s9","ref":"US-302","project_id":"p3","title":"Third-party API integration","description":"As an analyst, I want to pull issue data from external trackers so that reports cover all our tools.","acceptance_criteria":["Integration credentials are stored securely","Sync failures surface an actionable error","Partial syncs can be resumed"],"status":"backlog","priority":"medium","assignee_id":"u7","story_points":13,"sprint":"Backlog","labels":["integration","api"],"created_at":day_iso(-8,10),"updated_at":day_iso(-3,14)},
    {"id":"s10","ref":"US-303","project_id":"p3","title":"Query performance improvements","description":"As a user of a large workspace, I want reports to load quickly so that I can iterate on filters.","acceptance_criteria":["Report queries respond under 800ms at p95","Slow queries are logged with parameters","Indexes are documented in the schema notes"],"status":"backlog","priority":"medium","assignee_id":"u5","story_points":5,"sprint":"Backlog","labels":["performance"],"created_at":day_iso(-7,10),"updated_at":day_iso(-5,14)},
]

TASKS_DATA = [
    {"id":"t1","ref":"TASK-201","project_id":"p1","story_id":"s1","title":"Login API endpoint","description":"Implement POST /auth/login with password hashing, rate limiting and session issuance.","status":"done","priority":"critical","assignee_id":"u3","due_date":day_iso(-24,17),"estimated_hours":8,"labels":["backend","api"],"created_at":day_iso(-55,10),"updated_at":day_iso(-22,15),"completed_at":day_iso(-22,16)},
    {"id":"t2","ref":"TASK-202","project_id":"p1","story_id":"s1","title":"Login UI and form validation","description":"Build the sign-in screen with inline field validation and a clear error state for bad credentials.","status":"done","priority":"high","assignee_id":"u5","due_date":day_iso(-21,17),"estimated_hours":6,"labels":["frontend"],"created_at":day_iso(-54,10),"updated_at":day_iso(-20,15),"completed_at":day_iso(-20,16)},
    {"id":"t3","ref":"TASK-203","project_id":"p1","story_id":"s1","title":"Session expiry handling","description":"Refresh tokens silently and redirect to sign-in when a session cannot be renewed.","status":"done","priority":"medium","assignee_id":"u3","due_date":day_iso(-8,17),"estimated_hours":5,"labels":["frontend","security"],"created_at":day_iso(-50,10),"updated_at":day_iso(-6,15),"completed_at":day_iso(-6,16)},
    {"id":"t4","ref":"TASK-204","project_id":"p1","story_id":"s2","title":"Dashboard metrics API","description":"Aggregate project, story and task counters in a single endpoint to avoid N+1 reads.","status":"in_progress","priority":"high","assignee_id":"u3","due_date":day_iso(0,17),"estimated_hours":10,"labels":["backend","api"],"created_at":day_iso(-38,10),"updated_at":day_iso(0,15),"completed_at":None},
    {"id":"t5","ref":"TASK-205","project_id":"p1","story_id":"s2","title":"Dashboard UI cards","description":"Metric cards, project progress list and upcoming deadline panel with loading skeletons.","status":"in_review","priority":"high","assignee_id":"u4","due_date":day_iso(1,17),"estimated_hours":12,"labels":["frontend"],"created_at":day_iso(-36,10),"updated_at":day_iso(-1,15),"completed_at":None},
    {"id":"t6","ref":"TASK-206","project_id":"p1","story_id":"s2","title":"Status distribution chart","description":"Render task status distribution and keep colours consistent with the status tokens.","status":"todo","priority":"medium","assignee_id":"u5","due_date":day_iso(4,17),"estimated_hours":5,"labels":["frontend","charts"],"created_at":day_iso(-30,10),"updated_at":day_iso(-2,15),"completed_at":None},
    {"id":"t7","ref":"TASK-207","project_id":"p1","story_id":"s2","title":"Overdue work rollup","description":"Compute overdue tasks per project and expose them to the dashboard payload.","status":"backlog","priority":"low","assignee_id":None,"due_date":day_iso(9,17),"estimated_hours":4,"labels":["backend"],"created_at":day_iso(-26,10),"updated_at":day_iso(-6,15),"completed_at":None},
    {"id":"t8","ref":"TASK-208","project_id":"p1","story_id":"s3","title":"Invite member flow","description":"Invite dialog with email validation, role selection and a pending-invite state.","status":"in_review","priority":"medium","assignee_id":"u7","due_date":day_iso(2,17),"estimated_hours":7,"labels":["frontend"],"created_at":day_iso(-27,10),"updated_at":day_iso(-1,15),"completed_at":None},
    {"id":"t9","ref":"TASK-209","project_id":"p1","story_id":"s3","title":"Role permission checks","description":"Server-side role checks for member management routes; deny by default.","status":"in_progress","priority":"high","assignee_id":"u3","due_date":day_iso(-1,17),"estimated_hours":6,"labels":["backend","security"],"created_at":day_iso(-25,10),"updated_at":day_iso(-1,15),"completed_at":None},
    {"id":"t10","ref":"TASK-210","project_id":"p1","story_id":"s3","title":"Deactivate member confirmation","description":"Destructive confirmation dialog that explains the consequences before deactivating.","status":"todo","priority":"low","assignee_id":"u6","due_date":day_iso(6,17),"estimated_hours":3,"labels":["frontend","ux"],"created_at":day_iso(-20,10),"updated_at":day_iso(-4,15),"completed_at":None},
    {"id":"t11","ref":"TASK-211","project_id":"p1","story_id":"s4","title":"Search index and query API","description":"Full-text search across projects, stories and tasks with ranked results.","status":"todo","priority":"medium","assignee_id":"u3","due_date":day_iso(7,17),"estimated_hours":9,"labels":["backend","search"],"created_at":day_iso(-13,10),"updated_at":day_iso(-2,15),"completed_at":None},
    {"id":"t12","ref":"TASK-212","project_id":"p1","story_id":"s4","title":"Command palette UI","description":"Keyboard-driven search dialog with grouped results and arrow-key navigation.","status":"todo","priority":"medium","assignee_id":"u5","due_date":day_iso(10,17),"estimated_hours":8,"labels":["frontend","ux"],"created_at":day_iso(-12,10),"updated_at":day_iso(-2,15),"completed_at":None},
    {"id":"t13","ref":"TASK-301","project_id":"p2","story_id":"s5","title":"Notification inbox UI","description":"Grouped inbox with unread markers, filters and mark-all-as-read.","status":"in_progress","priority":"high","assignee_id":"u6","due_date":day_iso(1,17),"estimated_hours":8,"labels":["frontend"],"created_at":day_iso(-29,10),"updated_at":day_iso(0,15),"completed_at":None},
    {"id":"t14","ref":"TASK-302","project_id":"p2","story_id":"s5","title":"Notification read-state API","description":"Endpoints to mark single and bulk notifications as read, idempotently.","status":"in_review","priority":"medium","assignee_id":"u3","due_date":day_iso(-1,17),"estimated_hours":5,"labels":["backend","api"],"created_at":day_iso(-28,10),"updated_at":day_iso(-1,15),"completed_at":None},
    {"id":"t15","ref":"TASK-303","project_id":"p2","story_id":"s5","title":"Unread badge polling","description":"Poll unread counts with backoff and pause polling when the tab is hidden.","status":"todo","priority":"low","assignee_id":"u7","due_date":day_iso(5,17),"estimated_hours":4,"labels":["frontend"],"created_at":day_iso(-22,10),"updated_at":day_iso(-5,15),"completed_at":None},
    {"id":"t16","ref":"TASK-304","project_id":"p2","story_id":"s6","title":"Digest scheduler job","description":"Background job that batches the previous day's events per user.","status":"todo","priority":"critical","assignee_id":"u3","due_date":day_iso(2,17),"estimated_hours":12,"labels":["async","backend"],"created_at":day_iso(-24,10),"updated_at":day_iso(-1,15),"completed_at":None},
    {"id":"t17","ref":"TASK-305","project_id":"p2","story_id":"s6","title":"Email template rendering","description":"Digest email template with plain-text fallback and safe HTML escaping.","status":"backlog","priority":"medium","assignee_id":"u5","due_date":day_iso(8,17),"estimated_hours":6,"labels":["email"],"created_at":day_iso(-23,10),"updated_at":day_iso(-4,15),"completed_at":None},
    {"id":"t18","ref":"TASK-306","project_id":"p2","story_id":"s6","title":"Retry and dead-letter handling","description":"Exponential backoff for failed sends plus a dead-letter table for inspection.","status":"backlog","priority":"high","assignee_id":None,"due_date":day_iso(12,17),"estimated_hours":7,"labels":["async","reliability"],"created_at":day_iso(-21,10),"updated_at":day_iso(-6,15),"completed_at":None},
    {"id":"t19","ref":"TASK-307","project_id":"p2","story_id":"s7","title":"Preferences form","description":"Per-event notification toggles for in-app and email channels.","status":"backlog","priority":"low","assignee_id":"u7","due_date":day_iso(15,17),"estimated_hours":5,"labels":["frontend","settings"],"created_at":day_iso(-17,10),"updated_at":day_iso(-4,15),"completed_at":None},
    {"id":"t20","ref":"TASK-308","project_id":"p2","story_id":"s7","title":"Preference persistence API","description":"Store and read notification preferences with sensible defaults.","status":"backlog","priority":"low","assignee_id":"u3","due_date":day_iso(18,17),"estimated_hours":4,"labels":["backend"],"created_at":day_iso(-16,10),"updated_at":day_iso(-5,15),"completed_at":None},
    {"id":"t21","ref":"TASK-401","project_id":"p3","story_id":"s8","title":"CSV export generator","description":"Stream large report exports to CSV without loading all rows into memory.","status":"todo","priority":"high","assignee_id":"u4","due_date":day_iso(5,17),"estimated_hours":9,"labels":["backend","reporting"],"created_at":day_iso(-8,10),"updated_at":day_iso(-2,15),"completed_at":None},
    {"id":"t22","ref":"TASK-402","project_id":"p3","story_id":"s8","title":"Schedule picker UI","description":"Cadence picker with timezone-aware preview of the next run.","status":"backlog","priority":"medium","assignee_id":"u5","due_date":day_iso(11,17),"estimated_hours":6,"labels":["frontend"],"created_at":day_iso(-7,10),"updated_at":day_iso(-3,15),"completed_at":None},
    {"id":"t23","ref":"TASK-403","project_id":"p3","story_id":"s8","title":"Export history view","description":"Table of past exports with status, size and re-download action.","status":"backlog","priority":"low","assignee_id":None,"due_date":day_iso(20,17),"estimated_hours":5,"labels":["frontend"],"created_at":day_iso(-6,10),"updated_at":day_iso(-3,15),"completed_at":None},
    {"id":"t24","ref":"TASK-404","project_id":"p3","story_id":"s9","title":"Integration credential storage","description":"Encrypt integration secrets at rest and never return them to the client.","status":"backlog","priority":"high","assignee_id":"u7","due_date":day_iso(14,17),"estimated_hours":8,"labels":["security","integration"],"created_at":day_iso(-6,10),"updated_at":day_iso(-3,15),"completed_at":None},
    {"id":"t25","ref":"TASK-405","project_id":"p3","story_id":"s9","title":"Sync worker with pagination","description":"Resumable sync worker that walks external pages and records a cursor.","status":"backlog","priority":"medium","assignee_id":"u3","due_date":day_iso(21,17),"estimated_hours":10,"labels":["async","integration"],"created_at":day_iso(-5,10),"updated_at":day_iso(-3,15),"completed_at":None},
    {"id":"t26","ref":"TASK-406","project_id":"p3","story_id":"s10","title":"Add covering indexes","description":"Index the report query hot paths and document each index and its purpose.","status":"backlog","priority":"medium","assignee_id":"u4","due_date":day_iso(16,17),"estimated_hours":4,"labels":["performance","database"],"created_at":day_iso(-5,10),"updated_at":day_iso(-5,15),"completed_at":None},
    {"id":"t27","ref":"TASK-407","project_id":"p3","story_id":"s10","title":"Slow query logging","description":"Log queries above the latency budget with sanitised parameters.","status":"backlog","priority":"low","assignee_id":"u7","due_date":day_iso(24,17),"estimated_hours":3,"labels":["performance","observability"],"created_at":day_iso(-4,10),"updated_at":day_iso(-4,15),"completed_at":None},
]

NOTIFICATIONS_DATA = [
    {"id":"n1","user_id":"u3","kind":"assignment","title":"TASK-204 was assigned to you","body":"Priya Raman assigned 'Dashboard metrics API' to you in Atlas Platform.","read":False,"link":"/projects/p1/board","created_at":day_iso(0,7)},
    {"id":"n2","user_id":"u3","kind":"due_soon","title":"TASK-205 is due tomorrow","body":"'Dashboard UI cards' is in review and due tomorrow.","read":False,"link":"/projects/p1/board","created_at":day_iso(0,6)},
    {"id":"n3","user_id":"u3","kind":"update","title":"US-101 was updated","body":"Arun Mehta moved 'User authentication' to Done.","read":False,"link":"/projects/p1/stories","created_at":day_iso(-1,18)},
    {"id":"n4","user_id":"u3","kind":"milestone","title":"Atlas Platform reached 45% completion","body":"Seven of sixteen tasks are now complete for this project.","read":True,"link":"/projects/p1","created_at":day_iso(-2,12)},
    {"id":"n5","user_id":"u3","kind":"due_soon","title":"TASK-302 is overdue","body":"'Notification read-state API' passed its due date yesterday.","read":True,"link":"/projects/p2/board","created_at":day_iso(-1,9)},
    {"id":"n6","user_id":"u3","kind":"update","title":"Pulse Notifications due date changed","body":"Arun Mehta moved the project due date earlier by three days.","read":True,"link":"/projects/p2","created_at":day_iso(-3,15)},
]

ACTIVITY_DATA = [
    {"id":"a1","actor_id":"u2","action":"status_changed","entity_type":"task","entity_id":"t3","entity_ref":"TASK-203","entity_title":"Session expiry handling","project_id":"p1","story_id":"s1","task_id":"t3","from_value":"in_progress","to_value":"done","created_at":day_iso(0,8)},
    {"id":"a2","actor_id":"u1","action":"assigned","entity_type":"task","entity_id":"t4","entity_ref":"TASK-204","entity_title":"Dashboard metrics API","project_id":"p1","story_id":"s2","task_id":"t4","from_value":None,"to_value":"u3","created_at":day_iso(0,7)},
    {"id":"a3","actor_id":"u6","action":"status_changed","entity_type":"task","entity_id":"t13","entity_ref":"TASK-301","entity_title":"Notification inbox UI","project_id":"p2","story_id":"s5","task_id":"t13","from_value":"todo","to_value":"in_progress","created_at":day_iso(0,6)},
    {"id":"a4","actor_id":"u4","action":"status_changed","entity_type":"task","entity_id":"t5","entity_ref":"TASK-205","entity_title":"Dashboard UI cards","project_id":"p1","story_id":"s2","task_id":"t5","from_value":"in_progress","to_value":"in_review","created_at":day_iso(-1,17)},
    {"id":"a5","actor_id":"u2","action":"priority_changed","entity_type":"task","entity_id":"t16","entity_ref":"TASK-304","entity_title":"Digest scheduler job","project_id":"p2","story_id":"s6","task_id":"t16","from_value":"high","to_value":"critical","created_at":day_iso(-1,14)},
    {"id":"a6","actor_id":"u1","action":"updated","entity_type":"story","entity_id":"s3","entity_ref":"US-103","entity_title":"Team member management","project_id":"p1","story_id":"s3","task_id":None,"from_value":None,"to_value":None,"created_at":day_iso(-1,11)},
    {"id":"a7","actor_id":"u7","action":"created","entity_type":"task","entity_id":"t27","entity_ref":"TASK-407","entity_title":"Slow query logging","project_id":"p3","story_id":"s10","task_id":"t27","from_value":None,"to_value":None,"created_at":day_iso(-4,10)},
    {"id":"a8","actor_id":"u1","action":"created","entity_type":"project","entity_id":"p3","entity_ref":"INS","entity_title":"Insight Reporting","project_id":"p3","story_id":None,"task_id":None,"from_value":None,"to_value":None,"created_at":day_iso(-12,9)},
    {"id":"a9","actor_id":"u5","action":"due_date_changed","entity_type":"task","entity_id":"t6","entity_ref":"TASK-206","entity_title":"Status distribution chart","project_id":"p1","story_id":"s2","task_id":"t6","from_value":"in 2 days","to_value":"in 4 days","created_at":day_iso(-2,13)},
    {"id":"a10","actor_id":"u3","action":"status_changed","entity_type":"task","entity_id":"t14","entity_ref":"TASK-302","entity_title":"Notification read-state API","project_id":"p2","story_id":"s5","task_id":"t14","from_value":"in_progress","to_value":"in_review","created_at":day_iso(-1,10)},
]


async def run_seed(db_session) -> None:
    """
    Seed the database with initial data. No-op if users already exist.
    Passwords default to 'password' for all seeded users.
    """
    from sqlalchemy import select
    from backend import models
    from backend.auth import hash_password

    # Check if already seeded
    result = await db_session.execute(select(models.User).limit(1))
    if result.scalar_one_or_none():
        return  # Already seeded

    default_hash = hash_password("password")

    # Insert users
    for u in USERS_DATA:
        db_session.add(models.User(
            id=u["id"], name=u["name"], email=u["email"],
            role=u["role"], initials=u["initials"], color=u["color"],
            password_hash=default_hash,
            created_at=day_iso(-60), updated_at=day_iso(-60),
        ))

    await db_session.flush()

    # Insert projects
    for p in PROJECTS_DATA:
        db_session.add(models.Project(
            id=p["id"], key=p["key"], name=p["name"],
            description=p["description"], status=p["status"],
            owner_id=p["owner_id"],
            start_date=p["start_date"], due_date=p["due_date"],
            created_at=p["created_at"], updated_at=p["updated_at"],
        ))
    await db_session.flush()

    # Project members
    for p in PROJECTS_DATA:
        for uid in p["member_ids"]:
            db_session.add(models.ProjectMember(project_id=p["id"], user_id=uid))
    await db_session.flush()

    # Stories
    for s in STORIES_DATA:
        db_session.add(models.UserStory(
            id=s["id"], ref=s["ref"], project_id=s["project_id"],
            title=s["title"], description=s["description"],
            acceptance_criteria=json.dumps(s["acceptance_criteria"]),
            status=s["status"], priority=s["priority"],
            assignee_id=s["assignee_id"],
            story_points=s["story_points"], sprint=s["sprint"],
            labels=json.dumps(s["labels"]),
            created_at=s["created_at"], updated_at=s["updated_at"],
        ))
    await db_session.flush()

    # Tasks
    for t in TASKS_DATA:
        db_session.add(models.Task(
            id=t["id"], ref=t["ref"],
            project_id=t["project_id"], story_id=t["story_id"],
            title=t["title"], description=t["description"],
            status=t["status"], priority=t["priority"],
            assignee_id=t["assignee_id"],
            due_date=t["due_date"],
            estimated_hours=t["estimated_hours"],
            labels=json.dumps(t["labels"]),
            created_at=t["created_at"], updated_at=t["updated_at"],
            completed_at=t["completed_at"],
        ))
    await db_session.flush()

    # Notifications
    for n in NOTIFICATIONS_DATA:
        db_session.add(models.Notification(
            id=n["id"], user_id=n["user_id"], kind=n["kind"],
            title=n["title"], body=n["body"], read=n["read"],
            link=n["link"], created_at=n["created_at"],
        ))
    await db_session.flush()

    # Activity events
    for a in ACTIVITY_DATA:
        db_session.add(models.ActivityEvent(
            id=a["id"], actor_id=a["actor_id"], action=a["action"],
            entity_type=a["entity_type"], entity_id=a["entity_id"],
            entity_ref=a["entity_ref"], entity_title=a["entity_title"],
            project_id=a.get("project_id"), story_id=a.get("story_id"),
            task_id=a.get("task_id"),
            from_value=a.get("from_value"), to_value=a.get("to_value"),
            created_at=a["created_at"],
        ))

    await db_session.commit()
    print("Database seeded with initial data.")
