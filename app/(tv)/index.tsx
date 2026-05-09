/**
 * Apple TV / Android TV Home Screen
 * 10-foot UI — D-pad / Siri Remote navigable, no touch assumed
 */
import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  ActivityIndicator,
  TVFocusGuideView,
  findNodeHandle,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { getShows, type Show } from "../../lib/api";
import { Colors, FontSizes, Spacing } from "../../constants/theme";

const { width: W, height: H } = Dimensions.get("window");

const NAV_ITEMS = ["Home", "Shows", "Search", "Account"];

function TVNavBar({ activeIndex, onSelect }: { activeIndex: number; onSelect: (i: number) => void }) {
  return (
    <View style={styles.navbar}>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>UNHINGE</Text>
        <View style={styles.logoBadge}><Text style={styles.logoTv}>TV</Text></View>
      </View>
      <View style={styles.navItems}>
        {NAV_ITEMS.map((item, i) => (
          <TouchableOpacity
            key={item}
            style={[styles.navItem, activeIndex === i && styles.navItemActive]}
            onPress={() => onSelect(i)}
            activeOpacity={0.7}
            hasTVPreferredFocus={i === 0}
          >
            <Text style={[styles.navLabel, activeIndex === i && styles.navLabelActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function TVShowCard({ show, focused }: { show: Show; focused: boolean }) {
  return (
    <View style={[styles.card, focused && styles.cardFocused]}>
      {show.thumbnail ? (
        <Image source={{ uri: show.thumbnail }} style={styles.cardImg} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImg, { backgroundColor: Colors.muted }]} />
      )}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.85)"]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={2}>{show.title}</Text>
        <View style={[styles.accessBadge, {
          backgroundColor: show.accessType === "FREE" ? Colors.green
            : show.accessType === "PPV" ? Colors.orange : Colors.blue,
        }]}>
          <Text style={styles.accessText}>
            {show.accessType === "FREE" ? "FREE" : show.accessType === "PPV" ? "PPV" : "MEMBERS"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function TVHomeScreen() {
  const [shows, setShows]     = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [focusedIdx, setFocusedIdx] = useState(0);
  const [navIdx, setNavIdx]   = useState(0);

  useEffect(() => {
    getShows()
      .then(setShows)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = shows.find((s) => s.featured) ?? shows[0];

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <TVNavBar activeIndex={navIdx} onSelect={setNavIdx} />

      {/* Hero */}
      {featured && (
        <View style={styles.hero}>
          {featured.banner || featured.thumbnail ? (
            <Image
              source={{ uri: (featured.banner ?? featured.thumbnail)! }}
              style={StyleSheet.absoluteFillObject}
              resizeMode="cover"
            />
          ) : null}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.97)"]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroContent}>
            <Text style={styles.heroTitle}>{featured.title}</Text>
            {featured.genre.length > 0 && (
              <Text style={styles.heroGenre}>{featured.genre.slice(0, 3).join("  ·  ")}</Text>
            )}
            <Text style={styles.heroDesc} numberOfLines={3}>{featured.description}</Text>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={() => router.push(`/show/${featured.slug}`)}
              activeOpacity={0.85}
              hasTVPreferredFocus={false}
            >
              <Text style={styles.playBtnText}>▶   WATCH NOW</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Shows row */}
      <View style={styles.rowSection}>
        <Text style={styles.rowLabel}>ALL SHOWS</Text>
        <FlatList
          data={shows}
          keyExtractor={(s) => s.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.rowContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onFocus={() => setFocusedIdx(index)}
              onPress={() => router.push(`/show/${item.slug}`)}
              activeOpacity={0.85}
            >
              <TVShowCard show={item} focused={focusedIdx === index} />
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}

const CARD_W = W * 0.18;
const CARD_H = CARD_W * 1.45;
const HERO_H = H * 0.62;

const styles = StyleSheet.create({
  root:       { flex: 1, backgroundColor: Colors.black },
  loader:     { flex: 1, backgroundColor: Colors.black, justifyContent: "center", alignItems: "center" },
  navbar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 60,
    paddingTop: 30,
    paddingBottom: 16,
    gap: 48,
    zIndex: 10,
  },
  logoRow:    { flexDirection: "row", alignItems: "center" },
  logoText:   { fontSize: 32, fontWeight: "900", color: Colors.white, letterSpacing: 4 },
  logoBadge:  { backgroundColor: Colors.red, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 6 },
  logoTv:     { fontSize: 20, fontWeight: "900", color: Colors.white },
  navItems:   { flexDirection: "row", gap: 8 },
  navItem:    { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 6 },
  navItemActive: { backgroundColor: Colors.red },
  navLabel:   { fontSize: 16, fontWeight: "700", color: Colors.textSub, letterSpacing: 1, textTransform: "uppercase" },
  navLabelActive: { color: Colors.white },
  hero: {
    width: W,
    height: HERO_H,
    marginTop: -80,
    overflow: "hidden",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 60,
    paddingBottom: 32,
  },
  heroTitle:  { fontSize: 52, fontWeight: "900", color: Colors.white, marginBottom: 8, maxWidth: W * 0.55 },
  heroGenre:  { fontSize: 16, color: Colors.textMuted, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 },
  heroDesc:   { fontSize: 18, color: Colors.textSub, lineHeight: 26, maxWidth: W * 0.45, marginBottom: 24 },
  playBtn: {
    backgroundColor: Colors.red,
    paddingHorizontal: 36,
    paddingVertical: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  playBtnText: { fontSize: 18, fontWeight: "900", color: Colors.white, letterSpacing: 2 },
  rowSection:  { paddingLeft: 60, paddingTop: 20 },
  rowLabel:    { fontSize: 13, fontWeight: "800", color: Colors.textMuted, letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 },
  rowContent:  { gap: 16, paddingRight: 60 },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: Colors.muted,
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardFocused: {
    borderColor: Colors.red,
    transform: [{ scale: 1.05 }],
  },
  cardImg:     { ...StyleSheet.absoluteFillObject as any },
  cardInfo:    { position: "absolute", bottom: 0, left: 0, right: 0, padding: 12 },
  cardTitle:   { fontSize: 15, fontWeight: "800", color: Colors.white, marginBottom: 6 },
  accessBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, alignSelf: "flex-start" },
  accessText:  { fontSize: 9, fontWeight: "800", color: Colors.white, letterSpacing: 0.8 },
});
