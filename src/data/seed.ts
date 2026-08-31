import type {
  ActivityEvent,
  AppNotification,
  Project,
  Task,
  User,
  UserStory,
} from "@/types";

/**
 * Deterministic date helpers.
 * All seed timestamps are derived from the current UTC day so the dataset stays
 * meaningful over time while producing identical values on server and client.
 */
const startOfUtcDay = () => {
  const now = new Date();
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
};

export const day = (offset: number, hour = 9): string =>
  new Date(startOfUtcDay() + offset * 86_400_000 + hour * 3_600_000).toISOString();

export const users: User[] = [
  {
    id: "u1",
    name: "Priya Raman",
    email: "priya@flowforge.dev",
    role: "Product Owner",
    initials: "PR",
    color: "accent-1",
  },
  {
    id: "u2",
    name: "Arun Mehta",
    email: "arun@flowforge.dev",
    role: "Scrum Master",
    initials: "AM",
    color: "accent-2",
  },
  {
    id: "u3",
    name: "Karthik Iyer",
    email: "karthik@flowforge.dev",
    role: "Engineer",
    initials: "KI",
    color: "accent-3",
  },
  {
    id: "u4",
    name: "Sneha Kapoor",
    email: "sneha@flowforge.dev",
    role: "Engineer",
    initials: "SK",
    color: "accent-4",
  },
  {
    id: "u5",
    name: "Divya Nair",
    email: "divya@flowforge.dev",
    role: "Designer",
    initials: "DN",
    color: "accent-5",
  },
  {
    id: "u6",
    name: "Rahul Verma",
    email: "rahul@flowforge.dev",
    role: "QA Engineer",
    initials: "RV",
    color: "accent-6",
  },
  {
    id: "u7",
    name: "Meera Joshi",
    email: "meera@flowforge.dev",
    role: "Engineer",
    initials: "MJ",
    color: "accent-1",
  },
];

/** The signed-in user for this demo session ("My Work" is scoped to them). */
export const CURRENT_USER_ID = "u3";

export const projects: Project[] = [
  {
    id: "p1",
    key: "ATL",
    name: "Atlas Platform",
    description:
      "Core customer-facing platform: authentication, workspaces and the analytics dashboard used by every paying team.",
    status: "active",
    ownerId: "u1",
    memberIds: ["u1", "u2", "u3", "u4", "u5", "u6"],
    startDate: day(-58),
    dueDate: day(28),
    createdAt: day(-58),
    updatedAt: day(0, 7),
  },
  {
    id: "p2",
    key: "PLS",
    name: "Pulse Notifications",
    description:
      "Asynchronous notification service with email digests, in-app inbox and per-user delivery preferences.",
    status: "active",
    ownerId: "u2",
    memberIds: ["u2", "u3", "u6", "u7"],
    startDate: day(-31),
    dueDate: day(-2),
    createdAt: day(-31),
    updatedAt: day(-1, 16),
  },
  {
    id: "p3",
    key: "INS",
    name: "Insight Reporting",
    description:
      "Reporting module: scheduled exports, saved report definitions and query performance work for large workspaces.",
    status: "planning",
    ownerId: "u1",
    memberIds: ["u1", "u4", "u5", "u7"],
    startDate: day(-9),
    dueDate: day(62),
    createdAt: day(-12),
    updatedAt: day(-3, 11),
  },
];

type StorySeed = Omit<UserStory, "createdAt" | "updatedAt"> & {
  created: number;
  updated: number;
};

const storySeeds: StorySeed[] = [
  {
    id: "s1",
    ref: "US-101",
    projectId: "p1",
    title: "User authentication",
    description:
      "As a user, I want to securely log in so that I can access my projects from any device.",
    acceptanceCriteria: [
      "User can enter an email address",
      "User can enter a password",
      "Invalid credentials show an inline error",
      "Successful login redirects to the dashboard",
    ],
    status: "done",
    priority: "critical",
    assigneeId: "u3",
    storyPoints: 8,
    sprint: "Sprint 12",
    labels: ["auth", "security"],
    created: -56,
    updated: -6,
  },
  {
    id: "s2",
    ref: "US-102",
    projectId: "p1",
    title: "Workspace dashboard",
    description:
      "As a team lead, I want a dashboard of delivery metrics so that I can see progress without opening every project.",
    acceptanceCriteria: [
      "Dashboard shows open and completed work counts",
      "Cards link through to the underlying project",
      "Overdue work is visually distinct",
    ],
    status: "in_progress",
    priority: "high",
    assigneeId: "u4",
    storyPoints: 13,
    sprint: "Sprint 13",
    labels: ["dashboard", "metrics"],
    created: -40,
    updated: 0,
  },
  {
    id: "s3",
    ref: "US-103",
    projectId: "p1",
    title: "Team member management",
    description:
      "As an admin, I want to invite and deactivate team members so that workspace access stays accurate.",
    acceptanceCriteria: [
      "Admin can invite a member by email",
      "Roles can be changed from the members table",
      "Deactivating a member requires confirmation",
    ],
    status: "in_review",
    priority: "medium",
    assigneeId: "u7",
    storyPoints: 5,
    sprint: "Sprint 13",
    labels: ["admin", "users"],
    created: -28,
    updated: -1,
  },
  {
    id: "s4",
    ref: "US-104",
    projectId: "p1",
    title: "Global search",
    description:
      "As a user, I want to search across projects, stories and tasks so that I can jump to work in one keystroke.",
    acceptanceCriteria: [
      "Search is reachable with a keyboard shortcut",
      "Results are grouped by entity type",
      "Empty queries show recent items",
    ],
    status: "todo",
    priority: "medium",
    assigneeId: "u3",
    storyPoints: 5,
    sprint: "Sprint 14",
    labels: ["search", "ux"],
    created: -14,
    updated: -2,
  },
  {
    id: "s5",
    ref: "US-201",
    projectId: "p2",
    title: "In-app notification inbox",
    description:
      "As a user, I want an inbox of notifications so that I never miss work assigned to me.",
    acceptanceCriteria: [
      "Unread notifications are visually marked",
      "User can mark one or all as read",
      "Notifications deep-link to the related item",
    ],
    status: "in_progress",
    priority: "high",
    assigneeId: "u6",
    storyPoints: 8,
    sprint: "Sprint 13",
    labels: ["notifications"],
    created: -30,
    updated: 0,
  },
  {
    id: "s6",
    ref: "US-202",
    projectId: "p2",
    title: "Background digest worker",
    description:
      "As a user, I want a daily digest email so that I get a summary without checking the app.",
    acceptanceCriteria: [
      "Digest job runs on a schedule",
      "Failed sends are retried with backoff",
      "Users with no activity receive no email",
    ],
    status: "todo",
    priority: "critical",
    assigneeId: "u3",
    storyPoints: 13,
    sprint: "Sprint 14",
    labels: ["async", "email"],
    created: -25,
    updated: -1,
  },
  {
    id: "s7",
    ref: "US-203",
    projectId: "p2",
    title: "Notification preferences",
    description:
      "As a user, I want to choose which events notify me so that my inbox stays relevant.",
    acceptanceCriteria: [
      "Preferences persist per user",
      "Channel toggles cover in-app and email",
      "Defaults are applied to new users",
    ],
    status: "backlog",
    priority: "low",
    assigneeId: "u7",
    storyPoints: 3,
    sprint: "Backlog",
    labels: ["settings"],
    created: -18,
    updated: -4,
  },
  {
    id: "s8",
    ref: "US-301",
    projectId: "p3",
    title: "Scheduled report exports",
    description:
      "As a manager, I want reports exported on a schedule so that stakeholders get numbers automatically.",
    acceptanceCriteria: [
      "User can pick a weekly or monthly cadence",
      "Exports are available as CSV",
      "Export history is visible",
    ],
    status: "todo",
    priority: "high",
    assigneeId: "u4",
    storyPoints: 8,
    sprint: "Sprint 14",
    labels: ["reporting", "async"],
    created: -9,
    updated: -2,
  },
  {
    id: "s9",
    ref: "US-302",
    projectId: "p3",
    title: "Third-party API integration",
    description:
      "As an analyst, I want to pull issue data from external trackers so that reports cover all our tools.",
    acceptanceCriteria: [
      "Integration credentials are stored securely",
      "Sync failures surface an actionable error",
      "Partial syncs can be resumed",
    ],
    status: "backlog",
    priority: "medium",
    assigneeId: "u7",
    storyPoints: 13,
    sprint: "Backlog",
    labels: ["integration", "api"],
    created: -8,
    updated: -3,
  },
  {
    id: "s10",
    ref: "US-303",
    projectId: "p3",
    title: "Query performance improvements",
    description:
      "As a user of a large workspace, I want reports to load quickly so that I can iterate on filters.",
    acceptanceCriteria: [
      "Report queries respond under 800ms at p95",
      "Slow queries are logged with parameters",
      "Indexes are documented in the schema notes",
    ],
    status: "backlog",
    priority: "medium",
    assigneeId: "u5",
    storyPoints: 5,
    sprint: "Backlog",
    labels: ["performance"],
    created: -7,
    updated: -5,
  },
];

export const stories: UserStory[] = storySeeds.map(({ created, updated, ...rest }) => ({
  ...rest,
  createdAt: day(created, 10),
  updatedAt: day(updated, 14),
}));

type TaskSeed = Omit<Task, "createdAt" | "updatedAt" | "dueDate" | "completedAt"> & {
  created: number;
  updated: number;
  due: number | null;
  completed?: number;
};

const taskSeeds: TaskSeed[] = [
  // US-101 — authentication
  { id: "t1", ref: "TASK-201", projectId: "p1", storyId: "s1", title: "Login API endpoint", description: "Implement POST /auth/login with password hashing, rate limiting and session issuance.", status: "done", priority: "critical", assigneeId: "u3", estimatedHours: 8, labels: ["backend", "api"], created: -55, updated: -22, due: -24, completed: -22 },
  { id: "t2", ref: "TASK-202", projectId: "p1", storyId: "s1", title: "Login UI and form validation", description: "Build the sign-in screen with inline field validation and a clear error state for bad credentials.", status: "done", priority: "high", assigneeId: "u5", estimatedHours: 6, labels: ["frontend"], created: -54, updated: -20, due: -21, completed: -20 },
  { id: "t3", ref: "TASK-203", projectId: "p1", storyId: "s1", title: "Session expiry handling", description: "Refresh tokens silently and redirect to sign-in when a session cannot be renewed.", status: "done", priority: "medium", assigneeId: "u3", estimatedHours: 5, labels: ["frontend", "security"], created: -50, updated: -6, due: -8, completed: -6 },
  // US-102 — dashboard
  { id: "t4", ref: "TASK-204", projectId: "p1", storyId: "s2", title: "Dashboard metrics API", description: "Aggregate project, story and task counters in a single endpoint to avoid N+1 reads.", status: "in_progress", priority: "high", assigneeId: "u3", estimatedHours: 10, labels: ["backend", "api"], created: -38, updated: 0, due: 0 },
  { id: "t5", ref: "TASK-205", projectId: "p1", storyId: "s2", title: "Dashboard UI cards", description: "Metric cards, project progress list and upcoming deadline panel with loading skeletons.", status: "in_review", priority: "high", assigneeId: "u4", estimatedHours: 12, labels: ["frontend"], created: -36, updated: -1, due: 1 },
  { id: "t6", ref: "TASK-206", projectId: "p1", storyId: "s2", title: "Status distribution chart", description: "Render task status distribution and keep colours consistent with the status tokens.", status: "todo", priority: "medium", assigneeId: "u5", estimatedHours: 5, labels: ["frontend", "charts"], created: -30, updated: -2, due: 4 },
  { id: "t7", ref: "TASK-207", projectId: "p1", storyId: "s2", title: "Overdue work rollup", description: "Compute overdue tasks per project and expose them to the dashboard payload.", status: "backlog", priority: "low", assigneeId: null, estimatedHours: 4, labels: ["backend"], created: -26, updated: -6, due: 9 },
  // US-103 — team members
  { id: "t8", ref: "TASK-208", projectId: "p1", storyId: "s3", title: "Invite member flow", description: "Invite dialog with email validation, role selection and a pending-invite state.", status: "in_review", priority: "medium", assigneeId: "u7", estimatedHours: 7, labels: ["frontend"], created: -27, updated: -1, due: 2 },
  { id: "t9", ref: "TASK-209", projectId: "p1", storyId: "s3", title: "Role permission checks", description: "Server-side role checks for member management routes; deny by default.", status: "in_progress", priority: "high", assigneeId: "u3", estimatedHours: 6, labels: ["backend", "security"], created: -25, updated: -1, due: -1 },
  { id: "t10", ref: "TASK-210", projectId: "p1", storyId: "s3", title: "Deactivate member confirmation", description: "Destructive confirmation dialog that explains the consequences before deactivating.", status: "todo", priority: "low", assigneeId: "u6", estimatedHours: 3, labels: ["frontend", "ux"], created: -20, updated: -4, due: 6 },
  // US-104 — search
  { id: "t11", ref: "TASK-211", projectId: "p1", storyId: "s4", title: "Search index and query API", description: "Full-text search across projects, stories and tasks with ranked results.", status: "todo", priority: "medium", assigneeId: "u3", estimatedHours: 9, labels: ["backend", "search"], created: -13, updated: -2, due: 7 },
  { id: "t12", ref: "TASK-212", projectId: "p1", storyId: "s4", title: "Command palette UI", description: "Keyboard-driven search dialog with grouped results and arrow-key navigation.", status: "todo", priority: "medium", assigneeId: "u5", estimatedHours: 8, labels: ["frontend", "ux"], created: -12, updated: -2, due: 10 },
  // US-201 — inbox
  { id: "t13", ref: "TASK-301", projectId: "p2", storyId: "s5", title: "Notification inbox UI", description: "Grouped inbox with unread markers, filters and mark-all-as-read.", status: "in_progress", priority: "high", assigneeId: "u6", estimatedHours: 8, labels: ["frontend"], created: -29, updated: 0, due: 1 },
  { id: "t14", ref: "TASK-302", projectId: "p2", storyId: "s5", title: "Notification read-state API", description: "Endpoints to mark single and bulk notifications as read, idempotently.", status: "in_review", priority: "medium", assigneeId: "u3", estimatedHours: 5, labels: ["backend", "api"], created: -28, updated: -1, due: -1 },
  { id: "t15", ref: "TASK-303", projectId: "p2", storyId: "s5", title: "Unread badge polling", description: "Poll unread counts with backoff and pause polling when the tab is hidden.", status: "todo", priority: "low", assigneeId: "u7", estimatedHours: 4, labels: ["frontend"], created: -22, updated: -5, due: 5 },
  // US-202 — digest worker
  { id: "t16", ref: "TASK-304", projectId: "p2", storyId: "s6", title: "Digest scheduler job", description: "Background job that batches the previous day's events per user.", status: "todo", priority: "critical", assigneeId: "u3", estimatedHours: 12, labels: ["async", "backend"], created: -24, updated: -1, due: 2 },
  { id: "t17", ref: "TASK-305", projectId: "p2", storyId: "s6", title: "Email template rendering", description: "Digest email template with plain-text fallback and safe HTML escaping.", status: "backlog", priority: "medium", assigneeId: "u5", estimatedHours: 6, labels: ["email"], created: -23, updated: -4, due: 8 },
  { id: "t18", ref: "TASK-306", projectId: "p2", storyId: "s6", title: "Retry and dead-letter handling", description: "Exponential backoff for failed sends plus a dead-letter table for inspection.", status: "backlog", priority: "high", assigneeId: null, estimatedHours: 7, labels: ["async", "reliability"], created: -21, updated: -6, due: 12 },
  // US-203 — preferences
  { id: "t19", ref: "TASK-307", projectId: "p2", storyId: "s7", title: "Preferences form", description: "Per-event notification toggles for in-app and email channels.", status: "backlog", priority: "low", assigneeId: "u7", estimatedHours: 5, labels: ["frontend", "settings"], created: -17, updated: -4, due: 15 },
  { id: "t20", ref: "TASK-308", projectId: "p2", storyId: "s7", title: "Preference persistence API", description: "Store and read notification preferences with sensible defaults.", status: "backlog", priority: "low", assigneeId: "u3", estimatedHours: 4, labels: ["backend"], created: -16, updated: -5, due: 18 },
  // US-301 — exports
  { id: "t21", ref: "TASK-401", projectId: "p3", storyId: "s8", title: "CSV export generator", description: "Stream large report exports to CSV without loading all rows into memory.", status: "todo", priority: "high", assigneeId: "u4", estimatedHours: 9, labels: ["backend", "reporting"], created: -8, updated: -2, due: 5 },
  { id: "t22", ref: "TASK-402", projectId: "p3", storyId: "s8", title: "Schedule picker UI", description: "Cadence picker with timezone-aware preview of the next run.", status: "backlog", priority: "medium", assigneeId: "u5", estimatedHours: 6, labels: ["frontend"], created: -7, updated: -3, due: 11 },
  { id: "t23", ref: "TASK-403", projectId: "p3", storyId: "s8", title: "Export history view", description: "Table of past exports with status, size and re-download action.", status: "backlog", priority: "low", assigneeId: null, estimatedHours: 5, labels: ["frontend"], created: -6, updated: -3, due: 20 },
  // US-302 — integration
  { id: "t24", ref: "TASK-404", projectId: "p3", storyId: "s9", title: "Integration credential storage", description: "Encrypt integration secrets at rest and never return them to the client.", status: "backlog", priority: "high", assigneeId: "u7", estimatedHours: 8, labels: ["security", "integration"], created: -6, updated: -3, due: 14 },
  { id: "t25", ref: "TASK-405", projectId: "p3", storyId: "s9", title: "Sync worker with pagination", description: "Resumable sync worker that walks external pages and records a cursor.", status: "backlog", priority: "medium", assigneeId: "u3", estimatedHours: 10, labels: ["async", "integration"], created: -5, updated: -3, due: 21 },
  // US-303 — performance
  { id: "t26", ref: "TASK-406", projectId: "p3", storyId: "s10", title: "Add covering indexes", description: "Index the report query hot paths and document each index and its purpose.", status: "backlog", priority: "medium", assigneeId: "u4", estimatedHours: 4, labels: ["performance", "database"], created: -5, updated: -5, due: 16 },
  { id: "t27", ref: "TASK-407", projectId: "p3", storyId: "s10", title: "Slow query logging", description: "Log queries above the latency budget with sanitised parameters.", status: "backlog", priority: "low", assigneeId: "u7", estimatedHours: 3, labels: ["performance", "observability"], created: -4, updated: -4, due: 24 },
];

export const tasks: Task[] = taskSeeds.map(({ created, updated, due, completed, ...rest }) => ({
  ...rest,
  createdAt: day(created, 10),
  updatedAt: day(updated, 15),
  dueDate: due === null ? null : day(due, 17),
  completedAt: completed === undefined ? null : day(completed, 16),
}));

export const notifications: AppNotification[] = [
  {
    id: "n1",
    kind: "assignment",
    title: "TASK-204 was assigned to you",
    body: "Priya Raman assigned “Dashboard metrics API” to you in Atlas Platform.",
    read: false,
    createdAt: day(0, 7),
    link: "/projects/p1/board",
  },
  {
    id: "n2",
    kind: "due_soon",
    title: "TASK-205 is due tomorrow",
    body: "“Dashboard UI cards” is in review and due tomorrow.",
    read: false,
    createdAt: day(0, 6),
    link: "/projects/p1/board",
  },
  {
    id: "n3",
    kind: "update",
    title: "US-101 was updated",
    body: "Arun Mehta moved “User authentication” to Done.",
    read: false,
    createdAt: day(-1, 18),
    link: "/projects/p1/stories",
  },
  {
    id: "n4",
    kind: "milestone",
    title: "Atlas Platform reached 45% completion",
    body: "Seven of sixteen tasks are now complete for this project.",
    read: true,
    createdAt: day(-2, 12),
    link: "/projects/p1",
  },
  {
    id: "n5",
    kind: "due_soon",
    title: "TASK-302 is overdue",
    body: "“Notification read-state API” passed its due date yesterday.",
    read: true,
    createdAt: day(-1, 9),
    link: "/projects/p2/board",
  },
  {
    id: "n6",
    kind: "update",
    title: "Pulse Notifications due date changed",
    body: "Arun Mehta moved the project due date earlier by three days.",
    read: true,
    createdAt: day(-3, 15),
    link: "/projects/p2",
  },
];

export const activity: ActivityEvent[] = [
  { id: "a1", actorId: "u2", action: "status_changed", entityType: "task", entityId: "t3", entityRef: "TASK-203", entityTitle: "Session expiry handling", projectId: "p1", storyId: "s1", from: "in_progress", to: "done", createdAt: day(0, 8) },
  { id: "a2", actorId: "u1", action: "assigned", entityType: "task", entityId: "t4", entityRef: "TASK-204", entityTitle: "Dashboard metrics API", projectId: "p1", storyId: "s2", to: "u3", createdAt: day(0, 7) },
  { id: "a3", actorId: "u6", action: "status_changed", entityType: "task", entityId: "t13", entityRef: "TASK-301", entityTitle: "Notification inbox UI", projectId: "p2", storyId: "s5", from: "todo", to: "in_progress", createdAt: day(0, 6) },
  { id: "a4", actorId: "u4", action: "status_changed", entityType: "task", entityId: "t5", entityRef: "TASK-205", entityTitle: "Dashboard UI cards", projectId: "p1", storyId: "s2", from: "in_progress", to: "in_review", createdAt: day(-1, 17) },
  { id: "a5", actorId: "u2", action: "priority_changed", entityType: "task", entityId: "t16", entityRef: "TASK-304", entityTitle: "Digest scheduler job", projectId: "p2", storyId: "s6", from: "high", to: "critical", createdAt: day(-1, 14) },
  { id: "a6", actorId: "u1", action: "updated", entityType: "story", entityId: "s3", entityRef: "US-103", entityTitle: "Team member management", projectId: "p1", storyId: "s3", createdAt: day(-1, 11) },
  { id: "a7", actorId: "u7", action: "created", entityType: "task", entityId: "t27", entityRef: "TASK-407", entityTitle: "Slow query logging", projectId: "p3", storyId: "s10", createdAt: day(-4, 10) },
  { id: "a8", actorId: "u1", action: "created", entityType: "project", entityId: "p3", entityRef: "INS", entityTitle: "Insight Reporting", projectId: "p3", createdAt: day(-12, 9) },
  { id: "a9", actorId: "u5", action: "due_date_changed", entityType: "task", entityId: "t6", entityRef: "TASK-206", entityTitle: "Status distribution chart", projectId: "p1", storyId: "s2", from: "in 2 days", to: "in 4 days", createdAt: day(-2, 13) },
  { id: "a10", actorId: "u3", action: "status_changed", entityType: "task", entityId: "t14", entityRef: "TASK-302", entityTitle: "Notification read-state API", projectId: "p2", storyId: "s5", from: "in_progress", to: "in_review", createdAt: day(-1, 10) },
];
