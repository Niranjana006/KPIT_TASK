import {
  NotFoundError,
  ValidationError,
  clone,
  db,
  latency,
  nextId,
  nextRef,
  now,
  recordActivity,
} from "./store";
import { CURRENT_USER_ID } from "@/data/seed";
import type { ID, StoryInput, UserStory } from "@/types";

/** GET /stories?projectId= */
export async function getStories(projectId?: ID): Promise<UserStory[]> {
  await latency();
  const rows = projectId
    ? db.stories.filter((s) => s.projectId === projectId)
    : db.stories;
  return clone(rows);
}

/** GET /stories/:id */
export async function getStory(id: ID): Promise<UserStory> {
  await latency(140);
  const story = db.stories.find((s) => s.id === id);
  if (!story) throw new NotFoundError("User story", id);
  return clone(story);
}

function validate(input: Pick<StoryInput, "title" | "projectId" | "storyPoints">) {
  if (!input.title.trim()) throw new ValidationError("Story title is required.");
  if (!input.projectId) throw new ValidationError("A story must belong to a project.");
  if (input.storyPoints < 0 || input.storyPoints > 100)
    throw new ValidationError("Story points must be between 0 and 100.");
}

/** POST /stories */
export async function createStory(input: StoryInput): Promise<UserStory> {
  await latency(320);
  validate(input);
  const timestamp = now();
  const story: UserStory = {
    id: nextId("s"),
    ref: nextRef(
      "US",
      db.stories.filter((s) => s.projectId === input.projectId).map((s) => s.ref),
    ),
    ...input,
    acceptanceCriteria: input.acceptanceCriteria.filter((c) => c.trim().length > 0),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.stories = [story, ...db.stories];
  recordActivity({
    actorId: CURRENT_USER_ID,
    action: "created",
    entityType: "story",
    entityId: story.id,
    entityRef: story.ref,
    entityTitle: story.title,
    projectId: story.projectId,
    storyId: story.id,
  });
  return clone(story);
}

/** PATCH /stories/:id */
export async function updateStory(
  id: ID,
  patch: Partial<StoryInput>,
): Promise<UserStory> {
  await latency(280);
  const current = db.stories.find((s) => s.id === id);
  if (!current) throw new NotFoundError("User story", id);
  const merged: UserStory = { ...current, ...patch, updatedAt: now() };
  validate(merged);
  db.stories = db.stories.map((s) => (s.id === id ? merged : s));

  const action =
    patch.status && patch.status !== current.status
      ? "status_changed"
      : patch.priority && patch.priority !== current.priority
        ? "priority_changed"
        : patch.assigneeId !== undefined && patch.assigneeId !== current.assigneeId
          ? "assigned"
          : "updated";

  recordActivity({
    actorId: CURRENT_USER_ID,
    action,
    entityType: "story",
    entityId: merged.id,
    entityRef: merged.ref,
    entityTitle: merged.title,
    projectId: merged.projectId,
    storyId: merged.id,
    from: action === "status_changed" ? current.status : action === "priority_changed" ? current.priority : null,
    to: action === "status_changed" ? merged.status : action === "priority_changed" ? merged.priority : action === "assigned" ? merged.assigneeId : null,
  });
  return clone(merged);
}

/** DELETE /stories/:id — cascades to its tasks */
export async function deleteStory(id: ID): Promise<{ deletedTasks: number }> {
  await latency(280);
  const story = db.stories.find((s) => s.id === id);
  if (!story) throw new NotFoundError("User story", id);
  const deletedTasks = db.tasks.filter((t) => t.storyId === id).length;
  db.tasks = db.tasks.filter((t) => t.storyId !== id);
  db.stories = db.stories.filter((s) => s.id !== id);
  recordActivity({
    actorId: CURRENT_USER_ID,
    action: "deleted",
    entityType: "story",
    entityId: story.id,
    entityRef: story.ref,
    entityTitle: story.title,
    projectId: story.projectId,
  });
  return { deletedTasks };
}
