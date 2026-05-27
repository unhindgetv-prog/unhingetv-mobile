import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Star } from "lucide-react-native";
import { getShows, type Show } from "../../lib/api";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "../../constants/theme";
import { GridSkeleton } from "../../components/ui";

const { width: SCREEN_W } = Dimensions.get("window");
const NUM_COLS = 2;
const CARD_W   = (SCREEN_W - Spacing.md * 2 - Spacing.sm) / NUM_COLS;
const CARD_H   = CARD_W * 1.48;

type FilterType = "ALL" | "FREE" | "SUBSCRIPTION" | "PPV";

const FILTERS: { label: string; value: FilterType }[] = [
  { label: "All",     value: "ALL" },
  { label: "Free",    value: "FREE" },
  { label: "Members", value: "SUBSCRIPTION" },
  { label: "PPV",     value: "PPV" },
];

function accessStyle(type: string) {
  if (type === "FREE") return { backgroundColor: "rgba(34,197,94,0.85)", borderColor: Colors.green };
  if (type === "PPV")  return { backgroundColor: "rgba(249,115,22,0.85)", borderColor: Colors.orange };
  return { backgroundColor: "rgba(59,130,246,0.85)", borderColor: Colors.blue };
}
function accessLabel(type: string) {
  if (type === "FREE") return "FREE";
  if (type === "PPV")  return "PPV";
  return "MEMBERS";
}

function ShowCard({ show }: { show: Show }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.86}
      onPress={() => router.push(`/show/${show.slug}`)}
    >
      <View style={styles.cardImg}>
        {show.thumbnail ? (
          <Image
            source={{ uri: show.thumbnail }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, styles.cardPlaceholder]}>
            <Play size={24} color={Colors.textFaint} />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.9)"]}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.accessPill, accessStyle(show.accessType)]}>
          <Text style={styles.accessText}>{accessLabel(show.accessType)}</Text>
        </View>
        <View style={styles.titleOverlay}>
          <Text style={styles.cardTitle} numberOfLines={2}>{show.title}</Text>
          <View style={styles.metaRow}>
            {show.avgRating != null && (
              <>
                <Star size={9} color={Colors.gold} fill={Colors.gold} />
                <Text style={styles.ratingText}>{show.avgRating.toFixed(1)}</Text>
              </>
            )}
            {show.episodeCount != null && (
              <Text style={styles.epCount}>{show.avgRating != null ? "· " : ""}{show.episodeCount} {show.episodeCount === 1 ? "ep" : "eps"}</Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ShowsScreen() {
  const [shows, setShows]       = useState<Show[]>([]);
  const [filter, setFilter]     = useState<FilterType>("ALL");
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getShows();
      setShows(data);
    } catch {
      // keep stale
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = filter === "ALL"
    ? shows
    : shows.filter((s) => s.accessType === filter);

  if (loading) {
    return <GridSkeleton />;
  }

  return (
    <View style={styles.root}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.eyebrow}>BROWSE THE NETWORK</Text>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Shows</Text>
          <View style={styles.titleUnderline} />
        </View>

        {/* Filter pills */}
        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.pill, filter === f.value && styles.pillActive]}
              onPress={() => setFilter(f.value)}
              activeOpacity={0.8}
            >
              <Text style={[styles.pillText, filter === f.value && styles.pillTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={NUM_COLS}
        renderItem={({ item }) => <ShowCard show={item} />}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={Colors.red}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No shows found</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loader: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.black,
  },
  eyebrow: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.red,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 10, marginBottom: Spacing.md },
  pageTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 36,
    color: Colors.white,
    letterSpacing: 2,
    includeFontPadding: false,
    lineHeight: 36,
  },
  titleUnderline: {
    width: 48,
    height: 3,
    backgroundColor: Colors.red,
    marginBottom: 10,
    borderRadius: 2,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  filters: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: Colors.card,
  },
  pillActive: {
    backgroundColor: Colors.red,
    borderColor: Colors.red,
  },
  pillText: {
    fontSize: FontSizes.xs,
    fontWeight: "700",
    color: Colors.textMuted,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  pillTextActive: {
    color: Colors.white,
  },
  grid: {
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  columnWrapper: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  card: {
    width: CARD_W,
  },
  cardImg: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  accessPill: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
  },
  accessText: {
    fontSize: 9,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 0.8,
  },
  titleOverlay: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 10 },
  cardTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 0.3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  ratingText: {
    fontSize: 10,
    color: Colors.gold,
    fontWeight: "700",
  },
  epCount: {
    fontSize: 10,
    color: Colors.textSub,
    fontWeight: "600",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textMuted,
  },
});
