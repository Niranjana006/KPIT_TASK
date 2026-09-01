import { apiFetch } from "./api";
import type { User } from "@/types";
import { useQueryClient } from "@tanstack/react-query";
import { qk } from "@/hooks/queries";

export interface LoginCredentials {
  email: string;
  password?: string;
}

export async function login(
  credentials: LoginCredentials,
): Promise<{ access_token: string; user: User }> {
  // We send password as standard JSON to the backend POST /api/auth/login
  return apiFetch<{ access_token: string; user: User }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password || "password",
    }),
  });
}

export async function logout(): Promise<void> {
  return apiFetch<void>("/api/auth/logout", {
    method: "POST",
  });
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/api/auth/me");
}
