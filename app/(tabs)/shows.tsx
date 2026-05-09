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
import { Colors, FontSizes, Radius, Spacing } from "../../constants/theme";

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

function accessColor(type: string) {
  if (type === "FREE") return Colors.green;
  if (type === "PPV")  return Colors.orange;
  return Colors.blue;
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
      activeOpacity={0.88}
      onPress={() => router.push(`/show/${show.slug}`)}
    >
      <View style={styles.cardImg}>
        {show.thumbnail ? (
          <Image
            source={{ uri: show.thumbnail }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.cardPlaceholder]}>
            <Play size={24} color={Colors.textFaint} />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.75)"]}
          locations={[0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.accessPill, { backgroundColor: accessColor(show.accessType) }]}>
          <Text style={styles.accessText}>{accessLabel(show.accessType)}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{show.title}</Text>
      {show.avgRating != null && (
        <View style={styles.ratingRow}>
          <Star size={10} color={Colors.gold} fill={Colors.gold} />
          <Text style={styles.ratingText}>{show.avgRating.toFixed(1)}</Text>
          {show.episodeCount != null && (
            <Text style={styles.epCount}> · {show.episodeCount} eps</Text>
          )}
        </View>
      )}
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
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Fixed Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Shows</Text>

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
  pageTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
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
    marginBottom: 6,
  },
  cardPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  accessPill: {
    position: "absolute",
    top: 6,
    left: 6,
    borderRadius: Radius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  accessText: {
    fontSize: 8,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 17,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  ratingText: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontWeight: "600",
  },
  epCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
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
