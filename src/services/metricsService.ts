/* eslint-disable @typescript-eslint/no-explicit-any */
import { apiFetch } from "./api";
import type { Project, Task, UserStory } from "@/types";
import { mapProject } from "./projectService";
import { mapStory } from "./storyService";
import { mapTask } from "./taskService";

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

/** GET /api/metrics/dashboard */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const data = await apiFetch<any>("/api/metrics/dashboard");

  const projectProgress = (data.project_progress || []).map((pp: any) => ({
    project: mapProject(pp.project),
    storyCount: Number(pp.story_count),
    taskCount: Number(pp.task_count),
    doneTasks: Number(pp.done_tasks),
    progress: Number(pp.progress),
  }));

  const visibleProjects = projectProgress.map((pp: any) => pp.project);

  return {
    totalProjects: Number(data.total_projects),
    activeProjects: Number(data.active_projects),
    openStories: Number(data.open_stories),
    openTasks: Number(data.open_tasks),
    completedTasks: Number(data.completed_tasks),
    overdueTasks: Number(data.overdue_tasks),
    statusDistribution: (data.status_distribution || []).map((s: any) => ({
      status: s.status as Task["status"],
      count: Number(s.count),
    })),
    projectProgress,
    upcomingDeadlines: (data.upcoming_deadlines || []).map(mapTask),
    myTasks: (data.my_tasks || []).map(mapTask),
    recentProjects: [...visibleProjects]
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .slice(0, 3),
    openStoriesList: (data.open_stories_list || []).map(mapStory),
  };
}
