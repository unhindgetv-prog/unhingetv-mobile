import { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts } from "../../constants/theme";

interface Props {
  children: ReactNode;
  icon?: ReactNode;
  color?: string;
}

/**
 * Small uppercase tracking label used above hero titles + section headers.
 * Matches the web .eyebrow / brand-badge pattern.
 */
export function Eyebrow({ children, icon, color = Colors.red }: Props) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {icon}
      <Text style={[styles.text, { color }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  text: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
});
