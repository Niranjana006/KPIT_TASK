import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ListTree } from "lucide-react";

import { EmptyState } from "@/components/common/EmptyState";
import { PriorityBadge } from "@/components/common/PriorityBadge";
import { StatusBadge } from "@/components/common/StatusBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { RowSkeleton } from "@/components/common/StateBlocks";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityTimeline } from "@/features/activity/ActivityTimeline";
import { useWorkItemDrawer } from "@/features/workitems/context";
import { storiesQuery, tasksQuery, usersQuery } from "@/hooks/queries";
import { percent, statusLabels } from "@/utils/format";
import { workStatuses } from "@/utils/format";

export const Route = createFileRoute("/projects/$projectId/")({
  component: ProjectOverview,
});

function ProjectOverview() {
  const { projectId } = Route.useParams();
  const stories = useQuery(storiesQuery(projectId));
  const tasks = useQuery(tasksQuery({ projectId }));
  const { data: users = [] } = useQuery(usersQuery());
  const { openStory } = useWorkItemDrawer();

  if (stories.isPending || tasks.isPending) return <RowSkeleton rows={5} />;

  const allTasks = tasks.data ?? [];
  const done = allTasks.filter((task) => task.status === "done").length;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="panel p-5 lg:col-span-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">User stories</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/projects/$projectId/stories" params={{ projectId }}>
              Manage stories
            </Link>
          </Button>
        </div>

        {stories.data?.length ? (
          <ul className="mt-3 divide-y divide-border">
            {stories.data.map((story) => {
              const storyTasks = allTasks.filter((task) => task.storyId === story.id);
              const storyDone = storyTasks.filter((task) => task.status === "done").length;
              return (
                <li key={story.id} className="py-3">
                  <button
                    type="button"
                    onClick={() => openStory(story.id)}
                    className="w-full text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-ref">{story.ref}</span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                        {story.title}
                      </span>
                      <PriorityBadge priority={story.priority} withLabel={false} />
                      <StatusBadge status={story.status} showDot={false} />
                      <UserAvatar user={users.find((u) => u.id === story.assigneeId)} size="xs" />
                    </span>
                    <span className="mt-2 flex items-center gap-3">
                      <Progress value={percent(storyDone, storyTasks.length)} className="h-1" />
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {storyDone}/{storyTasks.length} tasks · {story.storyPoints} pts ·{" "}
                        {story.sprint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            className="mt-3"
            icon={ListTree}
            title="No stories yet"
            description="Add a user story to describe the outcome you want, then break it into tasks."
          />
        )}
      </section>

      <div className="space-y-4">
        <section className="panel p-5">
          <h2 className="text-sm font-semibold text-foreground">Delivery snapshot</h2>
          <p className="mt-3 text-3xl font-semibold tabular-nums text-foreground">
            {percent(done, allTasks.length)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {done} of {allTasks.length} tasks complete
          </p>
          <ul className="mt-4 space-y-2">
            {workStatuses.map((status) => {
              const count = allTasks.filter((task) => task.status === status).length;
              return (
                <li key={status} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{statusLabels[status]}</span>
                  <span className="font-medium text-foreground tabular-nums">{count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="panel p-5">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <ActivityTimeline projectId={projectId} limit={6} className="mt-3" />
        </section>
      </div>
    </div>
  );
}
