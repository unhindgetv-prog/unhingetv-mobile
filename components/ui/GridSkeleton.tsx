import { View, StyleSheet, Dimensions } from "react-native";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { Skeleton } from "./Skeleton";

const { width: W } = Dimensions.get("window");
const COLS = 2;
const CARD_W = (W - Spacing.md * 2 - Spacing.sm) / COLS;
const CARD_H = CARD_W * 1.48;

/**
 * 2-column grid placeholder for /shows + /search results.
 * Header eyebrow + title bar + 8 portrait card skeletons (4 rows).
 */
export function GridSkeleton({ showHeader = true }: { showHeader?: boolean }) {
  const rows = [0, 1, 2, 3];
  return (
    <View style={styles.root}>
      {showHeader && (
        <View style={styles.header}>
          <Skeleton width={140} height={11} style={{ marginBottom: 8 }} />
          <Skeleton width={180} height={32} radius={Radius.sm} style={{ marginBottom: 14 }} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Skeleton width={64} height={28} radius={Radius.full} />
            <Skeleton width={64} height={28} radius={Radius.full} />
            <Skeleton width={76} height={28} radius={Radius.full} />
            <Skeleton width={56} height={28} radius={Radius.full} />
          </View>
        </View>
      )}
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row} style={styles.gridRow}>
            <Skeleton width={CARD_W} height={CARD_H} radius={Radius.md} />
            <Skeleton width={CARD_W} height={CARD_H} radius={Radius.md} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  grid: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: 12,
  },
  gridRow: { flexDirection: "row", gap: 12 },
});
