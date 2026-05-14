import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { Skeleton } from "./Skeleton";

const { width: W } = Dimensions.get("window");
const HERO_H = Math.round(W * 0.95);
const CARD_W = Math.round(W * 0.42);
const CARD_H = Math.round(CARD_W * 1.5);

/**
 * Mirrors the real home layout so loading feels like content arriving rather
 * than the screen blanking out. Hero block + 2 horizontal rails of portrait
 * cards.
 */
export function HomeSkeleton() {
  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      {/* Hero */}
      <Skeleton width={W} height={HERO_H} radius={0} />

      {/* Section 1 */}
      <View style={styles.section}>
        <Skeleton width={90} height={11} style={{ marginBottom: 8 }} />
        <Skeleton width={180} height={26} radius={Radius.sm} style={{ marginBottom: 4 }} />
        <Skeleton width={40} height={3} radius={2} style={{ marginBottom: Spacing.md }} />
        <View style={styles.row}>
          <Skeleton width={CARD_W} height={CARD_H} radius={Radius.md} />
          <Skeleton width={CARD_W} height={CARD_H} radius={Radius.md} />
        </View>
      </View>

      {/* Section 2 */}
      <View style={styles.section}>
        <Skeleton width={140} height={11} style={{ marginBottom: 8 }} />
        <Skeleton width={200} height={26} radius={Radius.sm} style={{ marginBottom: 4 }} />
        <Skeleton width={40} height={3} radius={2} style={{ marginBottom: Spacing.md }} />
        <View style={styles.row}>
          <Skeleton width={CARD_W} height={CARD_H} radius={Radius.md} />
          <Skeleton width={CARD_W} height={CARD_H} radius={Radius.md} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  section: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.lg,
  },
  row: { flexDirection: "row", gap: 10 },
});
