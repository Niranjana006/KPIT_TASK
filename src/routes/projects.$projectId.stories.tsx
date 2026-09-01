import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ListTree, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { LabelList } from "@/components/common/LabelList";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ErrorState, RowSkeleton } from "@/components/common/StateBlocks";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StoryFormDialog } from "@/features/stories/StoryFormDialog";
import { useWorkItemDrawer } from "@/features/workitems/context";
import { storiesQuery, tasksQuery, usersQuery } from "@/hooks/queries";
import type { WorkStatus } from "@/types";
import { percent, statusLabels, workStatuses } from "@/utils/format";

export const Route = createFileRoute("/projects/$projectId/stories")({
  component: StoriesPage,
});

function StoriesPage() {
  const { projectId } = Route.useParams();
  const stories = useQuery(storiesQuery(projectId));
  const { data: tasks = [] } = useQuery(tasksQuery({ projectId }));
  const { data: users = [] } = useQuery(usersQuery());
  const { openStory } = useWorkItemDrawer();
  const [status, setStatus] = useState<WorkStatus | "all">("all");
  const [createOpen, setCreateOpen] = useState(false);

  const visible = (stories.data ?? []).filter(
    (story) => status === "all" || story.status === status,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(value) => setStatus(value as WorkStatus | "all")}>
          <SelectTrigger className="sm:w-48" aria-label="Filter stories by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {workStatuses.map((option) => (
              <SelectItem key={option} value={option}>
                {statusLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button className="sm:ml-auto" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" /> New story
        </Button>
      </div>

      {stories.isPending ? (
        <RowSkeleton rows={5} />
      ) : stories.isError ? (
        <ErrorState error={stories.error} onRetry={() => stories.refetch()} />
      ) : visible.length ? (
        <ul className="grid gap-3 lg:grid-cols-2">
          {visible.map((story) => {
            const storyTasks = tasks.filter((task) => task.storyId === story.id);
            const done = storyTasks.filter((task) => task.status === "done").length;
            return (
              <li key={story.id}>
                <button
                  type="button"
                  onClick={() => openStory(story.id, story.projectId)}
                  className="panel w-full p-4 text-left transition-colors hover:border-ring/40 hover:bg-surface-raised focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-ref">{story.ref}</span>
                    <PriorityBadge priority={story.priority} withLabel={false} />
                    <StatusBadge status={story.status} showDot={false} className="ml-auto" />
                  </span>
                  <span className="mt-1.5 block text-sm font-medium text-foreground">
                    {story.title}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                    {story.description}
                  </span>
                  <LabelList labels={story.labels} max={3} className="mt-2" />
                  <span className="mt-3 flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
                    <UserAvatar user={users.find((u) => u.id === story.assigneeId)} size="xs" />
                    {story.sprint} · {story.storyPoints} pts · {done}/{storyTasks.length} tasks (
                    {percent(done, storyTasks.length)}%)
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState
          icon={ListTree}
          title="No stories match this filter"
          description="Change the status filter or create a new user story for this project."
          action={
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="size-4" /> New story
            </Button>
          }
        />
      )}

      <StoryFormDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId} />
    </div>
  );
}
