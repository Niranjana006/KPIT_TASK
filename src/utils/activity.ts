import type { ActivityEvent, Priority, User, WorkStatus } from "@/types";
import { formatShortDate, priorityLabels, statusLabels } from "./format";

const isStatus = (value?: string | null): value is WorkStatus =>
  Boolean(value && value in statusLabels);

const isPriority = (value?: string | null): value is Priority =>
  Boolean(value && value in priorityLabels);

const readable = (value?: string | null, users: User[] = []) => {
  if (!value) return "unset";
  if (isStatus(value)) return statusLabels[value];
  if (isPriority(value)) return priorityLabels[value];
  const user = users.find((u) => u.id === value);
  if (user) return user.name;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return formatShortDate(value);
  return value;
};

/** Human sentence for an activity event, e.g. "moved TASK-203 to Done". */
export function describeActivity(event: ActivityEvent, users: User[] = []): string {
  const subject = event.entityType === "project" ? event.entityTitle : event.entityRef;
  switch (event.action) {
    case "created":
      return `created ${event.entityType === "project" ? "project" : subject}`;
    case "assigned":
      return `assigned ${subject} to ${readable(event.to, users)}`;
    case "status_changed":
      return `moved ${subject} from ${readable(event.from, users)} to ${readable(event.to, users)}`;
    case "priority_changed":
      return `changed ${subject} priority from ${readable(event.from, users)} to ${readable(event.to, users)}`;
    case "due_date_changed":
      return `changed the due date of ${subject} to ${readable(event.to, users)}`;
    case "deleted":
      return `deleted ${subject}`;
    case "commented":
      return `commented on ${subject}`;
    default:
      return `updated ${subject}`;
  }
}
