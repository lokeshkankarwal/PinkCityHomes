const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "";
const API = `${API_BASE}/api`;

// ── Token storage ─────────────────────────────────────────────────────────────
const TOKEN_KEY = "pch_jwt";

export function getStoredToken(): string | undefined {
  return localStorage.getItem(TOKEN_KEY) ?? undefined;
}
export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}
export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT = 30_000;

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const authHeader: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const res = await fetch(`${API}${path}`, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...authHeader, ...(init.headers ?? {}) },
      signal: controller.signal,
      ...init,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || data.message || data.detail || res.statusText || "Request failed");
    return data as T;
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out. Please check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  get: <T>(p: string) => req<T>(p),
  post: <T>(p: string, body?: unknown) => req<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(p: string, body?: unknown) => req<T>(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined }),
  del: <T>(p: string) => req<T>(p, { method: "DELETE" }),
  delete: <T>(p: string) => req<T>(p, { method: "DELETE" }),
  upload: async (path: string, files: FileList) => {
    const fd = new FormData();
    Array.from(files).forEach((f) => fd.append("photos", f));
    const token = getStoredToken();
    const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120_000);

    try {
      const res = await fetch(`${API}${path}`, {
        method: "POST",
        body: fd,
        credentials: "include",
        headers,
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      return data;
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("Upload timed out. Please try again with a smaller file or better connection.");
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
