import React, { Component, ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import { Colors, FontSizes, Spacing } from "../constants/theme";

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
    // TODO: forward to Sentry once SDK is added on mobile
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            We hit an unexpected error. The team has been notified.
          </Text>
          <Text style={styles.detail}>
            {this.state.error.message?.slice(0, 200)}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.reset}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
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
  title: {
    color: Colors.white,
    fontSize: FontSizes.xl,
    fontWeight: "800",
    marginBottom: Spacing.sm,
  },
  message: {
    color: Colors.textFaint,
    fontSize: FontSizes.md,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  detail: {
    color: Colors.textFaint,
    fontSize: FontSizes.sm,
    fontFamily: Platform.select({ ios: "Menlo", android: "monospace" }),
    textAlign: "center",
    marginBottom: Spacing.lg,
    opacity: 0.6,
  },
  button: {
    backgroundColor: Colors.brandRed,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: 8,
  },
  buttonText: {
    color: Colors.white,
    fontWeight: "700",
    fontSize: FontSizes.md,
  },
});
