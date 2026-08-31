import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { ErrorState, RowSkeleton } from "@/components/common/StateBlocks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KanbanBoard } from "@/features/board/KanbanBoard";
import { storiesQuery, tasksQuery, usersQuery } from "@/hooks/queries";

export const Route = createFileRoute("/projects/$projectId/board")({
  component: BoardPage,
});

function BoardPage() {
  const { projectId } = Route.useParams();
  const tasks = useQuery(tasksQuery({ projectId }));
  const { data: stories = [] } = useQuery(storiesQuery(projectId));
  const { data: users = [] } = useQuery(usersQuery());
  const [storyId, setStoryId] = useState("all");
  const [assigneeId, setAssigneeId] = useState("all");

  const visible = (tasks.data ?? []).filter(
    (task) =>
      (storyId === "all" || task.storyId === storyId) &&
      (assigneeId === "all" ||
        (assigneeId === "unassigned" ? task.assigneeId === null : task.assigneeId === assigneeId)),
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={storyId} onValueChange={setStoryId}>
          <SelectTrigger className="sm:w-64" aria-label="Filter by story">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All stories</SelectItem>
            {stories.map((story) => (
              <SelectItem key={story.id} value={story.id}>
                {story.ref} · {story.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={assigneeId} onValueChange={setAssigneeId}>
          <SelectTrigger className="sm:w-52" aria-label="Filter by assignee">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground sm:ml-auto">
          {visible.length} tasks · drag cards between columns
        </p>
      </div>

      {tasks.isPending ? (
        <RowSkeleton rows={4} />
      ) : tasks.isError ? (
        <ErrorState error={tasks.error} onRetry={() => tasks.refetch()} />
      ) : (
        <KanbanBoard tasks={visible} projectId={projectId} />
      )}
    </div>
  );
}
