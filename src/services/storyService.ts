/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";
import type { ID, StoryInput, UserStory } from "@/types";

export function mapStory(data: any): UserStory {
  return {
    id: String(data.id),
    ref: String(data.ref),
    projectId: String(data.project_id),
    title: String(data.title),
    description: String(data.description),
    acceptanceCriteria: Array.isArray(data.acceptance_criteria)
      ? data.acceptance_criteria.map(String)
      : [],
    status: data.status as UserStory["status"],
    priority: data.priority as UserStory["priority"],
    assigneeId: data.assignee_id ? String(data.assignee_id) : null,
    storyPoints: Number(data.story_points),
    sprint: String(data.sprint),
    labels: Array.isArray(data.labels) ? data.labels.map(String) : [],
    createdAt: String(data.created_at),
    updatedAt: String(data.updated_at),
  };
}

export function mapStoryInput(input: Partial<StoryInput>): any {
  const data: any = { ...input };
  if (input.projectId !== undefined) {
    data.project_id = input.projectId;
    delete data.projectId;
  }
  if (input.acceptanceCriteria !== undefined) {
    data.acceptance_criteria = input.acceptanceCriteria;
    delete data.acceptanceCriteria;
  }
  if (input.assigneeId !== undefined) {
    data.assignee_id = input.assigneeId;
    delete data.assigneeId;
  }
  if (input.storyPoints !== undefined) {
    data.story_points = input.storyPoints;
    delete data.storyPoints;
  }
  return data;
}

/** GET /api/projects/:projectId/stories */
export async function getStories(projectId?: ID): Promise<UserStory[]> {
  if (!projectId) return [];
  const data = await apiFetch<any[]>(`/api/projects/${projectId}/stories`);
  return data.map(mapStory);
}

/** GET /api/projects/:projectId/stories/:id */
export async function getStory(projectId: ID, id: ID): Promise<UserStory> {
  const data = await apiFetch<any>(`/api/projects/${projectId}/stories/${id}`);
  return mapStory(data);
}

/** POST /api/projects/:projectId/stories */
export async function createStory(input: StoryInput): Promise<UserStory> {
  const data = await apiFetch<any>(`/api/projects/${input.projectId}/stories`, {
    method: "POST",
    body: JSON.stringify(mapStoryInput(input)),
  });
  return mapStory(data);
}

/** PATCH /api/projects/:projectId/stories/:id */
export async function updateStory(
  projectId: ID,
  id: ID,
  patch: Partial<StoryInput>,
): Promise<UserStory> {
  const data = await apiFetch<any>(`/api/projects/${projectId}/stories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(mapStoryInput(patch)),
  });
  return mapStory(data);
}

/** DELETE /api/projects/:projectId/stories/:id */
export async function deleteStory(projectId: ID, id: ID): Promise<{ deletedTasks?: number }> {
  await apiFetch<void>(`/api/projects/${projectId}/stories/${id}`, {
    method: "DELETE",
  });
  return { deletedTasks: 0 }; // The backend cascades and deletes tasks natively
}
