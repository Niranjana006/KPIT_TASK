import {
  NotFoundError,
  ValidationError,
  clone,
  db,
  latency,
  nextId,
  now,
  recordActivity,
} from "./store";
import { CURRENT_USER_ID } from "@/data/seed";
import type { ID, Project, ProjectInput } from "@/types";

/** Maps 1:1 to GET /projects */
export async function getProjects(): Promise<Project[]> {
  await latency();
  return clone(db.projects);
}

/** GET /projects/:id */
export async function getProject(id: ID): Promise<Project> {
  await latency(160);
  const project = db.projects.find((p) => p.id === id);
  if (!project) throw new NotFoundError("Project", id);
  return clone(project);
}

function validate(input: ProjectInput, existing?: Project) {
  if (!input.name.trim()) throw new ValidationError("Project name is required.");
  if (!/^[A-Z][A-Z0-9]{1,5}$/.test(input.key))
    throw new ValidationError("Key must be 2–6 uppercase letters or digits.");
  const duplicate = db.projects.some(
    (p) => p.key === input.key && p.id !== existing?.id,
  );
  if (duplicate) throw new ValidationError(`Key “${input.key}” is already in use.`);
  if (input.startDate && input.dueDate && input.dueDate < input.startDate)
    throw new ValidationError("Due date must be after the start date.");
}

/** POST /projects */
export async function createProject(input: ProjectInput): Promise<Project> {
  await latency(320);
  validate(input);
  const timestamp = now();
  const project: Project = {
    id: nextId("p"),
    ...input,
    memberIds: [input.ownerId, CURRENT_USER_ID].filter(
      (v, i, arr) => arr.indexOf(v) === i,
    ),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  db.projects = [project, ...db.projects];
  recordActivity({
    actorId: CURRENT_USER_ID,
    action: "created",
    entityType: "project",
    entityId: project.id,
    entityRef: project.key,
    entityTitle: project.name,
    projectId: project.id,
  });
  return clone(project);
}

/** PATCH /projects/:id */
export async function updateProject(
  id: ID,
  patch: Partial<ProjectInput>,
): Promise<Project> {
  await latency(300);
  const current = db.projects.find((p) => p.id === id);
  if (!current) throw new NotFoundError("Project", id);
  const merged: Project = { ...current, ...patch, updatedAt: now() };
  validate(
    {
      name: merged.name,
      key: merged.key,
      description: merged.description,
      status: merged.status,
      ownerId: merged.ownerId,
      startDate: merged.startDate,
      dueDate: merged.dueDate,
    },
    current,
  );
  db.projects = db.projects.map((p) => (p.id === id ? merged : p));
  recordActivity({
    actorId: CURRENT_USER_ID,
    action: patch.status && patch.status !== current.status ? "status_changed" : "updated",
    entityType: "project",
    entityId: merged.id,
    entityRef: merged.key,
    entityTitle: merged.name,
    projectId: merged.id,
    from: patch.status ? current.status : null,
    to: patch.status ?? null,
  });
  return clone(merged);
}

/** PATCH /projects/:id { status: "archived" } */
export async function archiveProject(id: ID): Promise<Project> {
  return updateProject(id, { status: "archived" });
}
