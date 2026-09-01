/* eslint-disable @typescript-eslint/no-explicit-any */

import { apiFetch } from "./api";
import type { Project, Task, UserStory } from "@/types";
import { mapProject } from "./projectService";
import { mapStory } from "./storyService";
import { mapTask } from "./taskService";

export interface SearchResults {
  projects: Project[];
  stories: UserStory[];
  tasks: Task[];
}

/** GET /search?q= */
export async function search(query: string): Promise<SearchResults> {
  const q = query.trim();
  const data = await apiFetch<any>(`/api/search?q=${encodeURIComponent(q)}`);

  return {
    projects: (data.projects || []).map(mapProject),
    stories: (data.stories || []).map(mapStory),
    tasks: (data.tasks || []).map(mapTask),
  };
}
