import { ComponentType, Children, createElement, cloneElement } from 'react';
import { Animated, Text as RNText, TextProps, TextStyle, StyleSheet } from "react-native";
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
    function wrapped({ style, children: inChildren, ...rest }: Animated.AnimatedProps<TextProps> & JSX.IntrinsicAttributes) {
        const { replaceWithNativeFont } = useFonts();
        const flattenedStyle = StyleSheet.flatten(style) as TextStyle;
        const replacedStyle = replaceWithNativeFont(flattenedStyle);
        const children: typeof inChildren = Children.map(inChildren as any, (child) => {
            if (typeof child === "object") {

                const clone = cloneElement(child, {
                    style: [
                        {
                            fontFamily: flattenedStyle.fontFamily,
                            fontWeight: flattenedStyle.fontWeight,
                            fontStyle: flattenedStyle.fontStyle
                        },
                        child.props.style
                    ]
                });
                return clone;
            } else {
                return child;
            }
        }
        );
        return <Component style={replacedStyle} {...rest as any}>{children}</Component>
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousTextComponent";
    wrapped.displayName = displayName;
    return wrapped;
}
export const Text = textHoc(Animated.Text, {
    displayNameFallback: "HocText"
})

export const NativeText = textHoc(RNText);
