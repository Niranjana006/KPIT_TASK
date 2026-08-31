import { format, formatDistanceToNowStrict, isPast, isToday, isTomorrow } from "date-fns";
import type { Priority, ProjectStatus, WorkStatus } from "@/types";

export const statusLabels: Record<WorkStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
};

export const workStatuses: WorkStatus[] = [
  "backlog",
  "todo",
  "in_progress",
  "in_review",
  "done",
];

export const priorityLabels: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export const priorities: Priority[] = ["low", "medium", "high", "critical"];

export const projectStatusLabels: Record<ProjectStatus, string> = {
  planning: "Planning",
  active: "Active",
  on_hold: "On Hold",
  completed: "Completed",
  archived: "Archived",
};

export const projectStatuses: ProjectStatus[] = [
  "planning",
  "active",
  "on_hold",
  "completed",
  "archived",
];

export const formatDate = (value?: string | null) =>
  value ? format(new Date(value), "d MMM yyyy") : "—";

export const formatShortDate = (value?: string | null) =>
  value ? format(new Date(value), "d MMM") : "—";

export const formatDateTime = (value?: string | null) =>
  value ? format(new Date(value), "d MMM yyyy, HH:mm") : "—";

export const formatRelative = (value: string) =>
  `${formatDistanceToNowStrict(new Date(value))} ago`;

export const dueLabel = (value?: string | null) => {
  if (!value) return "No due date";
  const date = new Date(value);
  if (isToday(date)) return "Due today";
  if (isTomorrow(date)) return "Due tomorrow";
  if (isPast(date)) return `Overdue · ${formatShortDate(value)}`;
  return `Due ${formatShortDate(value)}`;
};

export const isOverdue = (value: string | null | undefined, status: WorkStatus) =>
  Boolean(value) && status !== "done" && isPast(new Date(value as string));

export const toDateInput = (value?: string | null) =>
  value ? format(new Date(value), "yyyy-MM-dd") : "";

export const fromDateInput = (value: string) =>
  value ? new Date(`${value}T12:00:00.000Z`).toISOString() : "";

export const percent = (done: number, total: number) =>
  total === 0 ? 0 : Math.round((done / total) * 100);
