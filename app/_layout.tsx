import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "../hooks/useAuth";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" backgroundColor="#000000" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#000000" },
          animation: "slide_from_right",
        }}
      >
        <Stack.Screen name="(tabs)"   options={{ headerShown: false }} />
        <Stack.Screen name="(auth)"   options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="show/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[id]"  options={{ headerShown: false, animation: "fade" }} />
      </Stack>
    </AuthProvider>
  );
}
