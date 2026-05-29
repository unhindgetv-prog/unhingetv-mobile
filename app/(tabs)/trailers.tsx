import { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Video from "react-native-video";
import { Play, X } from "lucide-react-native";
import { getTrailers, type Trailer } from "../../lib/api";
import { Colors, Fonts, FontSizes, Radius, Spacing } from "../../constants/theme";

function fmt(s: number | null) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  return `${m}:${String(Math.round(s % 60)).padStart(2, "0")}`;
}

export default function TrailersScreen() {
  const insets = useSafeAreaInsets();
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<Trailer | null>(null);

  useEffect(() => {
    getTrailers()
      .then(setTrailers)
      .catch(() => setTrailers([]))
      .finally(() => setLoading(false));
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Trailer }) => (
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => setActive(item)}>
        <View style={styles.posterWrap}>
          <Image source={{ uri: item.posterUrl }} style={styles.poster} resizeMode="cover" />
          <View style={styles.playOverlay}>
            <View style={styles.playBtn}>
              <Play size={22} color={Colors.white} fill={Colors.white} />
            </View>
          </View>
          {item.durationSeconds ? <Text style={styles.dur}>{fmt(item.durationSeconds)}</Text> : null}
          <Text style={styles.badge}>TRAILER</Text>
        </View>
        <Text style={styles.showTitle} numberOfLines={1}>{item.showTitle}</Text>
        <Text style={styles.sub}>Official Trailer</Text>
      </TouchableOpacity>
    ),
    []
  );

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
      <Text style={styles.h1}>Trailers</Text>
      <Text style={styles.intro}>Official trailers — free to watch.</Text>

      {loading ? (
        <ActivityIndicator color={Colors.red} style={{ marginTop: 40 }} />
      ) : trailers.length === 0 ? (
        <Text style={styles.empty}>No trailers yet. Check back soon.</Text>
      ) : (
        <FlatList
          data={trailers}
          keyExtractor={(t) => t.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal visible={!!active} animationType="fade" onRequestClose={() => setActive(null)} supportedOrientations={["portrait", "landscape"]}>
        <View style={styles.player}>
          <StatusBar hidden />
          {active && (
            <Video
              source={{ uri: active.streamUrl }}
              style={StyleSheet.absoluteFill}
              resizeMode="contain"
              controls
              paused={false}
              onEnd={() => setActive(null)}
            />
          )}
          <TouchableOpacity style={[styles.close, { top: insets.top + 8 }]} onPress={() => setActive(null)}>
            <X size={22} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black, paddingHorizontal: Spacing.md },
  h1: { fontFamily: Fonts.bebas, fontSize: 40, color: Colors.white, letterSpacing: 1 },
  intro: { fontFamily: Fonts.barlow, color: "rgba(255,255,255,0.5)", fontSize: FontSizes.sm, marginTop: 2 },
  empty: { color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 40, fontFamily: Fonts.barlow },
  card: { marginBottom: Spacing.lg },
  posterWrap: { aspectRatio: 16 / 9, borderRadius: Radius.lg, overflow: "hidden", backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder },
  poster: { ...StyleSheet.absoluteFillObject, width: "100%", height: "100%" },
  playOverlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.25)" },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(204,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  dur: { position: "absolute", bottom: 8, right: 8, color: Colors.white, fontSize: 11, fontWeight: "700", backgroundColor: "rgba(0,0,0,0.7)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  badge: { position: "absolute", top: 8, left: 8, color: Colors.white, fontSize: 9, fontWeight: "900", letterSpacing: 1.5, backgroundColor: "rgba(204,0,0,0.92)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, overflow: "hidden" },
  showTitle: { fontFamily: Fonts.barlow, color: Colors.white, fontWeight: "700", fontSize: FontSizes.md, marginTop: 8 },
  sub: { fontFamily: Fonts.barlow, color: "rgba(255,255,255,0.4)", fontSize: FontSizes.xs },
  player: { flex: 1, backgroundColor: "#000", alignItems: "center", justifyContent: "center" },
  close: { position: "absolute", right: 16, width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
});
