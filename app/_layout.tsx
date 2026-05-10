import { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, Redirect } from "expo-router";
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
        {/* TV platforms get their own screen hierarchy */}
        <Stack.Screen name="(tv)"    options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)"  options={{ headerShown: false }} />
        <Stack.Screen name="(auth)"  options={{ headerShown: false, animation: "slide_from_bottom" }} />
        <Stack.Screen name="show/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="watch/[id]"  options={{ headerShown: false, animation: "fade" }} />
      </Stack>
    </AuthProvider>
  );
}
