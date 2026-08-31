import { clone, db, latency } from "./store";
import type { ActivityEvent, ID } from "@/types";

export interface ActivityQuery {
  projectId?: ID;
  entityId?: ID;
  limit?: number;
}

/** GET /activity?projectId=&entityId=&limit= */
export async function getActivity(query: ActivityQuery = {}): Promise<ActivityEvent[]> {
  await latency(180);
  const rows = db.activity
    .filter(
      (a) =>
        (!query.projectId || a.projectId === query.projectId) &&
        (!query.entityId || a.entityId === query.entityId),
    )
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return clone(query.limit ? rows.slice(0, query.limit) : rows);
}
