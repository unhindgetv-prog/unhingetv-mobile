import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { postAgeGateRoute } from "../lib/initialRoute";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ShieldAlert } from "lucide-react-native";
import {
  Colors,
  Fonts,
  FontSizes,
  Radius,
  Spacing,
  Glow,
} from "../constants/theme";
import { BrandLogo, PrimaryButton } from "../components/ui";

const { height: SCREEN_H } = Dimensions.get("window");

// Persisted under this key so we don't re-ask. Cleared on logout.
const STORAGE_KEY = "@unhingetv/age_verified_at";

function isAtLeast18(dobIso: string): boolean {
  const dob = new Date(dobIso);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  const eighteenYearsAgo = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  return dob <= eighteenYearsAgo;
}

export default function AgeGateScreen() {
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [focusKey, setFocusKey] = useState<string | null>(null);

  async function handleVerify() {
    const m = parseInt(month, 10),
      d = parseInt(day, 10),
      y = parseInt(year, 10);
    if (!m || !d || !y || m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > new Date().getFullYear()) {
      Alert.alert("Invalid date", "Please enter a valid date of birth.");
      return;
    }
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!isAtLeast18(iso)) {
      Alert.alert(
        "Age requirement not met",
        "You must be 18 or older to use UnhingeTV. We're sorry.",
        [{ text: "OK" }]
      );
      return;
    }
    await AsyncStorage.setItem(STORAGE_KEY, new Date().toISOString());
    // TV devices go to the 10-foot "(tv)" UI; phones/tablets to "(tabs)".
    router.replace(postAgeGateRoute(Platform.isTV === true));
  }

  function inputStyle(key: string) {
    return [styles.input, focusKey === key && styles.inputFocused];
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1a0000", "#000000", "#000000"] as readonly [string, string, string]}
        locations={[0, 0.4, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.redGlowBlob} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <BrandLogo size="lg" />
        </View>

        <View style={styles.shieldWrap}>
          <View style={styles.shieldCircle}>
            <ShieldAlert size={28} color={Colors.white} />
          </View>
        </View>

        <Text style={styles.eyebrow}>· RESTRICTED ACCESS ·</Text>
        <Text style={styles.title}>YOU MUST BE 18+</Text>
        <Text style={styles.subtitle}>
          UnhingeTV is for adults only. Confirm your date of birth to continue.
        </Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>MONTH</Text>
            <TextInput
              style={inputStyle("m")}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              placeholderTextColor={Colors.textFaint}
              value={month}
              onChangeText={setMonth}
              onFocus={() => setFocusKey("m")}
              onBlur={() => setFocusKey(null)}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>DAY</Text>
            <TextInput
              style={inputStyle("d")}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="DD"
              placeholderTextColor={Colors.textFaint}
              value={day}
              onChangeText={setDay}
              onFocus={() => setFocusKey("d")}
              onBlur={() => setFocusKey(null)}
            />
          </View>
          <View style={[styles.field, { flex: 1.3 }]}>
            <Text style={styles.label}>YEAR</Text>
            <TextInput
              style={inputStyle("y")}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="YYYY"
              placeholderTextColor={Colors.textFaint}
              value={year}
              onChangeText={setYear}
              onFocus={() => setFocusKey("y")}
              onBlur={() => setFocusKey(null)}
            />
          </View>
        </View>

        <PrimaryButton
          label="Confirm I'm 18+"
          onPress={handleVerify}
          size="lg"
          fullWidth
          style={{ marginTop: Spacing.lg }}
        />

        <Text style={styles.disclaimer}>
          Falsely declaring your age violates our Terms of Service. UnhingeTV does not retain
          your date of birth beyond this verification.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  redGlowBlob: {
    position: "absolute",
    top: -SCREEN_H * 0.18,
    left: -100,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: Colors.red,
    opacity: 0.2,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl + 12,
    paddingBottom: Spacing.xxl,
    justifyContent: "center",
  },
  logoWrap: { alignItems: "center", marginBottom: Spacing.lg },
  shieldWrap: { alignItems: "center", marginBottom: Spacing.md },
  shieldCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    ...Glow.redMd,
  },
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
    fontSize: 40,
    color: Colors.white,
    textAlign: "center",
    letterSpacing: 2,
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  field: { flex: 1 },
  label: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    color: Colors.textSub,
    fontWeight: "700",
    letterSpacing: 2,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.dark,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSizes.lg,
    color: Colors.white,
    textAlign: "center",
    fontFamily: Fonts.barlow,
    fontWeight: "700",
  },
  inputFocused: {
    borderColor: Colors.redBorder,
    ...Glow.redSm,
  },
  disclaimer: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    lineHeight: 16,
    textAlign: "center",
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
});

export async function hasPassedAgeGate(): Promise<boolean> {
  return Boolean(await AsyncStorage.getItem(STORAGE_KEY));
}
