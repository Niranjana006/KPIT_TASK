# FlowForge - Agile Project Management

FlowForge is a complete Agile Project Management application developed for the KPIT technical evaluation. It provides teams with a robust, hierarchical structure to manage their software development lifecycle.

## 🎥 Demo Walkthrough

A complete walkthrough demonstrating the application's key features, user workflow, frontend-backend integration, persistent data, API functionality, and background workflow is available here:

**[▶️ Watch the FlowForge Walkthrough](./docs/FlowForge_walkthrough_demo.mp4)**

The application enforces a strict and organized hierarchy:
**Project**
&nbsp;&nbsp;└── **User Story**
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└── **Task**

FlowForge allows teams to seamlessly plan, track, and collaborate on their projects from high-level features down to actionable tasks, while staying informed through real-time metrics and an asynchronous notification system.

---

## 1. Project Overview

FlowForge enables project managers and developers to organize work efficiently. Projects contain User Stories, which define the requirements and features. User Stories are then broken down into granular Tasks that can be assigned, tracked, and completed.

**Key Capabilities:**

- Full management of Projects, User Stories, and Tasks.
- Visualizing work via Kanban boards and hierarchy trees.
- Tracking overdue items through automated background workflows.
- Real-time activity feeds and dashboard metrics.

---

## 2. Key Features

- **Authentication:** Secure login and session management using JWT and httpOnly cookies.
- **Authorization:** Project-scoped access control ensuring users only see and interact with data for projects they are members of.
- **Project CRUD:** Create, read, update, and delete projects.
- **User Stories & Tasks:** Full management of nested stories and tasks, including assignments, status tracking, and due dates.
- **Kanban Board:** Visual drag-and-drop task management.
- **Hierarchy View:** Tree-based visualization of the Project -> Story -> Task relationship.
- **Notifications:** Automated alerts for overdue tasks and system updates.
- **Activity Feed:** Global and project-scoped audit logs tracking entity creation, updates, and deletions.
- **Dashboard Metrics:** Computed metrics including project progress, status distribution, overdue task counts, and upcoming deadlines.
- **Global Search:** Fast, fuzzy search across accessible projects, stories, and tasks.
- **Background Workflow:** Automated scanning and processing of overdue tasks via `APScheduler`.
- **Responsive UI:** Modern, accessible, and responsive interface powered by shadcn/ui.
- **Error Handling:** Centralized API error formatting without leaking stack traces.

---

## 3. Technology Stack

### Frontend

- **React 19**
- **TanStack Start** (Routing & SSR)
- **TanStack Query** (Data Fetching & State Management)
- **Tailwind CSS v4** (Styling)
- **shadcn/ui** & **Radix UI** (Component Library)
- **Vite** (Build Tool)

### Backend

- **FastAPI** (Web Framework)
- **SQLAlchemy 2.0 (Async)** (ORM)
- **SQLite** + **aiosqlite** (Database)
- **APScheduler** (Background Job Scheduling)
- **Alembic** (Database Migrations)
- **Pytest** + **pytest-asyncio** (Testing)
- **Passlib** & **python-jose** (Security & Hashing)

---

## 4. Architecture

FlowForge follows a decoupled client-server architecture:

```text
       Browser
          │
          ▼
 React / TanStack Frontend
          │
          ▼
      REST API
          │
          ▼
      FastAPI
          │
          ▼
 SQLAlchemy (Async)
          │
          ▼
       SQLite
```

**Service Layer Abstraction:** The frontend uses typed API services (e.g., `projectService.ts`, `taskService.ts`) to wrap `fetch` calls. These services parse backend responses, enforce camelCase conventions for the UI, and abstract API complexities away from React components.

**Background Workflow:**

```text
   APScheduler
        │
        ▼
Background Job Runner
        │
        ▼
SQLite background_jobs (Persistence)
        │
        ▼
 Overdue Task Scan
        │
        ▼
   Notifications
```

---

## 5. API Documentation

The backend exposes a fully documented REST API. Interactive Swagger documentation is available locally at:
`http://127.0.0.1:8000/docs`

### Implemented Endpoints:

**Authentication**

- `POST /api/auth/login` - Authenticate and set httpOnly cookie
- `POST /api/auth/logout` - Clear authentication cookie
- `GET /api/auth/me` - Get current authenticated user

**Users**

- `GET /api/users` - List system users
- `PATCH /api/users/me` - Update current user profile

**Projects**

- `GET /api/projects` - List accessible projects
- `POST /api/projects` - Create a new project
- `GET /api/projects/{id}` - Get project details
- `PATCH /api/projects/{id}` - Update a project
- `DELETE /api/projects/{id}` - Delete a project (Owner only)

**User Stories**

- `GET /api/projects/{project_id}/stories` - List stories in a project
- `POST /api/projects/{project_id}/stories` - Create a story
- `GET /api/stories/{id}` - Get story details
- `PATCH /api/stories/{id}` - Update a story
- `DELETE /api/stories/{id}` - Delete a story

**Tasks**

- `GET /api/stories/{story_id}/tasks` - List tasks in a story
- `POST /api/stories/{story_id}/tasks` - Create a task
- `GET /api/tasks/{id}` - Get task details
- `PATCH /api/tasks/{id}` - Update a task
- `DELETE /api/tasks/{id}` - Delete a task

**Notifications**

- `GET /api/notifications` - List user notifications
- `PATCH /api/notifications/{id}/read` - Mark specific notification as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/{id}` - Dismiss notification

**Activity**

- `GET /api/activity` - Global activity feed (accessible projects)
- `GET /api/projects/{id}/activity` - Project-specific activity feed

**Metrics**

- `GET /api/metrics/dashboard` - Get calculated dashboard statistics

**Search**

- `GET /api/search?q={query}` - Global fuzzy search

**Background Jobs**

- `GET /api/jobs` - List recent background jobs (Admin/Monitoring)

---

## 6. Database Schema

FlowForge uses SQLite as its persistent storage. The schema enforces the `Project -> Story -> Task` hierarchy via strict foreign keys.

### Core Tables:

- **`users`**: Stores user credentials, emails, and hashed passwords.
- **`projects`**: Stores project metadata (key, name, status, owner_id).
- **`project_members`**: Join table mapping `users` to `projects` for authorization.
- **`user_stories`**: Belongs to `projects`. Stores agile story requirements.
- **`tasks`**: Belongs to `user_stories` and `projects`. Stores task status, assignee, and due date.
- **`notifications`**: Stores user-scoped alerts (e.g., overdue warnings).
- **`activity_events`**: Audit log storing actions (create, update, delete) on entities. Includes a JSON `details` column for flexible payload tracking.
- **`background_jobs`**: Tracks the execution history and status (pending, success, failed) of scheduled automated tasks.

---

## 7. Background Workflow

FlowForge implements a robust, asynchronous background workflow to process overdue tasks without blocking the main web server.

- **Scheduler:** `APScheduler` runs an automated scan every 15 minutes.
- **Execution:** It identifies tasks that have passed their `due_date` and haven't been completed.
- **Notification:** Generates a system notification for the task assignee.
- **Persistence:** Job executions and outcomes are recorded in the `background_jobs` SQLite table.
- **Idempotency:** An `idempotency_key` ensures that notifications aren't duplicated if a job is accidentally run multiple times for the same time window.
- **Retry Strategy:** Implements an exponential backoff strategy (up to 3 attempts, delayed by `2 ** attempts` minutes) to handle transient failures gracefully.

---

## 8. Design Decisions & Tradeoffs

**Why SQLite?**
SQLite was chosen for its simplicity, zero-configuration deployment, and low infrastructure overhead. It is perfectly suited for a small-team evaluation environment and makes it trivial to run the application locally.
_Tradeoff:_ SQLite has concurrency limitations (database-level locking during writes), which makes it less ideal for high-throughput, globally distributed applications.

**Why APScheduler + SQLite instead of Celery/Redis?**
Integrating a heavy message broker (like Redis/RabbitMQ) and worker daemon (like Celery) would unnecessarily complicate the local setup. APScheduler integrated directly into the FastAPI lifecycle, combined with SQLite persistence for jobs, achieves the goal of a reliable, trackable background workflow with zero external dependencies.
_Tradeoff:_ APScheduler runs inside the application process. If the API server is horizontally scaled to multiple instances, this architecture would require distributed locking to prevent duplicate job execution.

---

## 9. Security Considerations

FlowForge implements essential security measures directly in the application code:

- **JWT Authentication:** Secure token-based auth stored safely in `httpOnly` cookies to prevent XSS attacks.
- **Password Hashing:** `bcrypt` is used to salt and hash all user passwords.
- **Authorization Checks:** Every API endpoint validates that the requester is an active member of the target project before permitting reads or mutations.
- **User-Scoped Data:** Notifications and Activity Feeds are strictly scoped to the authenticated user's permissions.
- **Clean Error Handling:** Centralized exception handlers prevent stack trace leakage and return standardized, safe error JSON payloads.
- **Environment Management:** Sensitive configurations and secrets are managed via `.env` (excluded from Git).

### Demo Access

The application uses provisioned demo accounts for evaluation. Public self-registration is outside the current assignment scope.

- **Demo email:** `priya@flowforge.dev`
- **Demo password:** `password`

After signing in, users can access the dashboard and manage projects, stories, and tasks according to their permissions. Authentication uses JWT-based session management with HTTP-only cookies through the FastAPI backend.

---

## 10. Testing

The backend is thoroughly tested using `pytest` and `pytest-asyncio`.
The test suite covers Authentication, CRUD operations, Authorization guards, Metrics calculation, and the complete Background Worker lifecycle (including retries and idempotency).

**Current Status:**

- `35 / 35` backend tests passed successfully.
- Frontend builds and lints cleanly without errors.

---

## 11. Setup / Running Locally

Ensure you have Node.js (v20+) and Python (v3.10+) installed.

### 1. Environment Variables

Create a `.env` file in the root directory (you can copy `.env.example` if available).
_Note: Do not include sensitive secrets in version control._

```env
SECRET_KEY=your-super-secret-key-for-jwt
DATABASE_URL=sqlite+aiosqlite:///./flowforge.db
FRONTEND_URL=http://localhost:8080
```

### 2. Backend Setup

Open a terminal in the project root:

```bash
# Create and activate virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows
# source venv/bin/activate  # On Mac/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations to create the database schema
alembic upgrade head

# Start the FastAPI server
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

The API is now running at: `http://127.0.0.1:8000`
Interactive Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup

Open a separate terminal in the project root:

```bash
# Install NPM dependencies
npm install

# Start the Vite development server
npm run dev
```

The Frontend is now running at: `http://localhost:8080`

---

## 12. Project Structure

```text
├── backend/
│   ├── alembic/           # Database migrations
│   ├── routers/           # FastAPI route handlers
│   ├── tests/             # Pytest test suite
│   ├── worker.py          # APScheduler background tasks
│   ├── models.py          # SQLAlchemy models
│   ├── schemas.py         # Pydantic validation schemas
│   └── main.py            # FastAPI application entrypoint
├── src/                   # Frontend React Source
│   ├── components/        # Reusable UI components (shadcn)
│   ├── features/          # Domain-specific components
│   ├── hooks/             # TanStack Query & React hooks
│   ├── routes/            # TanStack Start file-based routing
│   ├── services/          # API fetch abstraction layer
│   └── types/             # TypeScript interfaces
├── package.json
└── README.md
```

---

## 13. AI Usage Note

AI-assisted development tools were used during implementation for code generation, debugging, refactoring, documentation, and development assistance. Generated changes were reviewed, tested, integrated, and verified as part of the rigorous development process to ensure code quality and architectural soundness.

---

## 14. Future Improvements

While FlowForge is feature-complete for the current scope, future iterations for a larger-scale production deployment could include:

- **PostgreSQL Migration:** Transitioning from SQLite to PostgreSQL to support high-concurrency read/write operations.
- **Distributed Message Broker:** Moving background jobs to a robust Redis/Celery queue for true distributed processing and horizontal scaling.
- **Real-time WebSockets:** Pushing live notifications and activity feed updates to the client via WebSockets instead of relying on frontend polling or manual refresh.
- **Advanced RBAC:** Implementing granular Role-Based Access Control (Admin, Contributor, Viewer) within projects.
- **CI/CD Integration:** Implementing automated GitHub Actions for testing and continuous deployment.
- **Automated Frontend Testing:** Adding Playwright/Cypress for E2E UI testing.
