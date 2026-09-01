/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";
import type { ID, Project, ProjectInput } from "@/types";

export function mapProject(data: any): Project {
  return {
    id: String(data.id),
    key: String(data.key),
    name: String(data.name),
    description: String(data.description),
    status: data.status as Project["status"],
    ownerId: String(data.owner_id),
    memberIds: Array.isArray(data.member_ids) ? data.member_ids.map(String) : [],
    startDate: data.start_date ? String(data.start_date) : "",
    dueDate: data.due_date ? String(data.due_date) : "",
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

export function mapProjectInput(input: Partial<ProjectInput>): any {
  const data: any = { ...input };
  if (input.ownerId !== undefined) {
    data.owner_id = input.ownerId;
    delete data.ownerId;
  }
  if (input.startDate !== undefined) {
    data.start_date = input.startDate;
    delete data.startDate;
  }
  if (input.dueDate !== undefined) {
    data.due_date = input.dueDate;
    delete data.dueDate;
  }
  return data;
}

/** GET /api/projects */
export async function getProjects(): Promise<Project[]> {
  const data = await apiFetch<any[]>("/api/projects");
  return data.map(mapProject);
}

/** GET /api/projects/:id */
export async function getProject(id: ID): Promise<Project> {
  const data = await apiFetch<any>(`/api/projects/${id}`);
  return mapProject(data);
}

/** POST /api/projects */
export async function createProject(input: ProjectInput): Promise<Project> {
  const data = await apiFetch<any>("/api/projects", {
    method: "POST",
    body: JSON.stringify(mapProjectInput(input)),
  });
  return mapProject(data);
}

/** PATCH /api/projects/:id */
export async function updateProject(id: ID, patch: Partial<ProjectInput>): Promise<Project> {
  const data = await apiFetch<any>(`/api/projects/${id}`, {
    method: "PATCH",
    body: JSON.stringify(mapProjectInput(patch)),
  });
  return mapProject(data);
}

/** DELETE /api/projects/:id */
export async function deleteProject(id: ID): Promise<void> {
  return apiFetch<void>(`/api/projects/${id}`, {
    method: "DELETE",
  });
}
