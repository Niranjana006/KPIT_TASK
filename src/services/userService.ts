import { CURRENT_USER_ID } from "@/data/seed";
import { NotFoundError, clone, db, latency } from "./store";
import type { ID, User } from "@/types";

/** GET /users */
export async function getUsers(): Promise<User[]> {
  await latency(120);
  return clone(db.users);
}

/** GET /users/me */
export async function getCurrentUser(): Promise<User> {
  await latency(80);
  const user = db.users.find((u) => u.id === CURRENT_USER_ID);
  if (!user) throw new NotFoundError("User", CURRENT_USER_ID);
  return clone(user);
}

/** PATCH /users/:id */
export async function updateUser(id: ID, patch: Partial<User>): Promise<User> {
  await latency(240);
  const user = db.users.find((u) => u.id === id);
  if (!user) throw new NotFoundError("User", id);
  const merged = { ...user, ...patch };
  db.users = db.users.map((u) => (u.id === id ? merged : u));
  return clone(merged);
}

export { CURRENT_USER_ID };
