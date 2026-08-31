import { useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { errorMessage, useRefreshWorkspace } from "@/hooks/queries";
import { cn } from "@/lib/utils";
import { updateTaskStatus } from "@/services/taskService";
import { TaskCard } from "@/features/tasks/TaskCard";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import type { Task, WorkStatus } from "@/types";
import { statusLabels, workStatuses } from "@/utils/format";

const columnAccent: Record<WorkStatus, string> = {
  backlog: "bg-status-backlog",
  todo: "bg-status-todo",
  in_progress: "bg-status-progress",
  in_review: "bg-status-review",
  done: "bg-status-done",
};

export function KanbanBoard({
  tasks,
  projectId,
}: {
  tasks: Task[];
  projectId: string;
}) {
  const refresh = useRefreshWorkspace();
  const [dragOver, setDragOver] = useState<WorkStatus | null>(null);
  const [addTaskOpen, setAddTaskOpen] = useState(false);

  const move = useMutation({
    mutationFn: ({ id, status }: { id: string; status: WorkStatus }) =>
      updateTaskStatus(id, status),
    onSuccess: (task) => {
      refresh();
      toast.success(`${task.ref} moved to ${statusLabels[task.status]}`);
    },
    onError: (error) => toast.error("Couldn’t move task", { description: errorMessage(error) }),
  });

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-slim">
        {workStatuses.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <section
              key={status}
              aria-label={statusLabels[status]}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver((current) => (current === status ? null : current))}
              onDrop={(event) => {
                event.preventDefault();
                setDragOver(null);
                const id = event.dataTransfer.getData("text/plain");
                const task = tasks.find((t) => t.id === id);
                if (task && task.status !== status) move.mutate({ id, status });
              }}
              className={cn(
                "flex w-[272px] shrink-0 flex-col rounded-lg border border-border bg-surface-raised/70",
                dragOver === status && "border-ring bg-accent/40",
              )}
            >
              <header className="flex items-center gap-2 border-b border-border px-3 py-2.5">
                <span className={cn("size-2 rounded-full", columnAccent[status])} aria-hidden />
                <h3 className="text-sm font-semibold text-foreground">{statusLabels[status]}</h3>
                <span className="ml-auto rounded bg-surface px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
                  {columnTasks.length}
                </span>
              </header>

              <div className="flex-1 space-y-2 p-2">
                {columnTasks.map((task) => (
                  <div key={task.id} className="space-y-1.5">
                    <TaskCard task={task} draggable />
                    <label className="sr-only" htmlFor={`move-${task.id}`}>
                      Move {task.ref} to another column
                    </label>
                    <Select
                      value={task.status}
                      disabled={move.isPending}
                      onValueChange={(value) =>
                        move.mutate({ id: task.id, status: value as WorkStatus })
                      }
                    >
                      <SelectTrigger
                        id={`move-${task.id}`}
                        className="h-7 w-full border-dashed bg-transparent text-xs text-muted-foreground"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {workStatuses.map((option) => (
                          <SelectItem key={option} value={option}>
                            Move to {statusLabels[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                {!columnTasks.length ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                    Drop tasks here
                  </p>
                ) : null}

                {status === "backlog" ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-muted-foreground"
                    onClick={() => setAddTaskOpen(true)}
                  >
                    <Plus className="size-3.5" /> Add task
                  </Button>
                ) : null}
              </div>
            </section>
          );
        })}
      </div>
      <TaskFormDialog open={addTaskOpen} onOpenChange={setAddTaskOpen} projectId={projectId} />
    </>
  );
}
