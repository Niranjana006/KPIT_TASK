import { clone, db, latency } from "./store";
import type { Project, Task, UserStory } from "@/types";

export interface SearchResults {
  projects: Project[];
  stories: UserStory[];
  tasks: Task[];
}

/** GET /search?q= */
export async function search(query: string): Promise<SearchResults> {
  await latency(160);
  const q = query.trim().toLowerCase();
  if (!q) {
    return {
      projects: clone(db.projects.slice(0, 3)),
      stories: clone(db.stories.slice(0, 3)),
      tasks: clone(db.tasks.slice(0, 4)),
    };
  }
  const match = (...fields: string[]) => fields.some((f) => f.toLowerCase().includes(q));

  return {
    projects: clone(db.projects.filter((p) => match(p.name, p.key, p.description)).slice(0, 6)),
    stories: clone(db.stories.filter((s) => match(s.title, s.ref, s.description)).slice(0, 8)),
    tasks: clone(
      db.tasks.filter((t) => match(t.title, t.ref, t.description, t.labels.join(" "))).slice(0, 10),
    ),
  };
}
