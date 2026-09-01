import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarClock, Clock, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { LabelList } from "@/components/common/LabelList";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { RelativeTime } from "@/components/common/RelativeTime";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/StateBlocks";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { errorMessage, useRefreshWorkspace, usersQuery } from "@/hooks/queries";
import { deleteTask, getTask, updateTask } from "@/services/taskService";
import { getStory } from "@/services/storyService";
import { getProject } from "@/services/projectService";
import { ActivityTimeline } from "@/features/activity/ActivityTimeline";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import { AssigneeSelect, PrioritySelect, StatusSelect } from "./InlineSelects";
import { useWorkItemDrawer } from "./context";
import type { Priority, TaskInput, WorkStatus } from "@/types";
import { dueLabel, formatDate, isOverdue } from "@/utils/format";

export function TaskDrawer({
  taskId,
  onOpenChange,
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const refresh = useRefreshWorkspace();
  const { openStory } = useWorkItemDrawer();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: task,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["tasks", "detail", taskId],
    queryFn: () => getTask(taskId as string),
    enabled: Boolean(taskId),
  });

  const { data: users = [] } = useQuery(usersQuery());
  const { data: story } = useQuery({
    queryKey: ["stories", "detail", task?.storyId],
    queryFn: () => getStory(task!.storyId),
    enabled: Boolean(task?.storyId),
  });
  const { data: project } = useQuery({
    queryKey: ["projects", task?.projectId],
    queryFn: () => getProject(task!.projectId),
    enabled: Boolean(task?.projectId),
  });

  const patch = useMutation({
    mutationFn: (input: Partial<TaskInput>) => updateTask(task!.id, input),
    onSuccess: (saved, input) => {
      refresh();
      const what = Object.keys(input)[0];
      toast.success(`${saved.ref} updated`, { description: `Changed ${what}.` });
    },
    onError: (err) => toast.error("Update failed", { description: errorMessage(err) }),
  });

  const remove = useMutation({
    mutationFn: () => deleteTask(task!.id),
    onSuccess: () => {
      refresh();
      toast.success(`${task?.ref} deleted`);
      setConfirmDelete(false);
      onOpenChange(false);
    },
    onError: (err) => toast.error("Delete failed", { description: errorMessage(err) }),
  });

  const assignee = users.find((u) => u.id === task?.assigneeId) ?? null;

  return (
    <>
      <Sheet open={Boolean(taskId)} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 scrollbar-slim sm:max-w-xl">
          {isPending ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error || !task ? (
            <div className="p-6">
              <ErrorState
                error={error ?? new Error("Task unavailable")}
                onRetry={() => refetch()}
              />
            </div>
          ) : (
            <>
              <SheetHeader className="gap-2 border-b border-border px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <span className="text-ref">{task.ref}</span>
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                </div>
                <SheetTitle className="text-xl leading-snug">{task.title}</SheetTitle>
                <SheetDescription asChild>
                  <p className="text-xs text-muted-foreground">
                    {project ? `${project.key} · ${project.name}` : "Loading project…"}
                    {story ? (
                      <>
                        {" › "}
                        <button
                          type="button"
                          onClick={() => openStory(story.id)}
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          {story.ref} {story.title}
                        </button>
                      </>
                    ) : null}
                  </p>
                </SheetDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setConfirmDelete(true)}
                  >
                    <Trash2 className="size-3.5" /> Delete
                  </Button>
                </div>
              </SheetHeader>

              <div className="space-y-6 p-6">
                <section>
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Description
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {task.description || "No description was added for this task."}
                  </p>
                </section>

                <Separator />

                <section className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="drawer-task-status"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Status
                    </label>
                    <StatusSelect
                      id="drawer-task-status"
                      value={task.status}
                      disabled={patch.isPending}
                      onChange={(status: WorkStatus) => patch.mutate({ status })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="drawer-task-priority"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Priority
                    </label>
                    <PrioritySelect
                      id="drawer-task-priority"
                      value={task.priority}
                      disabled={patch.isPending}
                      onChange={(priority: Priority) => patch.mutate({ priority })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="drawer-task-assignee"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Assignee
                    </label>
                    <AssigneeSelect
                      id="drawer-task-assignee"
                      value={task.assigneeId}
                      disabled={patch.isPending}
                      onChange={(assigneeId) => patch.mutate({ assigneeId })}
                    />
                    {assignee ? (
                      <p className="text-xs text-muted-foreground">{assignee.role}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-medium text-muted-foreground">Due date</span>
                    <p
                      className={
                        isOverdue(task.dueDate, task.status)
                          ? "flex items-center gap-1.5 text-sm font-medium text-destructive"
                          : "flex items-center gap-1.5 text-sm text-foreground"
                      }
                    >
                      <CalendarClock className="size-3.5" aria-hidden />
                      {dueLabel(task.dueDate)}
                    </p>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="size-3" aria-hidden /> {task.estimatedHours}h estimated
                    </p>
                  </div>
                </section>

                {task.labels.length ? (
                  <section>
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Labels
                    </h3>
                    <LabelList labels={task.labels} className="mt-2" />
                  </section>
                ) : null}

                <Separator />

                <section className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                  <p>
                    Created <RelativeTime value={task.createdAt} />
                  </p>
                  <p>
                    Updated <RelativeTime value={task.updatedAt} />
                  </p>
                  {task.completedAt ? <p>Completed {formatDate(task.completedAt)}</p> : null}
                </section>

                <Separator />

                <section>
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Activity
                  </h3>
                  <ActivityTimeline
                    entityId={task.id}
                    emptyLabel="Changes to this task will appear here."
                  />
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {task ? (
        <>
          <TaskFormDialog open={editing} onOpenChange={setEditing} task={task} />
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            destructive
            loading={remove.isPending}
            title={`Delete ${task.ref}?`}
            confirmLabel="Delete task"
            description={
              <>
                <strong className="text-foreground">{task.title}</strong> will be removed from{" "}
                {story?.ref ?? "its story"}. This can’t be undone.
              </>
            }
            onConfirm={() => remove.mutate()}
          />
        </>
      ) : null}
    </>
  );
}
