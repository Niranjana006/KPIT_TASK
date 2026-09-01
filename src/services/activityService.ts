/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";
import type { ActivityEvent, ID } from "@/types";

export interface ActivityQuery {
  projectId?: ID;
  entityId?: ID;
  limit?: number;
}

export function mapActivity(data: any): ActivityEvent {
  const details = data.details || {};
  return {
    id: String(data.id),
    projectId: String(data.project_id),
    actorId: String(data.actor_id),
    entityType: data.entity_type as ActivityEvent["entityType"],
    entityId: String(data.entity_id),
    action: data.action,
    entityRef: details.entity_ref || "",
    entityTitle: details.entity_title || "",
    storyId: details.story_id ? String(details.story_id) : null,
    from: details.from || null,
    to: details.to || null,
    createdAt: String(data.created_at),
  };
}

/** GET /api/activity or /api/projects/:projectId/activity */
export async function getActivity(query: ActivityQuery = {}): Promise<ActivityEvent[]> {
  const url = query.projectId ? `/api/projects/${query.projectId}/activity` : "/api/activity";
  const data = await apiFetch<any[]>(url);

  let events = data.map(mapActivity);

  if (query.entityId) {
    events = events.filter((e) => e.entityId === query.entityId);
  }

  if (query.limit) {
    events = events.slice(0, query.limit);
  }

  return events;
}
