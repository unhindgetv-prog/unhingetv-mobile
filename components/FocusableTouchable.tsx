import { forwardRef, useState, useCallback } from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  Platform,
  View,
  ViewStyle,
  StyleProp,
} from "react-native";
import { Colors } from "../constants/theme";

type Props = TouchableOpacityProps & {
  focusedStyle?: StyleProp<ViewStyle>;
  scaleOnFocus?: number;
};

const isTV = (Platform as any).isTV === true;

export const FocusableTouchable = forwardRef<View, Props>(function FocusableTouchable(
  { style, focusedStyle, scaleOnFocus = 1.06, onFocus, onBlur, children, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);

  const handleFocus = useCallback(
    (e: any) => {
      setFocused(true);
      onFocus?.(e);
    },
    [onFocus],
  );
  const handleBlur = useCallback(
    (e: any) => {
      setFocused(false);
      onBlur?.(e);
    },
    [onBlur],
  );

  const focusVisualStyle: ViewStyle | null =
    isTV && focused
      ? {
          borderColor: Colors.white,
          shadowColor: Colors.white,
          shadowOpacity: 0.6,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 0 },
          transform: [{ scale: scaleOnFocus }],
        }
      : null;

  return (
    <TouchableOpacity
      ref={ref as any}
      activeOpacity={0.85}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={[
        styles.base,
        style,
        focusVisualStyle,
        isTV && focused ? focusedStyle : null,
      ]}
      {...rest}
    >
      {children}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    borderColor: "transparent",
    borderRadius: 8,
  },
});
