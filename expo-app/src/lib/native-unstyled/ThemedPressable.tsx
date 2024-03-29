import { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  GestureResponderEvent,
  Platform,
  Pressable,
  PressableProps,
} from "react-native";

import type { ColorSwatch } from "./ColorSwatch";
import { useTheming } from "./ThemeContext";
type ThemedPressableProps = PressableProps & {
  /**
   * Background color. If this is a swatch the rule would be normal state 500
   * pressed state 300 (lighten on dark mode) or 700 (darken on light mode) long
   * pressed will flash the 100 and 900 temporarily
   *
   * On non-swatch it does a lighten 15% or darken 15% for the other state.
   */
  bg: ColorSwatch;

  /** Foreground color. If this is a swatch the rule would be normal 500 only. */
  fg: ColorSwatch;

  /**
   * This is the background color to use when the pressable is disabled. Only
   * 500 would be used. If not specified then the value of `bg` is used.
   */
  disabledBg?: ColorSwatch;

  /**
   * This is the background color to use when the pressable is disabled. Only
   * 500 would be used. If not specified then the value of `fg` is used.
   */
  disabledFg?: ColorSwatch;

  // outline, elevation etc are not handled
};

/**
 * This extends a pressable such that some style props with regards to color are
 * passed in. It does this through a context.
 */
export function ThemedPressable({
  bg,
  fg,
  disabled,
  disabledBg,
  disabledFg,
  onPressIn: originalOnPressIn,
  onPressOut: originalOnPressOut,
  delayLongPress = 500,
  children,
  ...rest
}: ThemedPressableProps) {
  const { colorScheme } = useTheming();
  const pressStateRef = useRef(new Animated.Value(0));
  const [pressed, setPressed] = useState(false);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const bgAnim = useMemo(() => {
    if (colorScheme === "light") {
      return pressStateRef.current.interpolate({
        inputRange: [0, 1, 1.5, 2],
        outputRange: [bg["500"], bg["300"], bg["100"], bg["300"]],
      });
    } else {
      return pressStateRef.current.interpolate({
        inputRange: [0, 1, 1.5, 2],
        outputRange: [bg["500"], bg["700"], bg["900"], bg["700"]],
      });
    }
  }, [colorScheme, bg, pressStateRef]);
  const pressInAnimationTiming = useMemo(
    () =>
      Animated.timing(pressStateRef.current, {
        toValue: 1,
        duration: 100,
        useNativeDriver: Platform.OS !== "web",
      }),
    [pressStateRef]
  );
  const longPressFlashAnimationTiming = useMemo(
    () =>
      Animated.timing(pressStateRef.current, {
        toValue: 2,
        duration: 100,
        useNativeDriver: Platform.OS !== "web",
      }),
    [pressStateRef]
  );
  const pressOutAnimationTiming = useMemo(
    () =>
      Animated.timing(pressStateRef.current, {
        toValue: 0,
        duration: 50,
        useNativeDriver: Platform.OS !== "web",
      }),
    [pressStateRef]
  );
  const onPressIn = useCallback(
    (event: GestureResponderEvent) => {
      setPressed(true);
      pressInAnimationTiming.start();
      if (originalOnPressIn) {
        originalOnPressIn(event);
      }
    },
    [originalOnPressIn, pressInAnimationTiming]
  );
  const onPressOut = useCallback(
    (event: GestureResponderEvent) => {
      setPressed(false);
      pressOutAnimationTiming.start();
      if (originalOnPressOut) {
        originalOnPressOut(event);
      }
    },
    [originalOnPressOut, pressOutAnimationTiming]
  );
  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      delayLongPress={delayLongPress}
      disabled={disabled}
      {...rest}
    >
      {children}
    </Pressable>
  );
}
/**
 * ```tsx
 * <ThemedPressable >
 * ```
 */
