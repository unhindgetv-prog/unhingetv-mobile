import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View, ViewStyle, Easing } from "react-native";
import { Colors, Radius } from "../../constants/theme";

interface Props {
  /** Number for px, percentage string ("100%"/"70%") for relative width. */
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

/**
 * Shimmer skeleton — matches web .shimmer keyframe.
 * Animates a translucent highlight across a dark base.
 */
export function Skeleton({ width = "100%", height = 20, radius = Radius.sm, style }: Props) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [shimmer]);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View
      style={[
        styles.base,
        // RN's ViewStyle accepts number | `${number}%` for width.
        { width, height, borderRadius: radius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shine,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.dark,
    overflow: "hidden",
  },
  shine: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(255,255,255,0.045)",
    width: 200,
  },
});

/** Convenience composite: portrait card skeleton matching the home grid. */
export function CardSkeleton({ width, height }: { width: number; height: number }) {
  return <Skeleton width={width as any} height={height} radius={Radius.md} />;
}
