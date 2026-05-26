import { useEffect, useState } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts, BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import {
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from "@expo-google-fonts/barlow-condensed";
import { View } from "react-native";
import { AuthProvider } from "../hooks/useAuth";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { Sentry } from "../lib/sentry";
import { hasPassedAgeGate } from "./age-gate";

function RootLayoutImpl() {
  // Brand display fonts. Until they load, fall back to a hidden black screen
  // (instead of system Helvetica flashing in) so first paint matches brand.
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });

  // App Store guideline 1.1.6: 17+ content must gate at first launch. The
  // age-gate screen writes to AsyncStorage on success; here we just redirect
  // any session that hasn't passed it yet.
  const [ageReady, setAgeReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const passed = await hasPassedAgeGate();
      if (cancelled) return;
      if (!passed) router.replace("/age-gate");
      setAgeReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!fontsLoaded || !ageReady) {
    return <View style={{ flex: 1, backgroundColor: "#000000" }} />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <StatusBar style="light" backgroundColor="#000000" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#000000" },
            animation: "slide_from_right",
          }}
        >
          {/* TV platforms get their own screen hierarchy */}
          <Stack.Screen name="(tv)"    options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
          <Stack.Screen name="(auth)"  options={{ headerShown: false, animation: "slide_from_bottom" }} />
          <Stack.Screen name="age-gate" options={{ headerShown: false, animation: "fade", presentation: "modal", gestureEnabled: false }} />
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
