import { Animated, View, Text as RNText, TextProps, ViewStyle } from "react-native";
import { ComponentType, Component, RefAttributes } from 'react';
import { useTheming } from "./ThemeContext";
import { useFonts } from "./Fonts";
type TextHocOptions = {
    /**
     * Display name to show on React Native Debugger if it cannot be determined from the `displayName` or `name` property 
     * of the wrapped component.  If all else fails the display name would be `AnonymousTextComponent`.  This capability
     * was provided as React Native Animated does not forward the wrapped component's display name.
     */
    displayNameFallback?: string;
}
export function textHoc<P extends Animated.AnimatedProps<TextProps>>(Component: ComponentType<P>, { displayNameFallback }: TextHocOptions = {}) {
    function wrapped(props: P & JSX.IntrinsicAttributes) { return <Component {...props} /> }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousTextComponent";
    wrapped.displayName = displayName;
    return wrapped;
}
export const Text = textHoc(Animated.Text, {
    displayNameFallback: "HocText"
})

export const NativeText = textHoc(RNText)
