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
import { Colors, FontSizes, Radius, Spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";

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
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
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
            colors={["rgba(0,0,0,0.2)", "rgba(0,0,0,0.6)", "#000000"]}
            locations={[0, 0.6, 1]}
            style={StyleSheet.absoluteFillObject}
          />
        </View>

        {/* Meta */}
        <View style={styles.meta}>
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
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  meta: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
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
    fontSize: 28,
    fontWeight: "900",
    color: Colors.white,
    letterSpacing: 0.3,
    marginBottom: 6,
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
    gap: 8,
    backgroundColor: Colors.red,
    borderRadius: Radius.md,
    paddingVertical: 14,
    shadowColor: Colors.red,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  playBtnLocked: {
    backgroundColor: Colors.muted,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  playBtnText: {
    fontSize: FontSizes.md,
    fontWeight: "800",
    color: Colors.white,
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
    fontSize: FontSizes.md,
    fontWeight: "800",
    color: Colors.white,
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
