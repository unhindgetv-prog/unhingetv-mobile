import { ReactNode } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Gradients, Radius, Glow } from "../../constants/theme";

interface Props {
  children: ReactNode;
  glow?: boolean;
  redTint?: boolean;
  style?: ViewStyle;
  radius?: number;
}

/**
 * Premium dark card. Matches web .neon-card / .glass-card spec:
 * dark gradient surface, subtle red-tinted border, deep drop shadow.
 * Pass redTint=true for paywall/featured surfaces.
 */
export function GlassCard({ children, glow, redTint, style, radius = Radius.lg }: Props) {
  return (
    <View
      style={[
        styles.wrap,
        { borderRadius: radius },
        glow && Glow.card,
        style,
      ]}
    >
      <LinearGradient
        colors={
          (redTint
            ? Gradients.glassCard
            : ["#0F0F0F", "#070707"]) as unknown as readonly [string, string, ...string[]]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fill, { borderRadius: radius }]}
      />
      <View
        style={[
          styles.border,
          {
            borderRadius: radius,
            borderColor: redTint ? Colors.redBorder : Colors.cardBorder,
          },
        ]}
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { overflow: "hidden" },
  fill: { ...StyleSheet.absoluteFill },
  border: {
    ...StyleSheet.absoluteFill,
    borderWidth: 1,
  },
  content: { padding: 0 },
});
