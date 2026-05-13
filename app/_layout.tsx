import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../hooks/useAuth";
import { ErrorBoundary } from "../components/ErrorBoundary";

export default function RootLayout() {
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
