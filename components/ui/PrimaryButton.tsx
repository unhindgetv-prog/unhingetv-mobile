import { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Colors, Fonts, Gradients, Radius, Spacing, Glow } from "../../constants/theme";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

interface Props {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  style?: ViewStyle;
  fullWidth?: boolean;
}

const SIZE_MAP = {
  sm: { padV: 10, padH: 16, font: 12, gap: 6 },
  md: { padV: 14, padH: 22, font: 14, gap: 8 },
  lg: { padV: 17, padH: 28, font: 15, gap: 10 },
} as const;

/**
 * Premium brand button. Matches the web .btn-primary spec:
 * 135deg red gradient, uppercase + letter-spaced, red glow shadow.
 * Outline + ghost variants for secondary actions.
 */
export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = "primary",
  size = "md",
  icon,
  style,
  fullWidth,
}: Props) {
  const s = SIZE_MAP[size];
  const isPrimary = variant === "primary";
  const isOutline = variant === "outline";
  const isGhost = variant === "ghost";

  const inner = (
    <View
      style={[
        styles.inner,
        { paddingVertical: s.padV, paddingHorizontal: s.padH, gap: s.gap },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} size="small" />
      ) : (
        <>
          {icon}
          <Text style={[styles.label, { fontSize: s.font }]}>{label}</Text>
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        styles.touch,
        fullWidth && { alignSelf: "stretch" },
        isPrimary && Glow.button,
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
    >
      {isPrimary && (
        <LinearGradient
          colors={Gradients.brand as unknown as readonly [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fill}
        />
      )}
      {isOutline && <View style={[styles.fill, styles.outlineFill]} />}
      {isGhost && <View style={[styles.fill, styles.ghostFill]} />}
      {inner}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touch: {
    borderRadius: Radius.md,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  fill: { ...StyleSheet.absoluteFillObject },
  outlineFill: {
    borderWidth: 1,
    borderColor: Colors.borderBright,
    borderRadius: Radius.md,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  ghostFill: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: Radius.md,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    color: Colors.white,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: Fonts.barlow,
    includeFontPadding: false,
  },
});

export { Spacing };
