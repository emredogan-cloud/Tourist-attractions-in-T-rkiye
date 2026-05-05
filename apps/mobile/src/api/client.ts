import Constants from "expo-constants";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  "http://localhost:3000";

export class ApiError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
  }
}

export async function api<T>(path: string, init?: RequestInit & { locale?: string }): Promise<T> {
  const headers = new Headers(init?.headers ?? {});
  headers.set("Accept", "application/json");
  if (init?.locale) headers.set("Accept-Language", init.locale);
  if (init?.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const resp = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new ApiError(resp.status, body || resp.statusText);
  }
  return (await resp.json()) as T;
}

export const endpoints = {
  attractions: (params: URLSearchParams) => api(`/api/v1/attractions?${params}`),
  attraction: (slug: string, locale: string) =>
    api(`/api/v1/attractions/${slug}?locale=${locale}`, { locale }),
  search: (q: string, locale: string) =>
    api(`/api/v1/search?q=${encodeURIComponent(q)}&locale=${locale}`, { locale }),
  mapMarkers: (locale: string) => api(`/api/v1/attractions/map?locale=${locale}`, { locale }),
  me: () => api("/api/v1/me"),
  favorites: () => api("/api/v1/me/favorites"),
  toggleFavorite: (id: string, on: boolean) =>
    api(`/api/v1/me/favorites/${id}`, { method: on ? "POST" : "DELETE" }),
};

export const apiBaseUrl = API_BASE_URL;
