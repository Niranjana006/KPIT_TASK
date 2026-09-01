import {
  activity as seedActivity,
  notifications as seedNotifications,
  projects as seedProjects,
  stories as seedStories,
  tasks as seedTasks,
  users as seedUsers,
} from "@/data/seed";
import type {
  ActivityAction,
  ActivityEvent,
  AppNotification,
  ID,
  Project,
  Task,
  User,
  UserStory,
} from "@/types";

/**
 * In-memory persistence layer.
 *
 * This module is the ONLY place that knows how data is stored. Every service
 * reads and writes through it, so swapping the mock layer for REST calls means
 * replacing the service bodies — not touching a single component.
 */
export interface DB {
  users: User[];
  projects: Project[];
  stories: UserStory[];
  tasks: Task[];
  notifications: AppNotification[];
  activity: ActivityEvent[];
}

export const db: DB = {
  users: [...seedUsers],
  projects: [...seedProjects],
  stories: [...seedStories],
  tasks: [...seedTasks],
  notifications: [...seedNotifications],
  activity: [...seedActivity],
};

/** Simulated network latency so loading states are real, not decorative. */
export const latency = (ms = 220) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

let counter = 1000;
export const nextId = (prefix: string): ID => `${prefix}${++counter}`;

export const now = () => new Date().toISOString();

export const clone = <T>(value: T): T =>
  typeof structuredClone === "function"
    ? structuredClone(value)
    : (JSON.parse(JSON.stringify(value)) as T);

export class NotFoundError extends Error {
  constructor(entity: string, id: string) {
    super(`${entity} “${id}” could not be found.`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export const nextRef = (prefix: string, existing: string[]) => {
  const numbers = existing
    .map((ref) => Number.parseInt(ref.split("-")[1] ?? "0", 10))
    .filter((n) => Number.isFinite(n));
  const max = numbers.length ? Math.max(...numbers) : 100;
  return `${prefix}-${max + 1}`;
};

export function recordActivity(
  event: Omit<ActivityEvent, "id" | "createdAt"> & { createdAt?: string },
): ActivityEvent {
  const entry: ActivityEvent = {
    id: nextId("a"),
    createdAt: event.createdAt ?? now(),
    ...event,
  };
  db.activity = [entry, ...db.activity];
  return entry;
}

export function pushNotification(notification: Omit<AppNotification, "id" | "createdAt">) {
  db.notifications = [{ id: nextId("n"), createdAt: now(), ...notification }, ...db.notifications];
}

export const actionLabels: Record<ActivityAction, string> = {
  created: "created",
  assigned: "assigned",
  status_changed: "changed status",
  priority_changed: "changed priority",
  due_date_changed: "changed the due date",
  updated: "updated",
  deleted: "deleted",
  commented: "commented on",
};
