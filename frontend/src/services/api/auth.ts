import { apiFetch, getCsrfToken } from "@/services/api/client";
import { ApiClientError } from "@/types/api";
import type { CurrentUser } from "@/types/domain";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const response = await apiFetch<CurrentUser>("/me");
    return response.data;
  } catch (error) {
    if (error instanceof ApiClientError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function login(username: string, password: string): Promise<CurrentUser> {
  const csrfToken = await getCsrfToken();
  const response = await apiFetch<CurrentUser>("/auth/login", {
    method: "POST",
    headers: { "X-CSRFToken": csrfToken },
    body: JSON.stringify({ username, password }),
  });
  return response.data;
}

export async function logout(): Promise<void> {
  await apiFetch<{ status: string }>("/auth/logout", { method: "POST" });
}
