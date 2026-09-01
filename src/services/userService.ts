import { apiFetch } from "./api";
import type { ID, User } from "@/types";

/** GET /api/users */
export async function getUsers(): Promise<User[]> {
  return apiFetch<User[]>("/api/users");
}

/** PATCH /api/users/me */
export async function updateUser(id: ID, patch: Partial<User>): Promise<User> {
  // We ignore `id` here because the backend relies on `current_user` derived from the session/token.
  // We still accept it in the signature to avoid breaking existing frontend components that expect (id, patch).
  return apiFetch<User>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
