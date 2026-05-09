import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Play, Star, Clock } from "lucide-react-native";
import { getShows, type Show } from "../../lib/api";
import { Colors, FontSizes, Radius, Spacing } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_HEIGHT = SCREEN_W * 0.58;
const CARD_W = SCREEN_W * 0.42;
const CARD_H = CARD_W * 1.45;

function HeroCard({ show }: { show: Show }) {
  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => router.push(`/show/${show.slug}`)}
      style={styles.hero}
    >
      {show.banner || show.thumbnail ? (
        <Image
          source={{ uri: (show.banner ?? show.thumbnail)! }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.muted }]} />
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.96)"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Badges */}
      <View style={styles.heroBadges}>
        {show.featured && (
          <View style={styles.featuredBadge}>
            <Star size={9} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}
        <View style={[styles.accessBadge, { backgroundColor: accessColor(show.accessType) }]}>
          <Text style={styles.accessText}>{accessLabel(show.accessType)}</Text>
        </View>
      </View>
      {/* Info */}
      <View style={styles.heroInfo}>
        <Text style={styles.heroTitle} numberOfLines={2}>{show.title}</Text>
        {show.genre.length > 0 && (
          <Text style={styles.heroGenre}>{show.genre.slice(0, 3).join(" · ")}</Text>
        )}
        <TouchableOpacity
          style={styles.heroBtn}
          onPress={() => router.push(`/show/${show.slug}`)}
          activeOpacity={0.85}
        >
          <Play size={14} color={Colors.white} fill={Colors.white} />
          <Text style={styles.heroBtnText}>Watch Now</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
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
            <Play size={22} color={Colors.textFaint} />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          locations={[0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.accessPill, { backgroundColor: accessColor(show.accessType) }]}>
          <Text style={styles.accessPillText}>{accessLabel(show.accessType)}</Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{show.title}</Text>
      {show.avgRating != null && (
        <View style={styles.cardRating}>
          <Star size={10} color={Colors.gold} fill={Colors.gold} />
          <Text style={styles.cardRatingText}>{show.avgRating.toFixed(1)}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function accessLabel(type: string) {
  if (type === "FREE") return "FREE";
  if (type === "PPV")  return "PPV";
  return "MEMBERS";
}

function accessColor(type: string) {
  if (type === "FREE") return Colors.green;
  if (type === "PPV")  return Colors.orange;
  return Colors.blue;
}

export default function HomeScreen() {
  const [shows, setShows]       = useState<Show[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await getShows();
      setShows(data);
    } catch {
      // silently fail — keep stale data
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const featured  = shows.find((s) => s.featured) ?? shows[0];
  const free      = shows.filter((s) => s.accessType === "FREE");
  const members   = shows.filter((s) => s.accessType === "SUBSCRIPTION");
  const allShows  = shows;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={Colors.red}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>UNHINGE</Text>
          <View style={styles.logoBadge}>
            <Text style={styles.logoTv}>TV</Text>
          </View>
        </View>
      </View>

      {/* Hero */}
      {featured && <HeroCard show={featured} />}

      {/* Free section */}
      {free.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Free to Watch</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {free.map((s) => <ShowCard key={s.id} show={s} />)}
          </ScrollView>
        </View>
      )}

      {/* Members section */}
      {members.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Members Only</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {members.map((s) => <ShowCard key={s.id} show={s} />)}
          </ScrollView>
        </View>
      )}

      {/* All shows */}
      {allShows.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Shows</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {allShows.map((s) => <ShowCard key={s.id} show={s} />)}
          </ScrollView>
        </View>
      )}

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  content: {
    paddingBottom: 20,
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
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontSize: 24,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 3,
  },
  logoBadge: {
    backgroundColor: Colors.red,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 5,
  },
  logoTv: {
    fontSize: 16,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 1,
  },
  hero: {
    width: SCREEN_W,
    height: HERO_HEIGHT,
    marginBottom: Spacing.lg,
    overflow: "hidden",
  },
  heroBadges: {
    position: "absolute",
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: "row",
    gap: 6,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.gold,
    letterSpacing: 1,
  },
  accessBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  accessText: {
    fontSize: 9,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 1,
  },
  heroInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
  },
  heroTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "900",
    color: Colors.white,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  heroGenre: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    alignSelf: "flex-start",
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  heroBtnText: {
    fontSize: FontSizes.sm,
    fontWeight: "800",
    color: Colors.white,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: "800",
    color: Colors.white,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  row: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
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
    marginBottom: Spacing.xs,
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
  accessPillText: {
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
  cardRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  cardRatingText: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontWeight: "600",
  },
});
