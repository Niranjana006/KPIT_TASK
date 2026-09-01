import { apiFetch } from "./api";
import type { ID, Project, ProjectInput } from "@/types";

function mapProject(data: unknown): Project {
  const d = data as Record<string, unknown>;
  return {
    id: String(d.id),
    key: String(d.key),
    name: String(d.name),
    description: String(d.description),
    status: d.status as Project["status"],
    ownerId: String(d.owner_id),
    memberIds: Array.isArray(d.member_ids) ? d.member_ids.map(String) : [],
    startDate: d.start_date ? String(d.start_date) : "",
    dueDate: d.due_date ? String(d.due_date) : "",
    createdAt: String(d.created_at),
    updatedAt: String(d.updated_at),
  };
}

function mapProjectInput(input: Partial<ProjectInput>): Record<string, unknown> {
  const data: Record<string, unknown> = { ...input };
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
  const data = await apiFetch<unknown[]>("/api/projects");
  return data.map(mapProject);
}

/** GET /api/projects/:id */
export async function getProject(id: ID): Promise<Project> {
  const data = await apiFetch<unknown>(`/api/projects/${id}`);
  return mapProject(data);
}

/** POST /api/projects */
export async function createProject(input: ProjectInput): Promise<Project> {
  const data = await apiFetch<unknown>("/api/projects", {
    method: "POST",
    body: JSON.stringify(mapProjectInput(input)),
  });
  return mapProject(data);
}

/** PATCH /api/projects/:id */
export async function updateProject(id: ID, patch: Partial<ProjectInput>): Promise<Project> {
  const data = await apiFetch<unknown>(`/api/projects/${id}`, {
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
