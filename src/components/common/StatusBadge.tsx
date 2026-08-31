import { cn } from "@/lib/utils";
import type { ProjectStatus, WorkStatus } from "@/types";
import { projectStatusLabels, statusLabels } from "@/utils/format";

const workStyles: Record<WorkStatus, string> = {
  backlog: "border-status-backlog/30 text-status-backlog bg-status-backlog/8",
  todo: "border-status-todo/30 text-status-todo bg-status-todo/8",
  in_progress: "border-status-progress/35 text-status-progress bg-status-progress/10",
  in_review: "border-status-review/35 text-status-review bg-status-review/10",
  done: "border-status-done/35 text-status-done bg-status-done/10",
};

const projectStyles: Record<ProjectStatus, string> = {
  planning: "border-status-todo/30 text-status-todo bg-status-todo/8",
  active: "border-status-done/35 text-status-done bg-status-done/10",
  on_hold: "border-status-review/35 text-status-review bg-status-review/10",
  completed: "border-status-progress/35 text-status-progress bg-status-progress/10",
  archived: "border-border text-muted-foreground bg-muted",
};

const base =
  "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap";

export function StatusBadge({
  status,
  className,
  showDot = true,
}: {
  status: WorkStatus;
  className?: string;
  showDot?: boolean;
}) {
  return (
    <span className={cn(base, workStyles[status], className)}>
      {showDot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {statusLabels[status]}
    </span>
  );
}

export function ProjectStatusBadge({
  status,
  className,
}: {
  status: ProjectStatus;
  className?: string;
}) {
  return (
    <span className={cn(base, projectStyles[status], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {projectStatusLabels[status]}
    </span>
  );
}
