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
import { useAuth } from "../../hooks/useAuth";
import {
  Colors,
  Fonts,
  FontSizes,
  Radius,
  Spacing,
  Glow,
} from "../../constants/theme";
import { BrandLogo, PrimaryButton } from "../../components/ui";

const { height: SCREEN_H } = Dimensions.get("window");

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [pwFocused, setPwFocused] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) {
      Alert.alert("Missing fields", "Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid credentials.";
      Alert.alert("Login failed", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <StatusBar style="light" />

      {/* Cinematic backdrop: dark vignette + red glow blob */}
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

        <Text style={styles.eyebrow}>· MEMBERS ENTRANCE ·</Text>
        <Text style={styles.title}>WELCOME BACK</Text>
        <Text style={styles.subtitle}>Sign in to keep watching.</Text>

        <View style={styles.form}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={[styles.input, emailFocused && styles.inputFocused]}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={[styles.input, pwFocused && styles.inputFocused]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={Colors.textFaint}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              onFocus={() => setPwFocused(true)}
              onBlur={() => setPwFocused(false)}
            />
          </View>

          <Link href="/forgot-password" asChild>
            <TouchableOpacity style={styles.forgotWrap}>
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </Link>

          <PrimaryButton
            label="Sign In"
            onPress={handleLogin}
            loading={loading}
            size="lg"
            fullWidth
            style={{ marginTop: Spacing.sm }}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>NEW TO UNHINGETV</Text>
          <View style={styles.dividerLine} />
        </View>

        <Link href="/(auth)/signup" asChild>
          <PrimaryButton label="Create Account" variant="outline" size="lg" fullWidth />
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
    opacity: 0.18,
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
    fontSize: 42,
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
    includeFontPadding: false,
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
  forgotWrap: { alignSelf: "flex-end" },
  forgotText: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: Colors.red,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginVertical: Spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.cardBorder },
  dividerText: {
    fontFamily: Fonts.barlow,
    fontSize: 10,
    color: Colors.textMuted,
    letterSpacing: 2,
    fontWeight: "700",
  },
});
