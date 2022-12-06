import { Animated, View, Text as RNText } from "react-native";
import { ComponentType, Component } from 'react';
type HocOptions = {
    /**
     * Display name to show on React Native Debugger if it cannot be determined from the `displayName` or `name` property 
     * of the wrapped component.  If all else fails the display name would be `AnonymousComponent`.  This capability
     * was provided as React Native Animated does not forward the wrapped component's display name.
     */
    displayNameFallback?: string;
}
export function hoc<P = {}>(Component: ComponentType<P>, { displayNameFallback }: HocOptions = {}) {
    function wrapped(props: P & JSX.IntrinsicAttributes) { return <Component {...props} /> }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousComponent";
    wrapped.displayName = displayName;
    return wrapped;
}
export const Text = hoc(Animated.Text, {
    displayNameFallback: "HocText"
})

export const NativeText = hoc(RNText)
