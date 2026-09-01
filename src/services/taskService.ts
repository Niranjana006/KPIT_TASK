/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";
import type { ID, Task, TaskInput, WorkStatus } from "@/types";

export interface TaskQuery {
  storyId?: ID;
  projectId?: ID;
  assigneeId?: ID;
}

export function mapTask(data: any): Task {
  return {
    id: String(data.id),
    ref: String(data.ref),
    projectId: String(data.project_id),
    storyId: String(data.story_id),
    title: String(data.title),
    description: String(data.description),
    status: data.status as WorkStatus,
    priority: data.priority as Task["priority"],
    assigneeId: data.assignee_id ? String(data.assignee_id) : null,
    dueDate: data.due_date ? String(data.due_date) : null,
    estimatedHours: Number(data.estimated_hours),
    labels: Array.isArray(data.labels) ? data.labels.map(String) : [],
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
    completedAt: data.completed_at ? String(data.completed_at) : null,
  };
}

export function mapTaskInput(input: Partial<TaskInput>): any {
  const data: any = { ...input };
  if (input.projectId !== undefined) {
    data.project_id = input.projectId;
    delete data.projectId;
  }
  if (input.storyId !== undefined) {
    data.story_id = input.storyId;
    delete data.storyId;
  }
  if (input.assigneeId !== undefined) {
    data.assignee_id = input.assigneeId;
    delete data.assigneeId;
  }
  if (input.dueDate !== undefined) {
    data.due_date = input.dueDate;
    delete data.dueDate;
  }
  if (input.estimatedHours !== undefined) {
    data.estimated_hours = input.estimatedHours;
    delete data.estimatedHours;
  }
  return data;
}

/** GET /tasks?storyId=&projectId=&assigneeId= */
export async function getTasks(query: TaskQuery = {}): Promise<Task[]> {
  // If storyId is provided, we can fetch tasks directly
  if (query.storyId) {
    const data = await apiFetch<any[]>(`/api/stories/${query.storyId}/tasks`);
    let tasks = data.map(mapTask);
    if (query.projectId) tasks = tasks.filter((t) => t.projectId === query.projectId);
    if (query.assigneeId) tasks = tasks.filter((t) => t.assigneeId === query.assigneeId);
    return tasks;
  }

  // If projectId is provided but no storyId, fetch all stories for the project, then tasks for each story
  if (query.projectId) {
    const stories = await apiFetch<any[]>(`/api/projects/${query.projectId}/stories`);
    const tasksData = await Promise.all(
      stories.map((s) => apiFetch<any[]>(`/api/stories/${s.id}/tasks`)),
    );
    let tasks = tasksData.flat().map(mapTask);
    if (query.assigneeId) tasks = tasks.filter((t) => t.assigneeId === query.assigneeId);
    return tasks;
  }

  // If only assigneeId is provided (or no filters), fetch all projects, all stories, all tasks
  // (This handles the My Work page which needs all tasks assigned to the user)
  const projects = await apiFetch<any[]>(`/api/projects`);
  const storiesData = await Promise.all(
    projects.map((p) => apiFetch<any[]>(`/api/projects/${p.id}/stories`)),
  );
  const stories = storiesData.flat();
  const tasksData = await Promise.all(
    stories.map((s) => apiFetch<any[]>(`/api/stories/${s.id}/tasks`)),
  );
  let tasks = tasksData.flat().map(mapTask);
  
  if (query.assigneeId) {
    tasks = tasks.filter((t) => t.assigneeId === query.assigneeId);
  }
  return tasks;
}

/** GET /tasks/:id */
export async function getTask(id: ID): Promise<Task> {
  const data = await apiFetch<any>(`/api/tasks/${id}`);
  return mapTask(data);
}

/** POST /tasks */
export async function createTask(input: TaskInput): Promise<Task> {
  const data = await apiFetch<any>(`/api/stories/${input.storyId}/tasks`, {
    method: "POST",
    body: JSON.stringify(mapTaskInput(input)),
  });
  return mapTask(data);
}

/** PATCH /tasks/:id */
export async function updateTask(id: ID, patch: Partial<TaskInput>): Promise<Task> {
  const data = await apiFetch<any>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(mapTaskInput(patch)),
  });
  return mapTask(data);
}

/** PATCH /tasks/:id { status } — used by the board */
export const updateTaskStatus = (id: ID, status: WorkStatus) => updateTask(id, { status });

/** DELETE /tasks/:id */
export async function deleteTask(id: ID): Promise<void> {
  await apiFetch<void>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}
