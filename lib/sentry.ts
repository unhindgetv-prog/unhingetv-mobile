/**
 * Sentry mobile init.
 *
 * Same Sentry org/project as web ("unhingetv" workspace) so iOS + Android +
 * web crashes land in the same Issues feed. DSN is read from EAS Secret
 * EXPO_PUBLIC_SENTRY_DSN — when unset (Expo Go preview, local dev), init is
 * a no-op and the wrap() helper just returns the component untouched.
 *
 * Native module @sentry/react-native is only loaded inside a custom dev
 * client or production build. In Expo Go the require() would throw, so we
 * guard with a try/catch and fall back to a no-op surface.
 */
import * as ExpoConstants from "expo-constants";

const dsn =
  (process.env.EXPO_PUBLIC_SENTRY_DSN as string | undefined) ??
  (ExpoConstants.default?.expoConfig?.extra?.sentryDsn as string | undefined);

interface SentryShim {
  captureException: (e: unknown) => void;
  setUser: (user: { id?: string; email?: string } | null) => void;
  wrap: <T>(component: T) => T;
}

const noop: SentryShim = {
  captureException: () => {},
  setUser: () => {},
  wrap: (c) => c,
};

let sentry: SentryShim = noop;

if (dsn) {
  try {
    // Dynamic require so Expo Go (which doesn't have the native module bound)
    // doesn't crash at import time. Only the production / dev-client native
    // build will resolve this successfully.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const RNSentry = require("@sentry/react-native") as {
      init: (opts: Record<string, unknown>) => void;
      captureException: (e: unknown) => void;
      setUser: SentryShim["setUser"];
      wrap: SentryShim["wrap"];
    };
    RNSentry.init({
      dsn,
      // Send 100% of errors. Sample performance / replay at 10% later if needed.
      tracesSampleRate: 0,
      enableNative: true,
      debug: false,
      // Match the web project's environment tag so we can filter across both.
      environment:
        (process.env.EXPO_PUBLIC_ENVIRONMENT as string | undefined) ?? "production",
    });
    sentry = {
      captureException: (e) => RNSentry.captureException(e),
      setUser: (u) => RNSentry.setUser(u),
      wrap: RNSentry.wrap,
    };
  } catch {
    // Native module missing (Expo Go) — keep the no-op shim.
    sentry = noop;
  }
}

export const Sentry = sentry;
