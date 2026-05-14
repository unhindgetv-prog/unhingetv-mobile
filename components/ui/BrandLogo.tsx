import { View, Text, StyleSheet } from "react-native";
import { Colors, Fonts, Glow } from "../../constants/theme";

interface Props {
  size?: "sm" | "md" | "lg" | "xl";
}

const SIZES = {
  sm: { word: 18, tv: 13, badgePadX: 5, badgePadY: 1, gap: 4, badgeR: 3 },
  md: { word: 24, tv: 16, badgePadX: 6, badgePadY: 1, gap: 5, badgeR: 4 },
  lg: { word: 34, tv: 22, badgePadX: 7, badgePadY: 2, gap: 6, badgeR: 5 },
  xl: { word: 48, tv: 32, badgePadX: 10, badgePadY: 3, gap: 8, badgeR: 6 },
} as const;

export function BrandLogo({ size = "md" }: Props) {
  const s = SIZES[size];
  return (
    <View style={styles.row}>
      <Text style={[styles.word, { fontSize: s.word, marginRight: s.gap }]}>UNHINGE</Text>
      <View
        style={[
          styles.badge,
          Glow.redSm,
          {
            paddingHorizontal: s.badgePadX,
            paddingVertical: s.badgePadY,
            borderRadius: s.badgeR,
          },
        ]}
      >
        <Text style={[styles.tv, { fontSize: s.tv }]}>TV</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  word: {
    fontFamily: Fonts.bebas,
    color: Colors.white,
    letterSpacing: 4,
    includeFontPadding: false,
  },
  badge: { backgroundColor: Colors.red },
  tv: {
    fontFamily: Fonts.bebas,
    color: Colors.white,
    letterSpacing: 1,
    includeFontPadding: false,
  },
});
