import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { ArrowLeft, AlertCircle } from "lucide-react-native";
import { getEpisode, saveProgress, type Episode } from "../../lib/api";
import { Colors, FontSizes, Radius, Spacing } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const VIDEO_H = SCREEN_W * (9 / 16);

const MUX_STREAM_BASE = "https://stream.mux.com";

export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();

  const [episode, setEpisode]   = useState<Episode | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const progressRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Build HLS URL from Mux playback ID
  const muxUrl = episode?.muxPlaybackId
    ? `${MUX_STREAM_BASE}/${episode.muxPlaybackId}.m3u8`
    : null;

  const player = useVideoPlayer(muxUrl ?? "", (p) => {
    p.loop = false;
    p.play();
  });

  // Load episode metadata
  useEffect(() => {
    if (!id) return;
    getEpisode(id)
      .then((ep) => {
        setEpisode(ep);
        if (ep.muxStatus !== "READY") {
          setError("This video is not ready yet. Please try again later.");
        }
      })
      .catch((err) => setError(err.message ?? "Failed to load episode."))
      .finally(() => setLoading(false));
  }, [id]);

  // Save progress every 15 seconds
  useEffect(() => {
    if (!episode || !token) return;
    saveTimerRef.current = setInterval(() => {
      const pos = player.currentTime ?? 0;
      if (pos > 0 && Math.abs(pos - progressRef.current) > 5) {
        progressRef.current = pos;
        saveProgress(episode.id, Math.round(pos), token).catch(() => {});
      }
    }, 15_000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [episode, token, player]);

  // Hide status bar for immersive video
  useEffect(() => {
    StatusBar.setHidden(true, "fade");
    return () => StatusBar.setHidden(false, "fade");
  }, []);

  if (loading) {
    return (
      <View style={styles.fullscreenCenter}>
        <ActivityIndicator color={Colors.red} size="large" />
      </View>
    );
  }

  if (error || !episode) {
    return (
      <View style={styles.fullscreenCenter}>
        <AlertCircle size={40} color={Colors.red} style={{ marginBottom: 12 }} />
        <Text style={styles.errorText}>{error ?? "Episode not found."}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Video player */}
      <View style={styles.videoContainer}>
        {muxUrl ? (
          <VideoView
            player={player}
            style={styles.video}
            contentFit="contain"
            nativeControls
          />
        ) : (
          <View style={[styles.video, styles.videoFallback]}>
            <ActivityIndicator color={Colors.red} />
          </View>
        )}
      </View>

      {/* Episode info below video */}
      <View style={styles.info}>
        <Text style={styles.epTitle} numberOfLines={2}>{episode.title}</Text>
        {episode.description != null && (
          <Text style={styles.epDesc} numberOfLines={3}>{episode.description}</Text>
        )}
        {episode.duration != null && (
          <Text style={styles.epDuration}>{Math.round(episode.duration / 60)} min</Text>
        )}
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          // Final progress save on exit
          const pos = player.currentTime ?? 0;
          if (pos > 0 && token && episode) {
            saveProgress(episode.id, Math.round(pos), token).catch(() => {});
          }
          router.back();
        }}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
  fullscreenCenter: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
  },
  errorText: {
    fontSize: FontSizes.md,
    color: Colors.textSub,
    textAlign: "center",
    marginBottom: Spacing.md,
  },
  backLink: {
    paddingVertical: 10,
    paddingHorizontal: Spacing.lg,
  },
  backLinkText: {
    fontSize: FontSizes.md,
    color: Colors.red,
    fontWeight: "700",
  },
  videoContainer: {
    width: SCREEN_W,
    height: VIDEO_H,
    backgroundColor: "#000",
  },
  video: {
    width: SCREEN_W,
    height: VIDEO_H,
  },
  videoFallback: {
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    padding: Spacing.md,
    flex: 1,
  },
  epTitle: {
    fontSize: FontSizes.xl,
    fontWeight: "800",
    color: Colors.white,
    marginBottom: 8,
  },
  epDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    lineHeight: 20,
    marginBottom: 8,
  },
  epDuration: {
    fontSize: FontSizes.xs,
    color: Colors.textFaint,
  },
  backBtn: {
    position: "absolute",
    top: Platform.OS === "ios" ? 52 : 16,
    left: Spacing.md,
    width: 38,
    height: 38,
    borderRadius: Radius.full,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
});
