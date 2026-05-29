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

// ─── Base fetch ───────────────────────────────────────────────────────────────
//
// React Native's `fetch` strips `Set-Cookie` from response headers (it's a
// "forbidden response header" per the Fetch spec), so we can't read the session
// token out of the login response. Instead we trust iOS's NSURLSession cookie
// jar to capture and persist cookies across requests + app launches, and verify
// auth state by calling `/api/auth/session` (which echoes the user object if
// the cookie is valid). Every authenticated call passes `credentials: "include"`.

async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers,
  });

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

interface AuthJsSessionResponse {
  user?: AuthUser;
  expires?: string;
}

export async function login(email: string, password: string): Promise<AuthUser> {
  // Step 1: fetch CSRF token. The Set-Cookie containing the CSRF cookie is
  // automatically stored by NSURLSession; we just need the token value for the body.
  const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { credentials: "include" });
  const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

  // Step 2: POST credentials. NSURLSession sends the CSRF cookie from step 1
  // automatically and captures the session cookie the server returns on success.
  // We do NOT try to read the Set-Cookie header — RN strips it.
  const credRes = await fetch(`${BASE_URL}/api/auth/callback/credentials`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    credentials: "include",
    body: new URLSearchParams({ email, password, csrfToken, json: "true" }),
    redirect: "manual",
  });

  // Auth.js v5 redirects on both success AND failure (failure includes ?error=).
  // Distinguish by hitting /api/auth/session and seeing if a user was authenticated.
  const location = credRes.headers.get("location") ?? "";
  if (location.includes("error=")) {
    throw new Error("Invalid email or password");
  }

  const me = await getMe();
  if (!me) throw new Error("Invalid email or password");
  return me;
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

/**
 * Returns the authenticated user if the session cookie is valid, otherwise null.
 * NSURLSession auto-attaches the persisted session cookie via credentials: "include".
 */
export async function getMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/auth/session`, { credentials: "include" });
    if (!res.ok) return null;
    const session = (await res.json()) as AuthJsSessionResponse;
    return session.user ?? null;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  // Step 1: fetch CSRF (required by Auth.js v5 sign-out)
  try {
    const csrfRes = await fetch(`${BASE_URL}/api/auth/csrf`, { credentials: "include" });
    const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

    // Step 2: POST signout — server clears the session cookie via Set-Cookie with Max-Age=0
    await fetch(`${BASE_URL}/api/auth/signout`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "include",
      body: new URLSearchParams({ csrfToken, json: "true" }),
      redirect: "manual",
    });
  } catch {
    // Best-effort — even if signout fails server-side, we don't have a token to clear locally.
  }
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

export interface Trailer {
  id: string;
  showSlug: string;
  showTitle: string;
  label: string;
  muxPlaybackId: string;
  streamUrl: string;
  posterUrl: string;
  durationSeconds: number | null;
}

export async function getTrailers(): Promise<Trailer[]> {
  const data = await apiFetch<{ trailers: Trailer[] }>("/api/trailers");
  return data.trailers ?? [];
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

export async function getSubscription(): Promise<{
  status: string;
  plan: string;
  currentPeriodEnd: string | null;
} | null> {
  try {
    const data = await apiFetch<{
      subscription: { status: string; plan: string; currentPeriodEnd: string | null } | null;
    }>(`/api/subscriptions`);
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

export async function saveProgress(episodeId: string, progress: number): Promise<void> {
  await apiFetch("/api/history", {
    method: "POST",
    body: JSON.stringify({ episodeId, progress }),
  });
}

// ─── Watchlist ────────────────────────────────────────────────────────────────

export async function toggleWatchlist(showId: string, action: "add" | "remove"): Promise<void> {
  await apiFetch("/api/watchlist", {
    method: action === "add" ? "POST" : "DELETE",
    body: JSON.stringify({ showId }),
  });
}
