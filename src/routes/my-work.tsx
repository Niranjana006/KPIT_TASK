import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CircleCheck, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/common/PageHeader";
import { ErrorState, RowSkeleton } from "@/components/common/StateBlocks";
import { Button } from "@/components/ui/button";
import { TaskCard } from "@/features/tasks/TaskCard";
import { TaskFormDialog } from "@/features/tasks/TaskFormDialog";
import { currentUserQuery, tasksQuery } from "@/hooks/queries";
import { statusLabels, workStatuses } from "@/utils/format";

export const Route = createFileRoute("/my-work")({
  head: () => ({
    meta: [
      { title: "My Work — FlowForge" },
      {
        name: "description",
        content: "Every task assigned to you, grouped by status and ordered by due date.",
      },
      { property: "og:title", content: "My Work — FlowForge" },
      {
        property: "og:description",
        content: "Your personal queue across all projects in the workspace.",
      },
    ],
  }),
  component: MyWorkPage,
});

function MyWorkPage() {
  const { data: user } = useQuery(currentUserQuery());
  const tasks = useQuery({
    ...tasksQuery({ assigneeId: user?.id }),
    enabled: Boolean(user),
  });
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Work"
        description="Tasks assigned to you across every project, grouped by status."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New task
          </Button>
        }
      />

      {tasks.isPending ? (
        <RowSkeleton rows={5} />
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />
      ) : tasks.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workStatuses.map((status) => {
            const group = (tasks.data ?? []).filter((task) => task.status === status);
            if (!group.length) return null;
            return (
              <section key={status} className="space-y-2">
                <h2 className="text-sm font-semibold text-foreground">
                  {statusLabels[status]}{" "}
                  <span className="text-muted-foreground tabular-nums">({group.length})</span>
                </h2>
                {group.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </section>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={CircleCheck}
          title="Your queue is empty"
          description="Nothing is assigned to you right now. Create a task or pick something up from a project board."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New task
            </Button>
          }
        />
      )}

      <TaskFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
