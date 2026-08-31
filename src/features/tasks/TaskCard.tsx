import { useQuery } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";

import { LabelList } from "@/components/common/LabelList";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { storiesQuery, usersQuery } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import type { Task } from "@/types";
import { dueLabel, isOverdue } from "@/utils/format";
import { useWorkItemDrawer } from "@/features/workitems/context";

export function TaskCard({
  task,
  className,
  draggable = false,
  onDragStart,
}: {
  task: Task;
  className?: string;
  draggable?: boolean;
  onDragStart?: (task: Task) => void;
}) {
  const { openTask } = useWorkItemDrawer();
  const { data: users = [] } = useQuery(usersQuery());
  const { data: stories = [] } = useQuery(storiesQuery(task.projectId));
  const story = stories.find((s) => s.id === task.storyId);
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <article
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", task.id);
        event.dataTransfer.effectAllowed = "move";
        onDragStart?.(task);
      }}
      className={cn(
        "panel group cursor-pointer p-3 transition-colors hover:border-ring/40 hover:bg-surface-raised",
        draggable && "active:cursor-grabbing",
        className,
      )}
      onClick={() => openTask(task.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openTask(task.id);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`${task.ref}: ${task.title}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-ref">{task.ref}</span>
        <PriorityBadge priority={task.priority} withLabel={false} />
      </div>
      <h4 className="mt-1.5 text-sm leading-snug font-medium text-foreground">{task.title}</h4>
      {story ? (
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {story.ref} · {story.title}
        </p>
      ) : null}
      <LabelList labels={task.labels} max={2} className="mt-2" />
      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px]",
            overdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          <CalendarClock className="size-3" aria-hidden />
          {dueLabel(task.dueDate)}
        </span>
        <UserAvatar user={users.find((u) => u.id === task.assigneeId)} size="xs" />
      </div>
    </article>
  );
}
