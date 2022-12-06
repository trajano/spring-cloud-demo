import { Children, cloneElement, ComponentType } from 'react';
import { Animated, StyleSheet, Text as RNText, TextInput as RNTextInput, TextProps, TextStyle } from "react-native";
import { useFonts } from "./Fonts";
type TextHocOptions = {
    /**
     * Display name to show on React Native Debugger if it cannot be determined from the `displayName` or `name` property 
     * of the wrapped component.  If all else fails the display name would be `AnonymousTextComponent`.  This capability
     * was provided as React Native Animated does not forward the wrapped component's display name.
     */
    displayNameFallback?: string;
}


/**
 * 
 * ```tsx
 * <Text _t="key">
 * {{ prop: val, prop2.val}}
 * </Text>
 * ```
 * 
 * @param Component 
 * @param options 
 * @returns 
 */
export function textHoc<P extends Animated.AnimatedProps<TextProps>>(Component: ComponentType<P>, { displayNameFallback }: TextHocOptions = {}) {
    function wrapped({ style, children: inChildren, ...rest }: P & JSX.IntrinsicAttributes) {
        const { replaceWithNativeFont } = useFonts();
        const flattenedStyle: TextStyle = StyleSheet.flatten(style) as TextStyle || {};
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
        return <Component style={replacedStyle} {...rest as P}>{children}</Component>
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousTextComponent";
    wrapped.displayName = displayName;
    return wrapped;
}

type I18ned = Omit<Animated.AnimatedProps<TextProps>, "children"> & { children: Animated.AnimatedProps<TextProps>['children'] | Record<string, unknown> };
function i18nHoc<P extends I18ned>(Component: ComponentType<Omit<P, "children"> & Pick<Animated.AnimatedProps<TextProps>, 'children'>>, { displayNameFallback }: TextHocOptions = {}) {
    function wrapped({ children: inChildren, ...rest }: Omit<P, "children"> & Pick<Animated.AnimatedProps<TextProps>, 'children'>) {

        // Use `any` to prevent Expression produces a union type that is too complex to represent
        return <Component  {...rest as any}>{inChildren}</Component>
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousI18nComponent";
    wrapped.displayName = displayName;
    return wrapped;
}
export const Text = i18nHoc(textHoc(Animated.Text, {
    displayNameFallback: "HocText"
}))
export const TextInput = textHoc(RNTextInput);

/**
 * This is a non-animated version of Text.  Primarily used for Markdown to Text components.
 */
export const NativeText = textHoc(RNText);

function Dis() {
    return <Text _t="key">
        {{ prop: "val", prop2: "val" }}
    </Text>
}
