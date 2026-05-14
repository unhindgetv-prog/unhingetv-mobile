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
  Linking,
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

export default function SignupScreen() {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  async function handleSignup() {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert("Missing fields", "Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim().toLowerCase(), password);
      router.replace("/(tabs)");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not create account.";
      Alert.alert("Sign up failed", msg);
    } finally {
      setLoading(false);
    }
  }

  function inputStyle(key: string) {
    return [styles.input, focused === key && styles.inputFocused];
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

        <Text style={styles.eyebrow}>· JOIN THE NETWORK ·</Text>
        <Text style={styles.title}>CREATE ACCOUNT</Text>
        <Text style={styles.subtitle}>Start watching today.</Text>

        <View style={styles.form}>
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={inputStyle("name")}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.textFaint}
              autoCapitalize="words"
              returnKeyType="next"
              onFocus={() => setFocused("name")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              style={inputStyle("email")}
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              placeholderTextColor={Colors.textFaint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="next"
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              style={inputStyle("pw")}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimum 8 characters"
              placeholderTextColor={Colors.textFaint}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleSignup}
              onFocus={() => setFocused("pw")}
              onBlur={() => setFocused(null)}
            />
          </View>

          <Text style={styles.terms}>
            By creating an account you agree to our{" "}
            <Text style={styles.termsLink} onPress={() => Linking.openURL("https://unhingetv.com/terms")}>
              Terms
            </Text>{" "}
            and{" "}
            <Text style={styles.termsLink} onPress={() => Linking.openURL("https://unhingetv.com/privacy")}>
              Privacy Policy
            </Text>
            .
          </Text>

          <PrimaryButton
            label="Create Account"
            onPress={handleSignup}
            loading={loading}
            size="lg"
            fullWidth
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ALREADY A MEMBER</Text>
          <View style={styles.dividerLine} />
        </View>

        <Link href="/(auth)/login" asChild>
          <PrimaryButton label="Sign In" variant="outline" size="lg" fullWidth />
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
    right: -120,
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
  terms: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    lineHeight: 18,
    marginTop: 4,
  },
  termsLink: { color: Colors.red, fontWeight: "700" },
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
