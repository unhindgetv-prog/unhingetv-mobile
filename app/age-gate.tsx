import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors, FontSizes, Radius, Spacing } from "../constants/theme";

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

  async function handleVerify() {
    const m = parseInt(month, 10), d = parseInt(day, 10), y = parseInt(year, 10);
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
    router.replace("/(tabs)");
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>UNHINGETV</Text>
        <Text style={styles.title}>You must be 18+</Text>
        <Text style={styles.subtitle}>
          UnhingeTV contains content intended only for adults. Please verify your date of birth to continue.
        </Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Month</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              placeholderTextColor={Colors.textFaint}
              value={month}
              onChangeText={setMonth}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Day</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="DD"
              placeholderTextColor={Colors.textFaint}
              value={day}
              onChangeText={setDay}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>Year</Text>
            <TextInput
              style={styles.input}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="YYYY"
              placeholderTextColor={Colors.textFaint}
              value={year}
              onChangeText={setYear}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleVerify} activeOpacity={0.85}>
          <Text style={styles.buttonText}>Confirm I'm 18+</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Falsely declaring your age is a violation of our Terms of Service. UnhingeTV does not retain your date of birth beyond this verification.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.lg, paddingTop: Spacing.xl * 2 },
  brand: { color: Colors.brandRed, fontWeight: "900", letterSpacing: 4, fontSize: FontSizes.xl, marginBottom: Spacing.md },
  title: { color: Colors.white, fontWeight: "800", fontSize: FontSizes.xl, marginBottom: Spacing.sm },
  subtitle: { color: Colors.textFaint, fontSize: FontSizes.md, lineHeight: 22, marginBottom: Spacing.lg },
  row: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.lg },
  field: { flex: 1 },
  label: { color: Colors.textFaint, fontSize: FontSizes.sm, marginBottom: 6, textTransform: "uppercase", letterSpacing: 1 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    padding: Spacing.md,
    color: Colors.white,
    fontSize: FontSizes.lg,
    textAlign: "center",
    backgroundColor: Colors.surface,
  },
  button: {
    backgroundColor: Colors.brandRed,
    borderRadius: Radius.md,
    padding: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  buttonText: { color: Colors.white, fontWeight: "800", fontSize: FontSizes.md },
  disclaimer: { color: Colors.textFaint, fontSize: FontSizes.xs, opacity: 0.6, lineHeight: 16 },
});

export async function hasPassedAgeGate(): Promise<boolean> {
  return Boolean(await AsyncStorage.getItem(STORAGE_KEY));
}
