export type ID = string;

export type ProjectStatus = "planning" | "active" | "on_hold" | "completed" | "archived";

export type WorkStatus = "backlog" | "todo" | "in_progress" | "in_review" | "done";

export type Priority = "low" | "medium" | "high" | "critical";

export type Role = "Product Owner" | "Scrum Master" | "Engineer" | "Designer" | "QA Engineer";

export interface User {
  id: ID;
  name: string;
  email: string;
  role: Role;
  initials: string;
  color: string;
}

export interface Project {
  id: ID;
  key: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: ID;
  memberIds: ID[];
  startDate: string;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserStory {
  id: ID;
  ref: string;
  projectId: ID;
  title: string;
  description: string;
  acceptanceCriteria: string[];
  status: WorkStatus;
  priority: Priority;
  assigneeId: ID | null;
  storyPoints: number;
  sprint: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: ID;
  ref: string;
  projectId: ID;
  storyId: ID;
  title: string;
  description: string;
  status: WorkStatus;
  priority: Priority;
  assigneeId: ID | null;
  dueDate: string | null;
  estimatedHours: number;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export type NotificationKind = "assignment" | "update" | "due_soon" | "milestone";

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export type ActivityAction =
  | "created"
  | "assigned"
  | "status_changed"
  | "priority_changed"
  | "due_date_changed"
  | "updated"
  | "deleted"
  | "commented";

export interface ActivityEvent {
  id: ID;
  actorId: ID;
  action: ActivityAction;
  entityType: "project" | "story" | "task";
  entityId: ID;
  entityRef: string;
  entityTitle: string;
  projectId: ID | null;
  storyId?: ID | null;
  from?: string | null;
  to?: string | null;
  createdAt: string;
}

/* ---------- payloads (mirror future REST bodies) ---------- */

export type ProjectInput = Pick<
  Project,
  "name" | "key" | "description" | "status" | "ownerId" | "startDate" | "dueDate"
>;

export type StoryInput = Pick<
  UserStory,
  | "projectId"
  | "title"
  | "description"
  | "acceptanceCriteria"
  | "status"
  | "priority"
  | "assigneeId"
  | "storyPoints"
  | "sprint"
  | "labels"
>;

export type TaskInput = Pick<
  Task,
  | "projectId"
  | "storyId"
  | "title"
  | "description"
  | "status"
  | "priority"
  | "assigneeId"
  | "dueDate"
  | "estimatedHours"
  | "labels"
>;
