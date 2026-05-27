import React, { Component, ReactNode } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { AlertTriangle } from "lucide-react-native";
import { Colors, Fonts, FontSizes, Spacing, Glow, Radius } from "../constants/theme";
import { Sentry } from "../lib/sentry";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    // Sentry is a no-op shim when the native module isn't bound (Expo Go) or
    // EXPO_PUBLIC_SENTRY_DSN isn't set, so this is safe to call unconditionally.
    Sentry.captureException(error);
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <LinearGradient
            colors={["#1a0000", "#000000", "#000000"] as readonly [string, string, string]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.iconCircle}>
            <AlertTriangle size={32} color={Colors.white} strokeWidth={2.5} />
          </View>
          <Text style={styles.eyebrow}>· SYSTEM FAULT ·</Text>
          <Text style={styles.title}>SOMETHING WENT WRONG</Text>
          <Text style={styles.message}>
            We hit an unexpected error. The team has been notified.
          </Text>
          <Text style={styles.detail} numberOfLines={4}>
            {this.state.error.message?.slice(0, 200)}
          </Text>
          <Text style={styles.button} onPress={this.reset}>
            TRY AGAIN
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Glow.redMd,
  },
  eyebrow: {
    fontFamily: Fonts.barlow,
    color: Colors.red,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 6,
  },
  title: {
    fontFamily: Fonts.bebas,
    color: Colors.white,
    fontSize: 32,
    letterSpacing: 1.5,
    textAlign: "center",
    marginBottom: Spacing.sm,
    includeFontPadding: false,
  },
  message: {
    color: Colors.textSub,
    fontSize: FontSizes.md,
    textAlign: "center",
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  detail: {
    color: Colors.textFaint,
    fontSize: FontSizes.sm,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    textAlign: "center",
    marginBottom: Spacing.lg,
    opacity: 0.65,
    paddingHorizontal: Spacing.md,
  },
  button: {
    fontFamily: Fonts.barlow,
    color: Colors.white,
    backgroundColor: Colors.red,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    fontWeight: "700",
    fontSize: FontSizes.md,
    letterSpacing: 2,
    overflow: "hidden",
  },
});
