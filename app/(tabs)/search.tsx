import { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Search, X, Film, Play } from "lucide-react-native";
import { search, type SearchResults } from "../../lib/api";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "../../constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");

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

export default function SearchScreen() {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResults | null>(null);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults(null);
      setSearched(false);
      return;
    }
    setLoading(true);
    try {
      const data = await search(q.trim());
      setResults(data);
      setSearched(true);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const hasShows    = (results?.shows?.length ?? 0) > 0;
  const hasEpisodes = (results?.episodes?.length ?? 0) > 0;
  const hasResults  = hasShows || hasEpisodes;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Search</Text>

        {/* Search bar */}
        <View style={[styles.bar, query.length > 0 && styles.barActive]}>
          {loading
            ? <ActivityIndicator size="small" color={Colors.red} style={{ marginRight: 8 }} />
            : <Search size={18} color={Colors.textMuted} style={{ marginRight: 8 }} />
          }
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search shows, episodes..."
            placeholderTextColor={Colors.textFaint}
            returnKeyType="search"
            clearButtonMode="never"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Empty state */}
        {!query && !searched && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Search size={30} color={`${Colors.red}99`} />
            </View>
            <Text style={styles.emptyTitle}>Find your next show</Text>
            <Text style={styles.emptySub}>Search by title, genre, or episode name</Text>
          </View>
        )}

        {/* No results */}
        {searched && !hasResults && !loading && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: Colors.muted }]}>
              <Film size={28} color={Colors.textFaint} />
            </View>
            <Text style={styles.emptyTitle}>No results for "{query}"</Text>
            <Text style={styles.emptySub}>Try a different keyword</Text>
          </View>
        )}

        {/* Shows */}
        {hasShows && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Film size={14} color={Colors.red} />
              <Text style={styles.sectionTitle}>Shows</Text>
              <Text style={styles.sectionCount}>{results!.shows.length}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {results!.shows.map((show) => (
                <TouchableOpacity
                  key={show.id}
                  style={styles.showCard}
                  activeOpacity={0.85}
                  onPress={() => router.push(`/show/${show.slug}`)}
                >
                  <View style={styles.showCardImg}>
                    {show.thumbnail ? (
                      <Image
                        source={{ uri: show.thumbnail }}
                        style={StyleSheet.absoluteFillObject}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[StyleSheet.absoluteFillObject, { justifyContent: "center", alignItems: "center" }]}>
                        <Film size={20} color={Colors.textFaint} />
                      </View>
                    )}
                    <View style={[styles.showAccessPill, { backgroundColor: accessColor(show.accessType) }]}>
                      <Text style={styles.showAccessText}>{accessLabel(show.accessType)}</Text>
                    </View>
                  </View>
                  <Text style={styles.showCardTitle} numberOfLines={2}>{show.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Episodes */}
        {hasEpisodes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Play size={14} color={Colors.red} />
              <Text style={styles.sectionTitle}>Episodes</Text>
              <Text style={styles.sectionCount}>{results!.episodes.length}</Text>
            </View>
            {results!.episodes.map((ep) => (
              <TouchableOpacity
                key={ep.id}
                style={styles.epRow}
                activeOpacity={0.85}
                onPress={() => router.push(`/watch/${ep.id}`)}
              >
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
                </View>
                <View style={styles.epInfo}>
                  <Text style={styles.epShowTitle} numberOfLines={1}>{ep.showTitle}</Text>
                  <Text style={styles.epTitle} numberOfLines={2}>{ep.title}</Text>
                </View>
                <Play size={14} color={Colors.textFaint} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const SHOW_CARD_W = SCREEN_W * 0.38;
const SHOW_CARD_H = SHOW_CARD_W * 1.45;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    paddingTop: 56,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.black,
  },
  pageTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 36,
    color: Colors.white,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
    includeFontPadding: false,
    lineHeight: 36,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  barActive: {
    borderColor: Colors.red,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.white,
    padding: 0,
  },
  scroll: {
    flex: 1,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: Radius.full,
    backgroundColor: `${Colors.red}18`,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 26,
    color: Colors.white,
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: 1.2,
    includeFontPadding: false,
  },
  emptySub: {
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: "center",
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.red,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  sectionCount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 2,
  },
  row: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  showCard: {
    width: SHOW_CARD_W,
  },
  showCardImg: {
    width: SHOW_CARD_W,
    height: SHOW_CARD_H,
    borderRadius: Radius.md,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    marginBottom: 6,
  },
  showAccessPill: {
    position: "absolute",
    top: 5,
    left: 5,
    borderRadius: Radius.full,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  showAccessText: {
    fontSize: 8,
    fontWeight: "800",
    color: Colors.white,
    letterSpacing: 0.4,
  },
  showCardTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.white,
    lineHeight: 16,
  },
  epRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.cardBorder,
  },
  epThumb: {
    width: 108,
    aspectRatio: 16 / 9,
    borderRadius: Radius.sm,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    flexShrink: 0,
  },
  epInfo: {
    flex: 1,
    gap: 3,
  },
  epShowTitle: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  epTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.white,
    lineHeight: 17,
  },
});
