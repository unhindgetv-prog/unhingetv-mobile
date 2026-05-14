import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts, Spacing, Glow } from "../../constants/theme";

interface Props {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  align?: "left" | "center";
}

/**
 * Matches the web hero section-title spec:
 * uppercase eyebrow in red, bold Bebas title, glowing red underline.
 */
export function SectionHeader({ title, eyebrow, icon, align = "left" }: Props) {
  return (
    <View style={[styles.wrap, align === "center" && { alignItems: "center" }]}>
      {eyebrow && (
        <View style={styles.eyebrowRow}>
          {icon}
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
      )}
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={[styles.underline, Glow.redSm]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  eyebrow: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    color: Colors.red,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
    includeFontPadding: false,
  },
  titleRow: { flexDirection: "row", alignItems: "flex-end" },
  title: {
    fontFamily: Fonts.bebas,
    fontSize: 30,
    color: Colors.white,
    letterSpacing: 1.5,
    lineHeight: 30,
    includeFontPadding: false,
  },
  underline: {
    width: 44,
    height: 3,
    backgroundColor: Colors.red,
    marginTop: 8,
    borderRadius: 2,
  },
});
