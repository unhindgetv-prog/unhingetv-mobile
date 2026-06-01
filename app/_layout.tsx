import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { resolveInitialRoute } from "../lib/initialRoute";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from "@expo-google-fonts/barlow-condensed";
import * as SplashScreen from "expo-splash-screen";
import { AuthProvider } from "../hooks/useAuth";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Sentry } from "../lib/sentry";
import { hasPassedAgeGate } from "./age-gate";

// Keep the OS splash up until JS has decided what to render. Without this the
// Expo splash dismisses ~150ms after launch and we're stuck on a black <View>
// while fonts + AsyncStorage resolve. That manifested as a black-screen on
// first install of build 2.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Default to "not yet checked". `null` distinguishes "we don't know" from
// "yes, gated" (true) vs "no, needs gate" (false).
let agePassedCache: boolean | null = null;

function RootLayoutImpl() {
  // Brand display fonts. Until they load, fall back to a hidden black screen
  // (instead of system Helvetica flashing in) so first paint matches brand.
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });

  // App Store guideline 1.1.6: 17+ content must gate at first launch.
  // We *don't* call router.replace inside an effect — that races with Stack
  // mount and renders a permanent black screen if the router isn't ready yet.
  // Instead we set the Stack's initialRouteName conditionally below.
  const [agePassed, setAgePassed] = useState<boolean | null>(agePassedCache);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const passed = await hasPassedAgeGate();
      if (cancelled) return;
      agePassedCache = passed;
      setAgePassed(passed);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const ready = fontsLoaded && agePassed !== null;

  // Hide the native splash the moment we have enough state to render.
  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    // Returning null keeps the OS splash visible (we haven't hidden it yet).
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          // Set the initial route based on age-gate state AND device class.
          // expo-router uses this to decide which screen mounts first when the
          // Stack initializes, which avoids the "router.replace inside useEffect"
          // race that caused a permanent black screen on first launch in build 2.
          // TV devices (Platform.isTV — true only on EXPO_TV/react-native-tvos
          // builds) boot into the 10-foot "(tv)" group; phones/tablets into
          // "(tabs)". See lib/initialRoute for the pure decision + its tests.
          initialRouteName={resolveInitialRoute(agePassed === true, Platform.isTV === true)}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000000" },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen
            name="age-gate"
            options={{ headerShown: false, animation: "fade", gestureEnabled: false }}
          />
          <Stack.Screen name="(tv)"    options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
          <Stack.Screen name="(auth)"  options={{ headerShown: false, animation: "slide_from_bottom" }} />
          <Stack.Screen name="show/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="watch/[id]"  options={{ headerShown: false, animation: "fade" }} />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}

// Sentry.wrap is a no-op in Expo Go (DSN absent + native module missing) and
// becomes an instrumented wrapper inside the production binary.
export default Sentry.wrap(RootLayoutImpl);
