import {
  NotFoundError,
  ValidationError,
  clone,
  db,
  latency,
  nextId,
  nextRef,
  now,
  pushNotification,
  recordActivity,
} from "./store";
import { CURRENT_USER_ID } from "@/data/seed";
import type { ID, Task, TaskInput, WorkStatus } from "@/types";

export interface TaskQuery {
  storyId?: ID;
  projectId?: ID;
  assigneeId?: ID;
}

/** GET /tasks?storyId=&projectId=&assigneeId= */
export async function getTasks(query: TaskQuery = {}): Promise<Task[]> {
  await latency();
  const rows = db.tasks.filter(
    (t) =>
      (!query.storyId || t.storyId === query.storyId) &&
      (!query.projectId || t.projectId === query.projectId) &&
      (!query.assigneeId || t.assigneeId === query.assigneeId),
  );
  return clone(rows);
}

/** GET /tasks/:id */
export async function getTask(id: ID): Promise<Task> {
  await latency(140);
  const task = db.tasks.find((t) => t.id === id);
  if (!task) throw new NotFoundError("Task", id);
  return clone(task);
}

function validate(input: Pick<TaskInput, "title" | "storyId" | "estimatedHours">) {
  if (!input.title.trim()) throw new ValidationError("Task title is required.");
  if (!input.storyId) throw new ValidationError("A task must belong to a user story.");
  if (input.estimatedHours < 0 || input.estimatedHours > 200)
    throw new ValidationError("Estimated hours must be between 0 and 200.");
}

/** POST /tasks */
export async function createTask(input: TaskInput): Promise<Task> {
  await latency(320);
  validate(input);
  const story = db.stories.find((s) => s.id === input.storyId);
  if (!story) throw new NotFoundError("User story", input.storyId);
  const timestamp = now();
  const task: Task = {
    id: nextId("t"),
    ref: nextRef(
      "TASK",
      db.tasks.filter((t) => t.projectId === story.projectId).map((t) => t.ref),
    ),
    ...input,
    projectId: story.projectId,
    labels: input.labels.filter((l) => l.trim().length > 0),
    completedAt: input.status === "done" ? timestamp : null,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.tasks = [task, ...db.tasks];
  recordActivity({
    actorId: CURRENT_USER_ID,
    action: "created",
    entityType: "task",
    entityId: task.id,
    entityRef: task.ref,
    entityTitle: task.title,
    projectId: task.projectId,
    storyId: task.storyId,
  });
  if (task.assigneeId && task.assigneeId === CURRENT_USER_ID) {
    pushNotification({
      kind: "assignment",
      title: `${task.ref} was assigned to you`,
      body: `“${task.title}” was assigned to you.`,
      read: false,
      link: `/projects/${task.projectId}/board`,
    });
  }
  return clone(task);
}

/** PATCH /tasks/:id */
export async function updateTask(id: ID, patch: Partial<TaskInput>): Promise<Task> {
  await latency(240);
  const current = db.tasks.find((t) => t.id === id);
  if (!current) throw new NotFoundError("Task", id);
  const merged: Task = { ...current, ...patch, updatedAt: now() };
  if (patch.status) {
    merged.completedAt = patch.status === "done" ? now() : null;
  }
  validate(merged);
  db.tasks = db.tasks.map((t) => (t.id === id ? merged : t));

  const action =
    patch.status && patch.status !== current.status
      ? "status_changed"
      : patch.priority && patch.priority !== current.priority
        ? "priority_changed"
        : patch.assigneeId !== undefined && patch.assigneeId !== current.assigneeId
          ? "assigned"
          : patch.dueDate !== undefined && patch.dueDate !== current.dueDate
            ? "due_date_changed"
            : "updated";

  recordActivity({
    actorId: CURRENT_USER_ID,
    action,
    entityType: "task",
    entityId: merged.id,
    entityRef: merged.ref,
    entityTitle: merged.title,
    projectId: merged.projectId,
    storyId: merged.storyId,
    from:
      action === "status_changed"
        ? current.status
        : action === "priority_changed"
          ? current.priority
          : action === "due_date_changed"
            ? current.dueDate
            : null,
    to:
      action === "status_changed"
        ? merged.status
        : action === "priority_changed"
          ? merged.priority
          : action === "due_date_changed"
            ? merged.dueDate
            : action === "assigned"
              ? merged.assigneeId
              : null,
  });

  if (action === "assigned" && merged.assigneeId === CURRENT_USER_ID) {
    pushNotification({
      kind: "assignment",
      title: `${merged.ref} was assigned to you`,
      body: `“${merged.title}” is now assigned to you.`,
      read: false,
      link: `/projects/${merged.projectId}/board`,
    });
  }
  return clone(merged);
}

/** PATCH /tasks/:id { status } — used by the board */
export const updateTaskStatus = (id: ID, status: WorkStatus) => updateTask(id, { status });

/** DELETE /tasks/:id */
export async function deleteTask(id: ID): Promise<void> {
  await latency(240);
  const task = db.tasks.find((t) => t.id === id);
  if (!task) throw new NotFoundError("Task", id);
  db.tasks = db.tasks.filter((t) => t.id !== id);
  recordActivity({
    actorId: CURRENT_USER_ID,
    action: "deleted",
    entityType: "task",
    entityId: task.id,
    entityRef: task.ref,
    entityTitle: task.title,
    projectId: task.projectId,
    storyId: task.storyId,
  });
}
