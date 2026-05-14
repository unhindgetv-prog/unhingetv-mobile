import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { Link, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Mail } from "lucide-react-native";
import Constants from "expo-constants";
import {
  Colors,
  Fonts,
  FontSizes,
  Radius,
  Spacing,
  Glow,
} from "../../constants/theme";
import { BrandLogo, PrimaryButton, GlassCard } from "../../components/ui";

const { height: SCREEN_H } = Dimensions.get("window");

const BASE_URL =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? "https://unhingetv.vercel.app";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [focused, setFocused] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setSent(true);
    } catch {
      // Always show success — prevents email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1a0000", "#000000", "#000000"] as readonly [string, string, string]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.redGlowBlob} pointerEvents="none" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoWrap}>
          <BrandLogo size="lg" />
        </View>

        <Text style={styles.eyebrow}>· RESET ACCESS ·</Text>
        <Text style={styles.title}>FORGOT PASSWORD</Text>
        <Text style={styles.subtitle}>We&apos;ll send you a reset link.</Text>

        {sent ? (
          <GlassCard redTint glow style={{ marginTop: Spacing.lg }}>
            <View style={styles.successInner}>
              <View style={styles.successIconWrap}>
                <Mail size={28} color={Colors.white} />
              </View>
              <Text style={styles.successTitle}>CHECK YOUR INBOX</Text>
              <Text style={styles.successBody}>
                If an account exists for{" "}
                <Text style={{ color: Colors.white, fontWeight: "700" }}>{email}</Text>, a reset
                link is on the way. Don&apos;t forget the spam folder.
              </Text>
              <PrimaryButton
                label="Back to Sign In"
                onPress={() => router.replace("/(auth)/login")}
                size="lg"
                fullWidth
                style={{ marginTop: Spacing.md }}
              />
            </View>
          </GlassCard>
        ) : (
          <View style={styles.form}>
            <View style={styles.fieldWrap}>
              <Text style={styles.label}>EMAIL ADDRESS</Text>
              <TextInput
                style={[styles.input, focused && styles.inputFocused]}
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={Colors.textFaint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="send"
                onSubmitEditing={handleSubmit}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
              />
            </View>

            <PrimaryButton
              label="Send Reset Link"
              onPress={handleSubmit}
              loading={loading}
              size="lg"
              fullWidth
            />
          </View>
        )}

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.backWrap} activeOpacity={0.7}>
            <Text style={styles.backText}>← BACK TO SIGN IN</Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  redGlowBlob: {
    position: "absolute",
    top: -SCREEN_H * 0.15,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: Colors.red,
    opacity: 0.15,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  logoWrap: { alignItems: "center", marginBottom: Spacing.lg },
  eyebrow: {
    fontFamily: Fonts.barlow,
    color: Colors.red,
    fontSize: 11,
    letterSpacing: 3,
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 6,
    includeFontPadding: false,
  },
  title: {
    fontFamily: Fonts.bebas,
    fontSize: 38,
    color: Colors.white,
    textAlign: "center",
    letterSpacing: 2,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    textAlign: "center",
    marginTop: 4,
    marginBottom: Spacing.xl,
  },
  form: { gap: Spacing.md, marginBottom: Spacing.lg },
  fieldWrap: { gap: 7 },
  label: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSub,
    letterSpacing: 2,
  },
  input: {
    backgroundColor: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSizes.md,
    color: Colors.white,
  },
  inputFocused: {
    borderColor: Colors.redBorder,
    ...Glow.redSm,
  },
  successInner: { padding: Spacing.lg, alignItems: "center", gap: Spacing.sm },
  successIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    ...Glow.redMd,
    marginBottom: Spacing.sm,
  },
  successTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 26,
    color: Colors.white,
    letterSpacing: 1.5,
    textAlign: "center",
  },
  successBody: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 4,
  },
  backWrap: { alignItems: "center", marginTop: Spacing.lg },
  backText: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
});
