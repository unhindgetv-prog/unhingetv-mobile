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
import { Play, Star, Bell, Sparkles, Flame, Lock } from "lucide-react-native";
import { getShows, getComingSoonShows, type Show } from "../../lib/api";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "../../constants/theme";
import { BrandLogo } from "../../components/ui";

const { width: SCREEN_W } = Dimensions.get("window");
const HERO_HEIGHT = Math.round(SCREEN_W * 0.95);
const CARD_W = Math.round(SCREEN_W * 0.42);
const CARD_H = Math.round(CARD_W * 1.5);
const CS_CARD_W = Math.round(SCREEN_W * 0.66);
const CS_CARD_H = Math.round(CS_CARD_W * 1.45);

// ─── Section header with red underline + eyebrow ─────────────────────────────
function SectionHeader({ eyebrow, title, icon }: { eyebrow?: string; title: string; icon?: React.ReactNode }) {
  return (
    <View style={styles.sectionHeader}>
      {eyebrow && (
        <View style={styles.eyebrowRow}>
          {icon}
          <Text style={styles.eyebrow}>{eyebrow}</Text>
        </View>
      )}
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.titleUnderline} />
      </View>
    </View>
  );
}

// ─── Cinematic hero ──────────────────────────────────────────────────────────
function HeroCard({ show }: { show: Show }) {
  return (
    <TouchableOpacity
      activeOpacity={0.94}
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

      {/* Triple gradient — top fade-in, middle dark, bottom hard black */}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent", "rgba(0,0,0,0.45)", "rgba(0,0,0,0.98)"]}
        locations={[0, 0.25, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Left vignette for text legibility */}
      <LinearGradient
        colors={["rgba(0,0,0,0.7)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.7, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Red brand glow in bottom-left corner */}
      <View style={styles.heroGlow} />

      {/* Top badges */}
      <View style={styles.heroBadges}>
        {show.featured && (
          <View style={styles.featuredBadge}>
            <Star size={10} color={Colors.gold} fill={Colors.gold} />
            <Text style={styles.featuredText}>FEATURED</Text>
          </View>
        )}
        <View style={[styles.accessBadge, accessStyle(show.accessType)]}>
          <Text style={styles.accessText}>{accessLabel(show.accessType)}</Text>
        </View>
      </View>

      {/* Info */}
      <View style={styles.heroInfo}>
        <View style={styles.heroEyebrowRow}>
          <View style={styles.heroDot} />
          <Text style={styles.heroEyebrow}>NEW · ORIGINAL SERIES</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{show.title}</Text>
        {show.genre.length > 0 && (
          <Text style={styles.heroGenre}>{show.genre.slice(0, 3).join(" · ").toUpperCase()}</Text>
        )}
        {show.description && (
          <Text style={styles.heroDesc} numberOfLines={2}>{show.description}</Text>
        )}
        <View style={styles.heroBtnRow}>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => router.push(`/show/${show.slug}`)}
            activeOpacity={0.85}
          >
            <Play size={15} color={Colors.white} fill={Colors.white} />
            <Text style={styles.heroBtnText}>WATCH NOW</Text>
          </TouchableOpacity>
          {show.episodeCount != null && (
            <Text style={styles.heroEpCount}>{show.episodeCount} {show.episodeCount === 1 ? "episode" : "episodes"}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Standard portrait show card ─────────────────────────────────────────────
function ShowCard({ show, rank }: { show: Show; rank?: number }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.86}
      onPress={() => router.push(`/show/${show.slug}`)}
    >
      <View style={styles.cardImg}>
        {show.thumbnail ? (
          <Image source={{ uri: show.thumbnail }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.cardPlaceholder]}>
            <Play size={22} color={Colors.textFaint} />
          </View>
        )}
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.85)"]}
          locations={[0.45, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={[styles.accessPill, accessStyle(show.accessType)]}>
          <Text style={styles.accessPillText}>{accessLabel(show.accessType)}</Text>
        </View>
        {rank != null && (
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        )}
        <View style={styles.cardTitleOverlay}>
          <Text style={styles.cardTitleOnImg} numberOfLines={2}>{show.title}</Text>
          {show.avgRating != null && (
            <View style={styles.cardRatingRow}>
              <Star size={10} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.cardRatingText}>{show.avgRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Magazine-style Coming Soon card ─────────────────────────────────────────
function ComingSoonCard({ show }: { show: Show }) {
  const is21 = show.genre.some((g) => g.includes("21"));
  return (
    <TouchableOpacity
      style={styles.csCard}
      activeOpacity={0.92}
      onPress={() => router.push(`/show/${show.slug}`)}
    >
      <View style={styles.csImg}>
        {show.thumbnail ? (
          <Image source={{ uri: show.thumbnail }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.muted }]} />
        )}
        <LinearGradient
          colors={["rgba(0,0,0,0.25)", "transparent", "rgba(0,0,0,0.92)"]}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Coming Soon ribbon */}
        <View style={styles.csRibbon}>
          <View style={styles.csRibbonDot} />
          <Text style={styles.csRibbonText}>COMING SOON</Text>
        </View>
        {is21 && (
          <View style={styles.cs21Badge}>
            <Text style={styles.cs21Text}>21+</Text>
          </View>
        )}
        <View style={styles.csInfo}>
          <Text style={styles.csTitle} numberOfLines={2}>{show.title}</Text>
          {show.genre.length > 0 && (
            <Text style={styles.csGenre}>{show.genre.slice(0, 2).join(" · ").toUpperCase()}</Text>
          )}
          <View style={styles.csNotify}>
            <Bell size={11} color={Colors.white} />
            <Text style={styles.csNotifyText}>Notify Me</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function accessLabel(type: string) {
  if (type === "FREE") return "FREE";
  if (type === "PPV")  return "PPV";
  return "MEMBERS";
}
function accessStyle(type: string) {
  if (type === "FREE") return { backgroundColor: "rgba(34,197,94,0.85)", borderColor: Colors.green };
  if (type === "PPV")  return { backgroundColor: "rgba(249,115,22,0.85)", borderColor: Colors.orange };
  return { backgroundColor: "rgba(59,130,246,0.85)", borderColor: Colors.blue };
}

// ─── Screen ──────────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const [shows, setShows] = useState<Show[]>([]);
  const [comingSoon, setComingSoon] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    try {
      const [s, cs] = await Promise.all([getShows(), getComingSoonShows().catch(() => [])]);
      setShows(s);
      setComingSoon(cs);
    } catch {
      // keep stale
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  const featured = shows.find((s) => s.featured) ?? shows[0];
  const trending = shows.slice(0, 5);
  const free     = shows.filter((s) => s.accessType === "FREE");
  const members  = shows.filter((s) => s.accessType === "SUBSCRIPTION");
  const all      = shows;

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
        <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={Colors.red} />
      }
    >
      {/* Logo header — overlays hero */}
      <View style={styles.header}>
        <BrandLogo size="md" />
      </View>

      {/* Hero */}
      {featured && <HeroCard show={featured} />}

      {/* Trending Now */}
      {trending.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            eyebrow="WHAT'S HOT"
            title="Trending Now"
            icon={<Flame size={11} color={Colors.red} fill={Colors.red} />}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {trending.map((s, i) => <ShowCard key={s.id} show={s} rank={i + 1} />)}
          </ScrollView>
        </View>
      )}

      {/* Coming Soon — magazine cards */}
      {comingSoon.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            eyebrow="FRESH SLATE · ORIGINAL NETWORK"
            title="Coming Soon"
            icon={<Sparkles size={11} color={Colors.red} />}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.csRow}>
            {comingSoon.map((s) => <ComingSoonCard key={s.id} show={s} />)}
          </ScrollView>
        </View>
      )}

      {/* Free */}
      {free.length > 0 && (
        <View style={styles.section}>
          <SectionHeader eyebrow="ON THE HOUSE" title="Free to Watch" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {free.map((s) => <ShowCard key={s.id} show={s} />)}
          </ScrollView>
        </View>
      )}

      {/* Members Only */}
      {members.length > 0 && (
        <View style={styles.section}>
          <SectionHeader
            eyebrow="UNLOCK THE VAULT"
            title="Members Only"
            icon={<Lock size={10} color={Colors.red} />}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {members.map((s) => <ShowCard key={s.id} show={s} />)}
          </ScrollView>
        </View>
      )}

      {/* All Shows */}
      {all.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title="All Shows" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
            {all.map((s) => <ShowCard key={s.id} show={s} />)}
          </ScrollView>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },
  content: { paddingBottom: 20 },
  loader: { flex: 1, backgroundColor: Colors.black, justifyContent: "center", alignItems: "center" },

  // Header
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 52,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  logoRow: { flexDirection: "row", alignItems: "center" },
  logoText: { fontSize: 24, fontWeight: "900", color: Colors.white, letterSpacing: 3 },
  logoBadge: {
    backgroundColor: Colors.red,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    marginLeft: 5,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  logoTv: { fontSize: 16, fontWeight: "900", color: Colors.white, letterSpacing: 1 },

  // Hero
  hero: { width: SCREEN_W, height: HERO_HEIGHT, marginBottom: Spacing.lg, overflow: "hidden" },
  heroGlow: {
    position: "absolute",
    left: -80,
    bottom: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: Colors.red,
    opacity: 0.18,
  },
  heroBadges: {
    position: "absolute",
    top: 110,
    left: Spacing.md,
    flexDirection: "row",
    gap: 6,
  },
  featuredBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderWidth: 1,
    borderColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  featuredText: { fontSize: 10, fontWeight: "900", color: Colors.gold, letterSpacing: 1.2 },
  accessBadge: { borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1 },
  accessText: { fontSize: 10, fontWeight: "900", color: Colors.white, letterSpacing: 1.2 },

  heroInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.md, paddingBottom: Spacing.lg },
  heroEyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  heroDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red },
  heroEyebrow: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.red,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  heroTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 46,
    color: Colors.white,
    letterSpacing: 1.5,
    lineHeight: 44,
    marginBottom: 4,
    includeFontPadding: false,
  },
  heroGenre: { fontSize: 11, color: Colors.textSub, letterSpacing: 1.2, marginBottom: 6 },
  heroDesc: { fontSize: FontSizes.sm, color: Colors.textSub, lineHeight: 18, marginBottom: Spacing.md },
  heroBtnRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingHorizontal: 22,
    paddingVertical: 13,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 14,
    elevation: 8,
  },
  heroBtnText: {
    fontFamily: Fonts.barlow,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1.5,
  },
  heroEpCount: { fontSize: FontSizes.xs, color: Colors.textSub, fontWeight: "600" },

  // Section header
  section: { marginBottom: Spacing.xl },
  sectionHeader: { paddingHorizontal: Spacing.md, marginBottom: Spacing.md },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  eyebrow: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.red,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  titleRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  sectionTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 28,
    color: Colors.white,
    letterSpacing: 1.5,
    includeFontPadding: false,
    lineHeight: 28,
  },
  titleUnderline: {
    flex: 0,
    width: 40,
    height: 3,
    backgroundColor: Colors.red,
    marginBottom: 7,
    borderRadius: 2,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },

  // Standard show card row
  row: { paddingHorizontal: Spacing.md, gap: 10 },
  card: { width: CARD_W },
  cardImg: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  cardPlaceholder: { justifyContent: "center", alignItems: "center" },
  accessPill: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
  },
  accessPillText: { fontSize: 9, fontWeight: "900", color: Colors.white, letterSpacing: 0.8 },
  rankBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.red,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  rankText: { fontSize: 13, fontWeight: "900", color: Colors.white },
  cardTitleOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  cardTitleOnImg: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  cardRatingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 3 },
  cardRatingText: { fontSize: 10, color: Colors.gold, fontWeight: "700" },

  // Coming Soon
  csRow: { paddingHorizontal: Spacing.md, gap: 12 },
  csCard: {
    width: CS_CARD_W,
    height: CS_CARD_H,
    borderRadius: Radius.lg,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },
  csImg: { flex: 1 },
  csRibbon: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: Colors.red,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 8,
    elevation: 4,
  },
  csRibbonDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  csRibbonText: { fontSize: 10, fontWeight: "900", color: Colors.white, letterSpacing: 1 },
  cs21Badge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: Colors.gold,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  cs21Text: { fontSize: 10, fontWeight: "900", color: Colors.black, letterSpacing: 0.5 },
  csInfo: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 14 },
  csTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 28,
    color: Colors.white,
    letterSpacing: 1.2,
    marginBottom: 4,
    includeFontPadding: false,
    lineHeight: 28,
  },
  csGenre: { fontSize: 10, color: Colors.textSub, letterSpacing: 1.2, marginBottom: 10 },
  csNotify: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  csNotifyText: { fontSize: 11, fontWeight: "800", color: Colors.white, letterSpacing: 0.5 },
});
