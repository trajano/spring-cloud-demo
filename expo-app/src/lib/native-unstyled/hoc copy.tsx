import { Animated, View, Text as RNText } from "react-native";
import { PropsWithoutRef, Ref, ReactElement, ForwardRefExoticComponent, ComponentType, Component, forwardRef, RefAttributes } from 'react';
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


//forwardRef()
function textHoc2<P, Q, O, T>(Component: ComponentType<Q>, options: O): ForwardRefExoticComponent<PropsWithoutRef<Q & JSX.IntrinsicAttributes> & RefAttributes<T>> {
    function wrapped(props: Q & JSX.IntrinsicAttributes, forwardedRef: Ref<T>): ReactElement<any, any> {
        return <Component {...props} ref={forwardRef} />
    }
    const displayName =
        Component.displayName || Component.name || "AnonymousComponent";
    wrapped.displayName = displayName;
    return forwardRef<T, Q & JSX.IntrinsicAttributes>(wrapped);
}

export const NativeText = hoc(RNText)
