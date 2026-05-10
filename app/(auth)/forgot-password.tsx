import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import { Colors, FontSizes, Radius, Spacing } from "../../constants/theme";

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://unhingetv.vercel.app";

export default function ForgotPasswordScreen() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      // Always show success — prevents email enumeration
      setSent(true);
    } catch {
      // Show success anyway
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoWrap}>
          <Text style={styles.logoText}>UNHINGE</Text>
          <View style={styles.logoBadge}>
            <Text style={styles.logoTv}>TV</Text>
          </View>
        </View>

        <Text style={styles.title}>Forgot password?</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a reset link.
        </Text>

        {sent ? (
          <View style={styles.successBox}>
            <Text style={styles.successIcon}>📬</Text>
            <Text style={styles.successTitle}>Check your inbox</Text>
            <Text style={styles.successBody}>
              If an account exists for {email}, you'll receive a password reset email within
              a few minutes. Check your spam folder if it doesn't arrive.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => router.replace("/(auth)/login")}
              activeOpacity={0.85}
            >
              <Text style={styles.btnText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
              />
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.btnText}>Send Reset Link</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.backWrap} activeOpacity={0.7}>
            <Text style={styles.backText}>← Back to Sign In</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  logoWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing.xl,
  },
  logoText: {
    fontSize: 34,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 4,
  },
  logoBadge: {
    backgroundColor: Colors.red,
    borderRadius: Radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  logoTv: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 1,
  },
  title: {
    fontSize: FontSizes.xxl,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  form: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  fieldWrap: {
    gap: 6,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.textSub,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  btn: {
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingVertical: 15,
    alignItems: "center",
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    fontSize: FontSizes.md,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  successBox: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  successIcon: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "800",
    color: Colors.white,
    textAlign: "center",
  },
  successBody: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  backWrap: {
    alignItems: "center",
    marginTop: Spacing.md,
  },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    fontWeight: "600",
  },
});
