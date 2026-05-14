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
  getStoredToken,
  storeToken,
  type AuthUser,
} from "../lib/api";
import { Sentry } from "../lib/sentry";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: AuthUser | null;
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
  const [user, setUser]     = useState<AuthUser | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Mirror the current user into Sentry so crashes are attributed. No-op in
  // Expo Go where the native module isn't bound.
  useEffect(() => {
    Sentry.setUser(user ? { id: user.id, email: user.email ?? undefined } : null);
  }, [user]);

  // Restore session on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await getStoredToken();
        if (stored) {
          const me = await getMe(stored);
          setToken(stored);
          setUser(me);
        }
      } catch {
        // Token expired or invalid — clear silently
        await apiLogout();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const me = await apiLogin(email, password);
    const stored = await getStoredToken();
    setToken(stored);
    setUser(me);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const { user: newUser } = await apiRegister(name, email, password);
      // Auto-login after register
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const stored = await getStoredToken();
      if (stored) {
        const me = await getMe(stored);
        setToken(stored);
        setUser(me);
      }
    } catch {
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refresh }}>
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
