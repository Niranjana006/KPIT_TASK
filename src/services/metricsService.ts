import { clone, db, latency } from "./store";
import type { Project, Task, UserStory } from "@/types";

export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  openStories: number;
  openTasks: number;
  completedTasks: number;
  overdueTasks: number;
  statusDistribution: { status: Task["status"]; count: number }[];
  projectProgress: {
    project: Project;
    storyCount: number;
    taskCount: number;
    doneTasks: number;
    progress: number;
  }[];
  upcomingDeadlines: Task[];
  myTasks: Task[];
  recentProjects: Project[];
  openStoriesList: UserStory[];
}

const OPEN_STATUSES: Task["status"][] = ["backlog", "todo", "in_progress", "in_review"];

/** GET /metrics/dashboard — derived entirely from the stored entities. */
export async function getDashboardMetrics(currentUserId: string): Promise<DashboardMetrics> {
  await latency(260);
  const nowIso = new Date().toISOString();
  const tasks = db.tasks;
  const visibleProjects = db.projects.filter((p) => p.status !== "archived");

  const projectProgress = visibleProjects
    .map((project) => {
      const projectTasks = tasks.filter((t) => t.projectId === project.id);
      const doneTasks = projectTasks.filter((t) => t.status === "done").length;
      return {
        project,
        storyCount: db.stories.filter((s) => s.projectId === project.id).length,
        taskCount: projectTasks.length,
        doneTasks,
        progress: projectTasks.length
          ? Math.round((doneTasks / projectTasks.length) * 100)
          : 0,
      };
    })
    .sort((a, b) => b.progress - a.progress);

  return clone({
    totalProjects: db.projects.length,
    activeProjects: db.projects.filter((p) => p.status === "active").length,
    openStories: db.stories.filter((s) => s.status !== "done").length,
    openTasks: tasks.filter((t) => OPEN_STATUSES.includes(t.status)).length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
    overdueTasks: tasks.filter(
      (t) => t.status !== "done" && t.dueDate !== null && t.dueDate < nowIso,
    ).length,
    statusDistribution: (["backlog", "todo", "in_progress", "in_review", "done"] as const).map(
      (status) => ({ status, count: tasks.filter((t) => t.status === status).length }),
    ),
    projectProgress,
    upcomingDeadlines: tasks
      .filter((t) => t.status !== "done" && t.dueDate)
      .sort((a, b) => (a.dueDate! < b.dueDate! ? -1 : 1))
      .slice(0, 6),
    myTasks: tasks
      .filter((t) => t.assigneeId === currentUserId && t.status !== "done")
      .sort((a, b) => (a.dueDate ?? "9") .localeCompare(b.dueDate ?? "9"))
      .slice(0, 6),
    recentProjects: [...visibleProjects]
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 3),
    openStoriesList: db.stories.filter((s) => s.status !== "done"),
  });
}
