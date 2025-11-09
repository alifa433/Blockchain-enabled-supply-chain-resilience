import type { DashboardData } from "./types";

const DEFAULT_API_URL = "http://localhost:8000";

const normaliseBaseUrl = (url: string) => url.replace(/\/$/, "");

export const API_BASE_URL = normaliseBaseUrl(
  import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL,
);

const headers = { "Content-Type": "application/json" } as const;

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = options.signal ? null : new AbortController();
  const timeout = controller ? setTimeout(() => controller.abort(), 10_000) : null;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {}),
      },
      signal: options.signal ?? controller?.signal,
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `Request failed with status ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

export const fetchDashboard = (signal?: AbortSignal) =>
  request<DashboardData>("/api/dashboard", { signal });

export const checkHealth = (signal?: AbortSignal) =>
  request<{ status: string }>("/health", { signal });
