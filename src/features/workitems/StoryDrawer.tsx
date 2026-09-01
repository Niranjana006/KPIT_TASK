import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ListTree, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { LabelList } from "@/components/common/LabelList";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { RelativeTime } from "@/components/common/RelativeTime";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState } from "@/components/common/StateBlocks";
import { UserAvatar } from "@/components/common/UserAvatar";
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
import { errorMessage, tasksQuery, useRefreshWorkspace, usersQuery } from "@/hooks/queries";
import { getProject } from "@/services/projectService";
import { deleteStory, getStory, updateStory } from "@/services/storyService";
import { ActivityTimeline } from "@/features/activity/ActivityTimeline";
import { StoryFormDialog } from "@/features/stories/StoryFormDialog";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import { AssigneeSelect, PrioritySelect, StatusSelect } from "./InlineSelects";
import { useWorkItemDrawer } from "./context";
import type { StoryInput } from "@/types";
import { dueLabel } from "@/utils/format";

export function StoryDrawer({
  storyId,
  projectId,
  onOpenChange,
}: {
  storyId: string | null;
  projectId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const refresh = useRefreshWorkspace();
  const { openTask } = useWorkItemDrawer();
  const [editing, setEditing] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const {
    data: story,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stories", "detail", storyId],
    queryFn: () => getStory(projectId as string, storyId as string),
    enabled: Boolean(storyId && projectId),
  });

  const { data: users = [] } = useQuery(usersQuery());
  const { data: project } = useQuery({
    queryKey: ["projects", story?.projectId],
    queryFn: () => getProject(story!.projectId),
    enabled: Boolean(story?.projectId),
  });
  const { data: tasks = [] } = useQuery({
    ...tasksQuery({ storyId: story?.id }),
    enabled: Boolean(story?.id),
  });

  const patch = useMutation({
    mutationFn: (input: Partial<StoryInput>) => updateStory(story!.projectId, story!.id, input),
    onSuccess: (saved, input) => {
      refresh();
      toast.success(`${saved.ref} updated`, {
        description: `Changed ${Object.keys(input)[0]}.`,
      });
    },
    onError: (err) => toast.error("Update failed", { description: errorMessage(err) }),
  });

  const remove = useMutation({
    mutationFn: () => deleteStory(story!.projectId, story!.id),
    onSuccess: ({ deletedTasks }) => {
      refresh();
      toast.success(`${story?.ref} deleted`, {
        description: deletedTasks
          ? `${deletedTasks} task${deletedTasks === 1 ? "" : "s"} were removed with it.`
          : undefined,
      });
      setConfirmDelete(false);
      onOpenChange(false);
    },
    onError: (err) => toast.error("Delete failed", { description: errorMessage(err) }),
  });

  const doneTasks = tasks.filter((t) => t.status === "done").length;

  return (
    <>
      <Sheet open={Boolean(storyId)} onOpenChange={onOpenChange}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 scrollbar-slim sm:max-w-xl">
          {isPending ? (
            <div className="space-y-4 p-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-7 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : error || !story ? (
            <div className="p-6">
              <ErrorState
                error={error ?? new Error("Story unavailable")}
                onRetry={() => refetch()}
              />
            </div>
          ) : (
            <>
              <SheetHeader className="gap-2 border-b border-border px-6 pt-6 pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-ref">{story.ref}</span>
                  <StatusBadge status={story.status} />
                  <PriorityBadge priority={story.priority} />
                  <span className="rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground">
                    {story.storyPoints} pts · {story.sprint}
                  </span>
                </div>
                <SheetTitle className="text-xl leading-snug">{story.title}</SheetTitle>
                <SheetDescription asChild>
                  <p className="text-xs text-muted-foreground">
                    {project ? `${project.key} · ${project.name}` : "Loading project…"} ·{" "}
                    {doneTasks}/{tasks.length} tasks complete
                  </p>
                </SheetDescription>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil className="size-3.5" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setAddingTask(true)}>
                    <Plus className="size-3.5" /> Add task
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
                    Story
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {story.description}
                  </p>
                </section>

                <section>
                  <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Acceptance criteria
                  </h3>
                  {story.acceptanceCriteria.length ? (
                    <ul className="mt-2 space-y-1.5">
                      {story.acceptanceCriteria.map((criterion) => (
                        <li key={criterion} className="flex gap-2 text-sm text-foreground">
                          <CheckCircle2
                            className="mt-0.5 size-3.5 shrink-0 text-status-done"
                            aria-hidden
                          />
                          {criterion}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No acceptance criteria captured yet.
                    </p>
                  )}
                </section>

                <Separator />

                <section className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="drawer-story-status"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Status
                    </label>
                    <StatusSelect
                      id="drawer-story-status"
                      value={story.status}
                      disabled={patch.isPending}
                      onChange={(status) => patch.mutate({ status })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="drawer-story-priority"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Priority
                    </label>
                    <PrioritySelect
                      id="drawer-story-priority"
                      value={story.priority}
                      disabled={patch.isPending}
                      onChange={(priority) => patch.mutate({ priority })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label
                      htmlFor="drawer-story-assignee"
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Assignee
                    </label>
                    <AssigneeSelect
                      id="drawer-story-assignee"
                      value={story.assigneeId}
                      disabled={patch.isPending}
                      onChange={(assigneeId) => patch.mutate({ assigneeId })}
                    />
                  </div>
                </section>

                {story.labels.length ? <LabelList labels={story.labels} /> : null}

                <Separator />

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Tasks ({tasks.length})
                    </h3>
                  </div>
                  {tasks.length ? (
                    <ul className="space-y-2">
                      {tasks.map((task) => (
                        <li key={task.id}>
                          <button
                            type="button"
                            onClick={() => openTask(task.id)}
                            className="flex w-full items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-ring/40 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            <span className="text-ref shrink-0">{task.ref}</span>
                            <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                              {task.title}
                            </span>
                            <PriorityBadge priority={task.priority} withLabel={false} />
                            <StatusBadge status={task.status} showDot={false} />
                            <UserAvatar
                              user={users.find((u) => u.id === task.assigneeId)}
                              size="xs"
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={ListTree}
                      title="No tasks yet"
                      description="Break this story into tasks so the work can be tracked on the board."
                      action={
                        <Button size="sm" onClick={() => setAddingTask(true)}>
                          <Plus className="size-3.5" /> Add task
                        </Button>
                      }
                      className="py-8"
                    />
                  )}
                </section>

                <section className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>
                    Created <RelativeTime value={story.createdAt} />
                  </p>
                  <p>
                    Updated <RelativeTime value={story.updatedAt} />
                  </p>
                  <p className="col-span-2">
                    Earliest task deadline:{" "}
                    {dueLabel(
                      tasks
                        .filter((t) => t.dueDate && t.status !== "done")
                        .map((t) => t.dueDate as string)
                        .sort()[0] ?? null,
                    )}
                  </p>
                </section>

                <Separator />

                <section>
                  <h3 className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Activity
                  </h3>
                  <ActivityTimeline
                    entityId={story.id}
                    emptyLabel="Changes to this story will appear here."
                  />
                </section>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {story ? (
        <>
          <StoryFormDialog open={editing} onOpenChange={setEditing} story={story} />
          <TaskFormDialog
            open={addingTask}
            onOpenChange={setAddingTask}
            projectId={story.projectId}
            storyId={story.id}
          />
          <ConfirmDialog
            open={confirmDelete}
            onOpenChange={setConfirmDelete}
            destructive
            loading={remove.isPending}
            title={`Delete ${story.ref}?`}
            confirmLabel="Delete story and tasks"
            description={
              <>
                <strong className="text-foreground">{story.title}</strong> and its {tasks.length}{" "}
                task{tasks.length === 1 ? "" : "s"} will be permanently removed.
              </>
            }
            onConfirm={() => remove.mutate()}
          />
        </>
      ) : null}
    </>
  );
}
