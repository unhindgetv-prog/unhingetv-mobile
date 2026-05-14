import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import { Colors, Spacing, Radius } from "../../constants/theme";
import { Skeleton } from "./Skeleton";

const { width: W } = Dimensions.get("window");
const BANNER_H = Math.round(W * 0.55);

/**
 * Mirrors show/[slug] layout: tall banner, eyebrow + title + genre pills,
 * rating row, 3 description lines, big play CTA, then episode rows.
 */
export function ShowDetailSkeleton() {
  return (
    <ScrollView style={styles.root} showsVerticalScrollIndicator={false}>
      <Skeleton width={W} height={BANNER_H} radius={0} />

      <View style={styles.meta}>
        {/* Eyebrow */}
        <Skeleton width={120} height={11} style={{ marginBottom: 10 }} />

        {/* Genre pills */}
        <View style={{ flexDirection: "row", gap: 6, marginBottom: Spacing.sm }}>
          <Skeleton width={70} height={20} radius={Radius.full} />
          <Skeleton width={90} height={20} radius={Radius.full} />
          <Skeleton width={60} height={20} radius={Radius.full} />
        </View>

        {/* Title */}
        <Skeleton width={"75%"} height={40} radius={Radius.sm} style={{ marginBottom: 10 }} />

        {/* Rating row */}
        <Skeleton width={160} height={14} style={{ marginBottom: Spacing.md }} />

        {/* Description */}
        <Skeleton width={"100%"} height={12} style={{ marginBottom: 6 }} />
        <Skeleton width={"100%"} height={12} style={{ marginBottom: 6 }} />
        <Skeleton width={"60%"} height={12} style={{ marginBottom: Spacing.md }} />

        {/* Play button */}
        <Skeleton width={"100%"} height={52} radius={Radius.md} />
      </View>

      {/* Episodes section */}
      <View style={styles.epHeader}>
        <Skeleton width={90} height={11} style={{ marginBottom: 8 }} />
        <Skeleton width={140} height={26} radius={Radius.sm} style={{ marginBottom: 4 }} />
        <Skeleton width={40} height={3} radius={2} />
      </View>

      {/* Episode rows */}
      <View style={styles.episodes}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={styles.epBlock}>
            <Skeleton width={"100%"} height={48} radius={Radius.lg} />
            <View style={{ height: Spacing.sm }} />
            {[0, 1, 2].map((j) => (
              <View key={j} style={styles.epRow}>
                <Skeleton width={100} height={56} radius={Radius.sm} />
                <View style={{ flex: 1, gap: 6 }}>
                  <Skeleton width={70} height={9} />
                  <Skeleton width={"90%"} height={14} />
                  <Skeleton width={60} height={10} />
                </View>
              </View>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  meta: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  epHeader: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  episodes: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
    paddingBottom: 40,
  },
  epBlock: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  epRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 8,
  },
});
