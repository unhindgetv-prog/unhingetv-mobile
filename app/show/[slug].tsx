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
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Play,
  Star,
  Clock,
  Lock,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import { getShow, type Show, type Season, type Episode } from "../../lib/api";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { ShowDetailSkeleton } from "../../components/ui";

const { width: SCREEN_W } = Dimensions.get("window");
const BANNER_H = SCREEN_W * 0.55;

function EpisodeRow({
  ep,
  showSlug,
  canWatch,
}: {
  ep: Episode;
  showSlug: string;
  canWatch: boolean;
}) {
  const locked = !ep.isFree && !canWatch;

  return (
    <TouchableOpacity
      style={[styles.epRow, locked && styles.epRowLocked]}
      activeOpacity={locked ? 0.6 : 0.85}
      onPress={() => {
        if (locked) {
          router.push("/(auth)/login");
          return;
        }
        router.push(`/watch/${ep.id}`);
      }}
    >
      {/* Thumbnail */}
      <View style={styles.epThumb}>
        {ep.thumbnail ? (
          <Image
            source={{ uri: ep.thumbnail }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { justifyContent: "center", alignItems: "center" }]}>
            <Play size={18} color={Colors.textFaint} />
          </View>
        )}
        {locked && (
          <View style={styles.lockOverlay}>
            <Lock size={14} color={Colors.white} />
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.epInfo}>
        <Text style={styles.epNum}>Episode {ep.number}</Text>
        <Text style={styles.epTitle} numberOfLines={2}>{ep.title}</Text>
        {ep.duration != null && (
          <View style={styles.epDurationRow}>
            <Clock size={10} color={Colors.textFaint} />
            <Text style={styles.epDuration}>{Math.round(ep.duration / 60)} min</Text>
          </View>
        )}
      </View>

      {locked
        ? <Lock size={14} color={Colors.textFaint} />
        : <Play size={14} color={Colors.textFaint} />
      }
    </TouchableOpacity>
  );
}

export default function ShowDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { user, token } = useAuth();

  const [show, setShow]       = useState<Show | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    getShow(slug)
      .then(({ show, seasons }) => {
        setShow(show);
        setSeasons(seasons);
        // Default: open first season
        if (seasons.length > 0) {
          setExpanded(new Set([seasons[0].id]));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [slug]);

  const canWatch =
    !!user &&
    (show?.accessType === "FREE" ||
      user.subscription?.status === "ACTIVE" ||
      user.subscription?.status === "TRIALING");

  if (loading) {
    return <ShowDetailSkeleton />;
  }

  if (!show) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: Colors.textMuted }}>Show not found.</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: Colors.red }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const firstEp = seasons[0]?.episodes[0];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <View style={{ height: BANNER_H }}>
          {show.banner ?? show.thumbnail ? (
            <Image
              source={{ uri: (show.banner ?? show.thumbnail)! }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: Colors.muted }]} />
          )}
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "transparent", "rgba(0,0,0,0.4)", "#000000"]}
            locations={[0, 0.25, 0.65, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.bannerGlow} />
        </View>

        {/* Meta */}
        <View style={styles.meta}>
          <View style={styles.eyebrowRow}>
            <View style={styles.eyebrowDot} />
            <Text style={styles.eyebrow}>ORIGINAL SERIES</Text>
          </View>
          <View style={styles.genreRow}>
            {show.genre.slice(0, 3).map((g) => (
              <View key={g} style={styles.genrePill}>
                <Text style={styles.genreText}>{g}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>{show.title}</Text>

          {show.avgRating != null && (
            <View style={styles.ratingRow}>
              <Star size={13} color={Colors.gold} fill={Colors.gold} />
              <Text style={styles.rating}>{show.avgRating.toFixed(1)}</Text>
              {show.episodeCount != null && (
                <Text style={styles.epCountText}> · {show.episodeCount} episodes</Text>
              )}
            </View>
          )}

          {/* Description */}
          <TouchableOpacity onPress={() => setDescExpanded(!descExpanded)} activeOpacity={0.9}>
            <Text
              style={styles.description}
              numberOfLines={descExpanded ? undefined : 3}
            >
              {show.description}
            </Text>
            <Text style={styles.readMore}>{descExpanded ? "Show less ▲" : "Read more ▼"}</Text>
          </TouchableOpacity>

          {/* Play first episode */}
          {firstEp && (
            <TouchableOpacity
              style={[styles.playBtn, !canWatch && firstEp.isFree === false && styles.playBtnLocked]}
              onPress={() => {
                if (!canWatch && !firstEp.isFree) {
                  router.push("/(auth)/login");
                  return;
                }
                router.push(`/watch/${firstEp.id}`);
              }}
              activeOpacity={0.88}
            >
              {canWatch || firstEp.isFree
                ? <Play size={16} color={Colors.white} fill={Colors.white} />
                : <Lock size={16} color={Colors.white} />
              }
              <Text style={styles.playBtnText}>
                {canWatch || firstEp.isFree ? "Play Episode 1" : "Subscribe to Watch"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Seasons & Episodes */}
        <View style={styles.seasonsHeader}>
          <Text style={styles.seasonsEyebrow}>WATCH</Text>
          <View style={styles.seasonsTitleRow}>
            <Text style={styles.seasonsTitle}>Episodes</Text>
            <View style={styles.seasonsUnderline} />
          </View>
        </View>
        <View style={styles.seasons}>
          {seasons.map((season) => {
            const open = expanded.has(season.id);
            return (
              <View key={season.id} style={styles.seasonBlock}>
                <TouchableOpacity
                  style={styles.seasonHeader}
                  onPress={() => {
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (open) next.delete(season.id);
                      else next.add(season.id);
                      return next;
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.seasonTitle}>
                    {season.title ?? `Season ${season.number}`}
                  </Text>
                  <Text style={styles.seasonEpCount}>{season.episodes.length} episodes</Text>
                  {open
                    ? <ChevronUp size={16} color={Colors.textMuted} />
                    : <ChevronDown size={16} color={Colors.textMuted} />
                  }
                </TouchableOpacity>

                {open && season.episodes.map((ep) => (
                  <EpisodeRow
                    key={ep.id}
                    ep={ep}
                    showSlug={show.slug}
                    canWatch={canWatch}
                  />
                ))}
              </View>
            );
          })}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        activeOpacity={0.85}
      >
        <ArrowLeft size={20} color={Colors.white} />
      </TouchableOpacity>
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
  backBtn: {
    position: "absolute",
    top: 52,
    left: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: "center",
    alignItems: "center",
  },
  meta: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  bannerGlow: {
    position: "absolute",
    left: -60,
    bottom: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: Colors.red,
    opacity: 0.2,
  },
  eyebrowRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  eyebrowDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.red },
  eyebrow: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.red,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  seasonsHeader: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md },
  seasonsEyebrow: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.red,
    letterSpacing: 2,
    marginBottom: 4,
  },
  seasonsTitleRow: { flexDirection: "row", alignItems: "flex-end", gap: 10 },
  seasonsTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 28,
    color: Colors.white,
    letterSpacing: 1.5,
    includeFontPadding: false,
    lineHeight: 28,
  },
  seasonsUnderline: {
    width: 40, height: 3, backgroundColor: Colors.red, marginBottom: 7, borderRadius: 2,
    shadowColor: Colors.red, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6, elevation: 3,
  },
  genreRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: Spacing.sm,
  },
  genrePill: {
    backgroundColor: Colors.muted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  genreText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  title: {
    fontFamily: Fonts.bebas,
    fontSize: 42,
    color: Colors.white,
    letterSpacing: 1.5,
    marginBottom: 6,
    includeFontPadding: false,
    lineHeight: 42,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: Spacing.sm,
  },
  rating: {
    fontSize: FontSizes.sm,
    color: Colors.gold,
    fontWeight: "700",
  },
  epCountText: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
  },
  description: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    lineHeight: 20,
  },
  readMore: {
    fontSize: FontSizes.xs,
    color: Colors.red,
    fontWeight: "600",
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingVertical: 16,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 16,
    elevation: 10,
  },
  playBtnLocked: {
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  playBtnText: {
    fontFamily: Fonts.barlow,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  seasons: {
    paddingHorizontal: Spacing.md,
  },
  seasonBlock: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  seasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: 8,
  },
  seasonTitle: {
    flex: 1,
    fontFamily: Fonts.bebas,
    fontSize: 22,
    color: Colors.white,
    letterSpacing: 1.2,
    includeFontPadding: false,
  },
  seasonEpCount: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginRight: 4,
  },
  epRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.cardBorder,
  },
  epRowLocked: {
    opacity: 0.55,
  },
  epThumb: {
    width: 100,
    aspectRatio: 16 / 9,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    flexShrink: 0,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  epInfo: {
    flex: 1,
    gap: 2,
  },
  epNum: {
    fontSize: 10,
    color: Colors.textFaint,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  epTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 17,
  },
  epDurationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 2,
  },
  epDuration: {
    fontSize: 10,
    color: Colors.textFaint,
  },
});
