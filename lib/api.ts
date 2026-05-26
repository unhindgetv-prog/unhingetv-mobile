import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

// Resolution order:
//   1. process.env.EXPO_PUBLIC_API_URL — injected by EAS at update/build time when
//      the EAS Secret EXPO_PUBLIC_API_URL is set. Preferred source so the URL doesn't
//      ship verbatim inside app.json (rotating it would otherwise need a new build).
//   2. Constants.expoConfig.extra.apiUrl — legacy fallback that ships inside the
//      bundle (currently "https://unhingetv.vercel.app" in app.json).
//   3. Hardcoded apex — last-resort default so the app never points at localhost.
const BASE_URL =
  (process.env.EXPO_PUBLIC_API_URL as string | undefined) ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  "https://unhingetv.com";

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

/**
 * Auth.js v5 (NextAuth's new name) uses `authjs.*` cookie names — NOT `next-auth.*`
 * like v4. Cookie name also has the `__Secure-` prefix in HTTPS production.
 * We send all four common variants so the server matches whichever it expects.
 */
export function sessionCookieHeader(token: string): string {
  return [
    `__Secure-authjs.session-token=${token}`,
    `authjs.session-token=${token}`,
    `__Secure-next-auth.session-token=${token}`,
    `next-auth.session-token=${token}`,
  ].join("; ");
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
  // Step 1: fetch CSRF token required by NextAuth v5
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`);
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // Step 2: POST credentials with the real CSRF token
  const res = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: csrfRes.headers.get("set-cookie") ?? "",
    },
    body: new URLSearchParams({ email, password, csrfToken, json: "true" }),
    redirect: "manual",
  });

  // Auth.js v5 returns a 302 on success — extract session token from Set-Cookie.
  // Try Auth.js v5 cookie names first (current production), fall back to v4 names.
  const setCookie = res.headers.get("set-cookie") ?? "";
  const sessionToken =
    setCookie.match(/__Secure-authjs\.session-token=([^;]+)/)?.[1] ??
    setCookie.match(/authjs\.session-token=([^;]+)/)?.[1] ??
    setCookie.match(/__Secure-next-auth\.session-token=([^;]+)/)?.[1] ??
    setCookie.match(/next-auth\.session-token=([^;]+)/)?.[1];

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
    headers: { Cookie: sessionCookieHeader(t) },
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

export async function getComingSoonShows(): Promise<Show[]> {
  return apiFetch<Show[]>("/api/shows/coming-soon");
}

export async function getShow(slug: string): Promise<{ show: Show; seasons: Season[] }> {
  const data = await apiFetch<Show & { seasons: Season[] }>(`/api/shows/${slug}`);
  const { seasons, ...show } = data;
  return { show: show as Show, seasons: seasons ?? [] };
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
  /** "signed" → use muxStreamUrl. "public" → muxPlaybackId is enough. */
  muxPlaybackPolicy?: "public" | "signed";
  /** Pre-signed HLS URL for signed-policy assets. Expires 6h. */
  muxStreamUrl?: string | null;
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
    // API returns { subscription: sub | null }
    const data = await apiFetch<{ subscription: { status: string; plan: string; currentPeriodEnd: string | null } | null }>(
      `/api/subscriptions`,
      { headers: { Cookie: sessionCookieHeader(token) } }
    );
    return data.subscription ?? null;
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
    headers: { Cookie: sessionCookieHeader(token) },
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
    headers: { Cookie: sessionCookieHeader(token) },
    body: JSON.stringify({ showId }),
  });
}
