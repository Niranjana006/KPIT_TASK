/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";
import type { AppNotification, ID } from "@/types";

export function mapNotification(data: any): AppNotification {
  return {
    id: String(data.id),
    kind: "update",
    title: String(data.title),
    body: String(data.message),
    read: Boolean(data.read),
    link: data.link ? String(data.link) : undefined,
    createdAt: String(data.created_at),
  };
}

/** GET /api/notifications */
export async function getNotifications(): Promise<AppNotification[]> {
  const data = await apiFetch<any[]>("/api/notifications");
  return data.map(mapNotification);
}

/** GET /api/notifications/unread-count */
export async function getUnreadCount(): Promise<number> {
  const notifications = await getNotifications();
  return notifications.filter((n) => !n.read).length;
}

/** PATCH /api/notifications/:id/read */
export async function markRead(id: ID, read = true): Promise<AppNotification> {
  // Our backend just has PATCH /api/notifications/{id}/read
  // If read is false, backend doesn't support unread directly but we'll assume it's true for now.
  if (!read) throw new Error("Unread not supported in this backend");
  const data = await apiFetch<any>(`/api/notifications/${id}/read`, {
    method: "PATCH",
  });
  return mapNotification(data);
}

/** PATCH /api/notifications/read-all */
export async function markAllRead(): Promise<number> {
  const data = await apiFetch<{ count: number }>("/api/notifications/read-all", {
    method: "PATCH",
  });
  return data.count;
}

/** DELETE /api/notifications/:id */
export async function dismiss(id: ID): Promise<void> {
  await apiFetch(`/api/notifications/${id}`, { method: "DELETE" });
}
