import { queryOptions, useQueryClient } from "@tanstack/react-query";

import * as activityService from "@/services/activityService";
import * as authService from "@/services/authService";
import * as metricsService from "@/services/metricsService";
import * as notificationService from "@/services/notificationService";
import * as projectService from "@/services/projectService";
import * as searchService from "@/services/searchService";
import * as storyService from "@/services/storyService";
import * as taskService from "@/services/taskService";
import * as userService from "@/services/userService";
import type { ID } from "@/types";

export const qk = {
  users: ["users"] as const,
  currentUser: ["users", "me"] as const,
  projects: ["projects"] as const,
  project: (id: ID) => ["projects", id] as const,
  stories: (projectId?: ID) => ["stories", projectId ?? "all"] as const,
  tasks: (query: taskService.TaskQuery = {}) => ["tasks", query] as const,
  notifications: ["notifications"] as const,
  activity: (query: activityService.ActivityQuery = {}) => ["activity", query] as const,
  metrics: ["metrics", "dashboard"] as const,
  search: (q: string) => ["search", q] as const,
};

export const usersQuery = () =>
  queryOptions({ queryKey: qk.users, queryFn: userService.getUsers, staleTime: 60_000 });

export const currentUserQuery = () =>
  queryOptions({
    queryKey: qk.currentUser,
    queryFn: authService.getMe,
    staleTime: 60_000,
    retry: false, // Don't retry on 401
  });

export const projectsQuery = () =>
  queryOptions({ queryKey: qk.projects, queryFn: projectService.getProjects });

export const projectQuery = (id: ID) =>
  queryOptions({ queryKey: qk.project(id), queryFn: () => projectService.getProject(id) });

export const storiesQuery = (projectId?: ID) =>
  queryOptions({
    queryKey: qk.stories(projectId),
    queryFn: () => storyService.getStories(projectId),
  });

export const tasksQuery = (query: taskService.TaskQuery = {}) =>
  queryOptions({ queryKey: qk.tasks(query), queryFn: () => taskService.getTasks(query) });

export const notificationsQuery = () =>
  queryOptions({
    queryKey: qk.notifications,
    queryFn: notificationService.getNotifications,
  });

export const activityQuery = (query: activityService.ActivityQuery = {}) =>
  queryOptions({
    queryKey: qk.activity(query),
    queryFn: () => activityService.getActivity(query),
  });

export const dashboardMetricsQuery = () =>
  queryOptions({
    queryKey: ["metrics", "dashboard"],
    queryFn: () => metricsService.getDashboardMetrics(),
  });

export const searchQuery = (q: string) =>
  queryOptions({ queryKey: qk.search(q), queryFn: () => searchService.search(q) });

/**
 * Mock services mutate a shared store, so any write can affect derived reads.
 * Invalidating the whole cache keeps the UI truthful without scattering
 * cache-key knowledge across feature components.
 */
export function useRefreshWorkspace() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries();
}

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong. Please try again.";
