import type { Role, User } from "../types/user";

const baseUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3030";

async function request<T>(
  path: string,
  options?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const res = await fetch(`${baseUrl}${path}`.replace(/\/+$/, ""), {
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    signal: options?.signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `Request failed: ${res.status}`);
  }

  return (await res.json()) as T;
}

export function listUsers(params: {
  search?: string;
  role?: Role | "all";
  signal?: AbortSignal;
}) {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.role && params.role !== "all") qs.set("role", params.role);
  const q = qs.toString();
  return request<User[]>(q ? `/users?${q}` : "/users", {
    signal: params.signal,
  });
}

export function getUser(params: { id: string; signal?: AbortSignal }) {
  return request<User>(`/users/${params.id}`, { signal: params.signal });
}

export function toggleActive(params: { id: string }) {
  return request<User>(`/users/${params.id}/toggle-active`, {
    method: "PATCH",
  });
}
