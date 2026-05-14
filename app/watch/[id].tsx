import { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { VideoView, useVideoPlayer } from "expo-video";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as ScreenOrientation from "expo-screen-orientation";
import { ArrowLeft, AlertCircle, Maximize2, Play } from "lucide-react-native";
import { getEpisode, saveProgress, type Episode } from "../../lib/api";
import {
  Colors,
  Fonts,
  FontSizes,
  Radius,
  Spacing,
  Glow,
} from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { useTVRemote } from "../../hooks/useTVRemote";
import { PrimaryButton, Skeleton } from "../../components/ui";

const MUX_STREAM_BASE = "https://stream.mux.com";

export default function WatchScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const insets = useSafeAreaInsets();
  // Re-renders on rotation so the video container snaps to the new dimensions
  // without remounting the VideoView (preserves playback state).
  const { width: winW, height: winH } = useWindowDimensions();
  const isLandscape = winW > winH;

  const [episode, setEpisode] = useState<Episode | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const progressRef = useRef<number>(0);
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<VideoView | null>(null);

  // Build HLS URL from Mux playback ID
  const muxUrl = episode?.muxPlaybackId
    ? `${MUX_STREAM_BASE}/${episode.muxPlaybackId}.m3u8`
    : null;

  const player = useVideoPlayer(muxUrl ?? "", (p) => {
    p.loop = false;
    p.play();
  });

  // Unlock orientation while watching; restore portrait on exit. Using
  // useFocusEffect (not useEffect) so we re-lock if user backgrounds the app
  // and returns. expo-screen-orientation is a no-op on web/tvOS.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        try {
          await ScreenOrientation.unlockAsync();
        } catch {
          // Older expo-screen-orientation versions throw on tvOS — ignore.
        }
      })();
      return () => {
        if (cancelled) return;
        cancelled = true;
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
      };
    }, [])
  );

  // Load episode metadata
  useEffect(() => {
    if (!id) return;
    getEpisode(id)
      .then((ep) => {
        setEpisode(ep);
        if (ep.muxStatus !== "READY") {
          setError("This video isn't ready yet. Please try again in a few minutes.");
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load episode."))
      .finally(() => setLoading(false));
  }, [id]);

  // Save progress every 15 seconds while playing
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

  const exitWatch = useCallback(() => {
    const pos = player.currentTime ?? 0;
    if (pos > 0 && token && episode) {
      saveProgress(episode.id, Math.round(pos), token).catch(() => {});
    }
    router.back();
  }, [player, token, episode]);

  const enterFullscreen = useCallback(() => {
    // expo-video exposes a native fullscreen presentation via the VideoView
    // imperative API. The ref method varies by SDK; guard for it.
    const ref = videoRef.current as unknown as { enterFullscreen?: () => void } | null;
    ref?.enterFullscreen?.();
  }, []);

  // Siri Remote / Apple TV: menu = back, play/pause = toggle playback
  useTVRemote({
    menu: exitWatch,
    playPause: () => {
      if (player.playing) player.pause();
      else player.play();
    },
  });

  if (loading) {
    return <WatchSkeleton onBack={() => router.back()} />;
  }

  if (error || !episode) {
    return (
      <View style={styles.errorRoot}>
        <LinearGradient
          colors={["#1a0000", "#000000", "#000000"] as readonly [string, string, string]}
          locations={[0, 0.4, 1]}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.errIconCircle}>
          <AlertCircle size={32} color={Colors.white} strokeWidth={2.5} />
        </View>
        <Text style={styles.errEyebrow}>· PLAYBACK ERROR ·</Text>
        <Text style={styles.errTitle}>CAN&apos;T PLAY</Text>
        <Text style={styles.errBody}>{error ?? "Episode not found."}</Text>
        <PrimaryButton
          label="Go Back"
          onPress={() => router.back()}
          size="lg"
          style={{ marginTop: Spacing.lg }}
        />
      </View>
    );
  }

  // ─── Sizing ────────────────────────────────────────────────────────────────
  // Landscape: video fills the whole window, ignoring insets so it goes
  // edge-to-edge under the notch (cinematic). Portrait: 16:9 letterbox at the
  // top, episode info below.
  const videoStyle = isLandscape
    ? { width: winW, height: winH }
    : { width: winW, height: Math.round(winW * (9 / 16)) };

  const backTop = isLandscape
    ? insets.top + 8
    : Platform.OS === "ios"
      ? 52
      : 16;
  const backLeft = isLandscape ? Math.max(insets.left + 8, Spacing.md) : Spacing.md;

  return (
    <View style={[styles.root, isLandscape && { backgroundColor: "#000" }]}>
      {/* Video player */}
      <View style={[styles.videoContainer, videoStyle]}>
        {muxUrl ? (
          <VideoView
            ref={videoRef as React.RefObject<VideoView>}
            player={player}
            style={StyleSheet.absoluteFillObject}
            contentFit="contain"
            nativeControls
            allowsFullscreen
            allowsPictureInPicture
          />
        ) : (
          <View style={[styles.videoFallback, StyleSheet.absoluteFillObject]}>
            <Play size={32} color={Colors.textFaint} />
          </View>
        )}
      </View>

      {/* Episode info (portrait only — landscape uses full-screen video) */}
      {!isLandscape && (
        <View style={styles.info}>
          <Text style={styles.epEyebrow}>NOW PLAYING</Text>
          <Text style={styles.epTitle} numberOfLines={2}>
            {episode.title}
          </Text>
          {episode.duration != null && (
            <Text style={styles.epMeta}>
              {Math.round(episode.duration / 60)} min
              {episode.muxStatus === "READY" ? "  ·  HD" : ""}
            </Text>
          )}
          {episode.description != null && (
            <Text style={styles.epDesc} numberOfLines={6}>
              {episode.description}
            </Text>
          )}

          <View style={styles.fullscreenHint}>
            <TouchableOpacity
              style={styles.fullscreenBtn}
              onPress={enterFullscreen}
              activeOpacity={0.85}
            >
              <Maximize2 size={14} color={Colors.white} />
              <Text style={styles.fullscreenBtnText}>FULLSCREEN</Text>
            </TouchableOpacity>
            <Text style={styles.rotateHint}>or rotate device</Text>
          </View>
        </View>
      )}

      {/* Back button — pinned, always visible */}
      <TouchableOpacity
        style={[styles.backBtn, { top: backTop, left: backLeft }]}
        onPress={exitWatch}
        activeOpacity={0.85}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Loading skeleton ──────────────────────────────────────────────────────
function WatchSkeleton({ onBack }: { onBack: () => void }) {
  const { width: winW } = useWindowDimensions();
  const videoH = Math.round(winW * (9 / 16));
  return (
    <View style={styles.root}>
      <Skeleton width={winW} height={videoH} radius={0} />
      <View style={styles.info}>
        <Skeleton width={120} height={12} style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height={28} style={{ marginBottom: 8 }} />
        <Skeleton width={180} height={14} style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
        <Skeleton width="100%" height={12} style={{ marginBottom: 6 }} />
        <Skeleton width="70%" height={12} />
      </View>
      <TouchableOpacity
        style={[styles.backBtn, { top: Platform.OS === "ios" ? 52 : 16, left: Spacing.md }]}
        onPress={onBack}
        activeOpacity={0.85}
      >
        <ArrowLeft size={20} color={Colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.black },

  // Video
  videoContainer: { backgroundColor: "#000" },
  videoFallback: { justifyContent: "center", alignItems: "center", backgroundColor: "#000" },

  // Episode info (portrait)
  info: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  epEyebrow: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.red,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  epTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 32,
    color: Colors.white,
    letterSpacing: 1.2,
    lineHeight: 34,
    marginBottom: 8,
    includeFontPadding: false,
  },
  epMeta: {
    fontFamily: Fonts.barlow,
    fontSize: 12,
    color: Colors.textSub,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  epDesc: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  // Fullscreen hint
  fullscreenHint: { flexDirection: "row", alignItems: "center", gap: 12 },
  fullscreenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  fullscreenBtnText: {
    fontFamily: Fonts.barlow,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1.5,
  },
  rotateHint: {
    fontSize: FontSizes.xs,
    color: Colors.textFaint,
    fontStyle: "italic",
  },

  // Back button — glass pill
  backBtn: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.7)",
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    justifyContent: "center",
    alignItems: "center",
  },

  // Error state
  errorRoot: {
    flex: 1,
    backgroundColor: Colors.black,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  errIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.red,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    ...Glow.redMd,
  },
  errEyebrow: {
    fontFamily: Fonts.barlow,
    color: Colors.red,
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 6,
  },
  errTitle: {
    fontFamily: Fonts.bebas,
    fontSize: 36,
    color: Colors.white,
    letterSpacing: 1.8,
    textAlign: "center",
    includeFontPadding: false,
  },
  errBody: {
    fontSize: FontSizes.sm,
    color: Colors.textSub,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
});
