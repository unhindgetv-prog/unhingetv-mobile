import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://unhingetv.vercel.app";

// ─── Token storage ────────────────────────────────────────────────────────────

const TOKEN_KEY = "unhingetv_session";

export async function getStoredToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function storeToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// ─── Base fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = (body as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  subscription?: { status: string; plan: string } | null;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  // NextAuth credentials login via POST /api/auth/callback/credentials
  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ email, password, csrfToken: "", json: "true" }),
    redirect: "manual",
  });

  // NextAuth returns a redirect on success — extract session cookie
  const setCookie = res.headers.get("set-cookie") ?? "";
  const tokenMatch = setCookie.match(/next-auth\.session-token=([^;]+)/);
  const secureMatch = setCookie.match(/__Secure-next-auth\.session-token=([^;]+)/);
  const sessionToken = tokenMatch?.[1] ?? secureMatch?.[1];

  if (!sessionToken) throw new Error("Invalid email or password");
  await storeToken(sessionToken);

  return getMe(sessionToken);
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ user: AuthUser }> {
  return apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
}

export async function getMe(token?: string): Promise<AuthUser> {
  const t = token ?? (await getStoredToken());
  if (!t) throw new Error("Not authenticated");
  return apiFetch<AuthUser>("/api/auth/session", {
    headers: { Cookie: `next-auth.session-token=${t}` },
  });
}

export async function logout(): Promise<void> {
  await clearToken();
}

// ─── Shows ────────────────────────────────────────────────────────────────────

export interface Show {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string | null;
  banner: string | null;
  genre: string[];
  accessType: "FREE" | "SUBSCRIPTION" | "PPV";
  featured: boolean;
  avgRating?: number;
  episodeCount?: number;
}

export async function getShows(): Promise<Show[]> {
  return apiFetch<Show[]>("/api/shows");
}

export async function getShow(slug: string): Promise<{ show: Show; seasons: Season[] }> {
  return apiFetch<{ show: Show; seasons: Season[] }>(`/api/shows/${slug}`);
}

// ─── Episodes ─────────────────────────────────────────────────────────────────

export interface Episode {
  id: string;
  number: number;
  title: string;
  description: string | null;
  thumbnail: string | null;
  duration: number | null;
  muxPlaybackId: string | null;
  muxStatus: string;
  isFree: boolean;
  accessType: string;
  seasonId: string;
}

export interface Season {
  id: string;
  number: number;
  title: string | null;
  episodes: Episode[];
}

export async function getEpisode(id: string): Promise<Episode> {
  return apiFetch<Episode>(`/api/episodes/${id}`);
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export async function getSubscription(token: string): Promise<{
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
} | null> {
  try {
    return await apiFetch(`/api/subscriptions`, {
      headers: { Cookie: `next-auth.session-token=${token}` },
    });
  } catch {
    return null;
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResults {
  shows: Show[];
  episodes: Array<{ id: string; title: string; thumbnail: string | null; showTitle: string; showSlug: string }>;
}

export async function search(q: string): Promise<SearchResults> {
  return apiFetch<SearchResults>(`/api/search?q=${encodeURIComponent(q)}`);
}

// ─── Watch history ────────────────────────────────────────────────────────────

export async function saveProgress(
  episodeId: string,
  progress: number,
  token: string
): Promise<void> {
  await apiFetch("/api/history", {
    method: "POST",
    headers: { Cookie: `next-auth.session-token=${token}` },
    body: JSON.stringify({ episodeId, progress }),
  });
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function toggleWatchlist(
  showId: string,
  action: "add" | "remove",
  token: string
): Promise<void> {
  await apiFetch("/api/watchlist", {
    method: action === "add" ? "POST" : "DELETE",
    headers: { Cookie: `next-auth.session-token=${token}` },
    body: JSON.stringify({ showId }),
  });
}
