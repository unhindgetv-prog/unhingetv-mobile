import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMe,
  type AuthUser,
} from "../lib/api";
import { Sentry } from "../lib/sentry";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
  /** Always null in the cookie-jar-based auth model — kept for back-compat with callers. */
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Mirror the current user into Sentry so crashes are attributed. No-op in
  // Expo Go where the native module isn't bound.
  useEffect(() => {
    Sentry.setUser(user ? { id: user.id, email: user.email ?? undefined } : null);
  }, [user]);

  // Restore session on mount — the Auth.js session cookie is persisted by
  // NSURLSession's cookie jar across app launches, so we just ask the server.
  useEffect(() => {
    (async () => {
      const me = await getMe();
      setUser(me);
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const me = await apiLogin(email, password);
    setUser(me);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      await apiRegister(name, email, password);
      // Auto-login after register
      const me = await apiLogin(email, password);
      setUser(me);
    },
    []
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const me = await getMe();
    setUser(me);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token: null, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
