import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarClock,
  CircleCheck,
  FolderKanban,
  ListTree,
  Plus,
  SquareCheck,
} from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/common/EmptyState";
import { MetricCard } from "@/components/common/MetricCard";
import { PageHeader } from "@/components/common/PageHeader";
import { CardSkeletonGrid, ErrorState, RowSkeleton } from "@/components/common/StateBlocks";
import { StatusBadge } from "@/components/common/StatusBadge";
import { UserAvatar } from "@/components/common/UserAvatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ActivityTimeline } from "@/features/activity/ActivityTimeline";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import { useWorkItemDrawer } from "@/features/workitems/context";
import { currentUserQuery, dashboardMetricsQuery, usersQuery } from "@/hooks/queries";
import { dueLabel, isOverdue, statusLabels } from "@/utils/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — FlowForge" },
      {
        name: "description",
        content:
          "Delivery snapshot across projects: open work, overdue tasks, project progress and team activity.",
      },
      { property: "og:title", content: "Dashboard — FlowForge" },
      {
        property: "og:description",
        content: "Delivery snapshot across every project, story and task in your workspace.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: user } = useQuery(currentUserQuery());
  const { data: users = [] } = useQuery(usersQuery());
  const metrics = useQuery(dashboardMetricsQuery());
  const { openTask, openStory } = useWorkItemDrawer();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <div className="space-y-6">
      <PageHeader
        title={user ? `Welcome back, ${user.name.split(" ")[0]}` : "Dashboard"}
        description="Here's how delivery is tracking across your active projects."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" /> New project
          </Button>
        }
      />

      {metrics.isPending ? (
        <CardSkeletonGrid count={4} />
      ) : metrics.isError ? (
        <ErrorState error={metrics.error} onRetry={() => metrics.refetch()} />
      ) : metrics.data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Active projects"
              value={metrics.data.activeProjects}
              hint={`${metrics.data.totalProjects} total in workspace`}
              icon={FolderKanban}
              to="/projects"
            />
            <MetricCard
              label="Open stories"
              value={metrics.data.openStories}
              hint="Not yet delivered"
              icon={ListTree}
            />
            <MetricCard
              label="Open tasks"
              value={metrics.data.openTasks}
              hint={`${metrics.data.completedTasks} completed`}
              icon={SquareCheck}
            />
            <MetricCard
              label="Overdue tasks"
              value={metrics.data.overdueTasks}
              hint="Past their due date"
              icon={AlertTriangle}
              tone={metrics.data.overdueTasks ? "warning" : "positive"}
              to="/my-work"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="panel p-5 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Project progress</h2>
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/projects">View all</Link>
                </Button>
              </div>
              <ul className="mt-4 space-y-4">
                {metrics.data.projectProgress.map(
                  ({ project, storyCount, taskCount, doneTasks, progress }) => (
                    <li key={project.id}>
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          to="/projects/$projectId"
                          params={{ projectId: project.id }}
                          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground hover:underline"
                        >
                          <span className="text-ref mr-2">{project.key}</span>
                          {project.name}
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {doneTasks}/{taskCount} tasks · {storyCount} stories
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-3">
                        <Progress value={progress} className="h-1.5" />
                        <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-foreground">
                          {progress}%
                        </span>
                      </div>
                    </li>
                  ),
                )}
                {!metrics.data.projectProgress.length ? (
                  <li>
                    <EmptyState
                      icon={FolderKanban}
                      title="No active projects"
                      description="Create your first project to start tracking delivery."
                      action={
                        <Button size="sm" onClick={() => setCreateOpen(true)}>
                          <Plus className="size-4" /> New project
                        </Button>
                      }
                    />
                  </li>
                ) : null}
              </ul>
            </section>

            <section className="panel p-5">
              <h2 className="text-sm font-semibold text-foreground">Task status mix</h2>
              <ul className="mt-4 space-y-3">
                {metrics.data.statusDistribution.map(({ status, count }) => {
                  const total = metrics.data.statusDistribution.reduce(
                    (sum, entry) => sum + entry.count,
                    0,
                  );
                  const share = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <li key={status}>
                      <div className="flex items-center justify-between text-xs">
                        <StatusBadge status={status} />
                        <span className="text-muted-foreground tabular-nums">
                          {count} · {share}%
                        </span>
                      </div>
                      <Progress value={share} className="mt-1.5 h-1" />
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <section className="panel p-5">
              <h2 className="text-sm font-semibold text-foreground">My open tasks</h2>
              <ul className="mt-3 divide-y divide-border">
                {metrics.data.myTasks.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => openTask(task.id)}
                      className="w-full py-2.5 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-ref">{task.ref}</span>
                        <span className="min-w-0 flex-1 truncate text-sm text-foreground">
                          {task.title}
                        </span>
                      </span>
                      <span
                        className={cn(
                          "mt-1 block text-xs",
                          isOverdue(task.dueDate, task.status)
                            ? "font-medium text-destructive"
                            : "text-muted-foreground",
                        )}
                      >
                        {statusLabels[task.status]} · {dueLabel(task.dueDate)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {!metrics.data.myTasks.length ? (
                <EmptyState
                  className="mt-3 py-8"
                  icon={CircleCheck}
                  title="Nothing assigned to you"
                  description="Your queue is clear. Pick up work from the backlog when you're ready."
                />
              ) : null}
            </section>

            <section className="panel p-5">
              <h2 className="text-sm font-semibold text-foreground">Upcoming deadlines</h2>
              <ul className="mt-3 divide-y divide-border">
                {metrics.data.upcomingDeadlines.map((task) => (
                  <li key={task.id} className="flex items-center gap-2 py-2.5">
                    <CalendarClock
                      className={cn(
                        "size-4 shrink-0",
                        isOverdue(task.dueDate, task.status)
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                      aria-hidden
                    />
                    <button
                      type="button"
                      onClick={() => openTask(task.id)}
                      className="min-w-0 flex-1 truncate text-left text-sm text-foreground hover:underline"
                    >
                      {task.title}
                    </button>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {dueLabel(task.dueDate)}
                    </span>
                  </li>
                ))}
              </ul>
              {!metrics.data.upcomingDeadlines.length ? (
                <EmptyState
                  className="mt-3 py-8"
                  icon={CalendarClock}
                  title="No dated work"
                  description="Add due dates to tasks to see them tracked here."
                />
              ) : null}
            </section>

            <section className="panel p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-foreground">Open stories</h2>
                <span className="text-xs text-muted-foreground">
                  {metrics.data.openStoriesList.length}
                </span>
              </div>
              <ul className="mt-3 divide-y divide-border">
                {metrics.data.openStoriesList.slice(0, 6).map((story) => (
                  <li key={story.id} className="flex items-center gap-2 py-2.5">
                    <button
                      type="button"
                      onClick={() => openStory(story.id, story.projectId)}
                      className="min-w-0 flex-1 truncate text-left text-sm text-foreground hover:underline"
                    >
                      <span className="text-ref mr-2">{story.ref}</span>
                      {story.title}
                    </button>
                    <UserAvatar user={users.find((u) => u.id === story.assigneeId)} size="xs" />
                  </li>
                ))}
              </ul>
              {!metrics.data.openStoriesList.length ? (
                <EmptyState
                  className="mt-3 py-8"
                  icon={ListTree}
                  title="No open stories"
                  description="Every story is delivered. Time to plan the next slice."
                />
              ) : null}
            </section>
          </div>
        </>
      ) : (
        <RowSkeleton />
      )}

      <section className="panel p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/activity">Full feed</Link>
          </Button>
        </div>
        <ActivityTimeline limit={8} className="mt-4" />
      </section>

      <ProjectFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
