import { NotFoundError, clone, db, latency } from "./store";
import type { AppNotification, ID } from "@/types";

/** GET /notifications */
export async function getNotifications(): Promise<AppNotification[]> {
  await latency(200);
  return clone(db.notifications);
}

/** GET /notifications/unread-count */
export async function getUnreadCount(): Promise<number> {
  await latency(80);
  return db.notifications.filter((n) => !n.read).length;
}

/** PATCH /notifications/:id { read } */
export async function markRead(id: ID, read = true): Promise<AppNotification> {
  await latency(140);
  const found = db.notifications.find((n) => n.id === id);
  if (!found) throw new NotFoundError("Notification", id);
  db.notifications = db.notifications.map((n) => (n.id === id ? { ...n, read } : n));
  return clone({ ...found, read });
}

/** POST /notifications/mark-all-read */
export async function markAllRead(): Promise<number> {
  await latency(200);
  const count = db.notifications.filter((n) => !n.read).length;
  db.notifications = db.notifications.map((n) => ({ ...n, read: true }));
  return count;
}

/** DELETE /notifications/:id */
export async function dismiss(id: ID): Promise<void> {
  await latency(140);
  db.notifications = db.notifications.filter((n) => n.id !== id);
}
