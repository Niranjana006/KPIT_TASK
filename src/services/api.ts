export const API_BASE = import.meta.env["VITE_API_BASE_URL"] || "http://localhost:8000";

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "APIError";
  }
}

/**
 * Standardized fetch wrapper for the application.
 * Handles credentials, JSON parsing, and error normalization.
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  // Set default Content-Type if not provided and we have a body
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // essential for httpOnly cookie authentication
  });

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as unknown as T;
  }

  // Attempt to parse JSON response
  let data: unknown;
  const isJson = response.headers.get("content-type")?.includes("application/json");
  if (isJson) {
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
  } else {
    data = await response.text();
  }

  // Handle errors
  if (!response.ok) {
    const errorData = data as Record<string, unknown>;
    const message =
      errorData?.["message"] ||
      errorData?.["detail"] ||
      response.statusText ||
      "An API error occurred";
    throw new APIError(
      typeof message === "string" ? message : "Validation Error",
      response.status,
      errorData?.["detail"] || data,
    );
  }

  return data as T;
}
