import { Children, cloneElement, ReactElement, ComponentType } from 'react';
import { AccessibilityProps, Animated, StyleSheet, Text as RNText, TextInput as RNTextInput, TextProps, TextStyle, ViewStyle } from "react-native";
import { TextInputProps } from 'react-native-paper';
import { useFonts } from "./Fonts";
import { useI18n } from './I18n';
type TextHocOptions = {
    /**
     * Display name to show on React Native Debugger if it cannot be determined from the `displayName` or `name` property 
     * of the wrapped component.  If all else fails the display name would be `AnonymousTextComponent`.  This capability
     * was provided as React Native Animated does not forward the wrapped component's display name.
     */
    displayNameFallback?: string;
}


export function textHoc2<P extends TextProps = TextProps>(Component: ComponentType<TextProps>, { displayNameFallback }: TextHocOptions = {}): ComponentType<P> {
    function wrapped({ style, children: inChildren, ...rest }: P & JSX.IntrinsicAttributes): ReactElement<any, any> {
        const { replaceWithNativeFont } = useFonts();
        const flattenedStyle: TextStyle = StyleSheet.flatten(style) as TextStyle || {};
        const replacedStyle = replaceWithNativeFont(flattenedStyle);
        const children: typeof inChildren = Children.map(inChildren, (child) => {
            if (child === null) {
                return null;
            }
            else if (typeof child === "object" && 'props' in child) {

                const clone = cloneElement(child as ReactElement, {
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
        return <Component style={replacedStyle} {...rest}>{children}</Component>
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousTextComponent";
    wrapped.displayName = displayName;
    return wrapped;
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
export function textHoc<P extends Animated.AnimatedProps<TextProps> = Animated.AnimatedProps<TextProps>>(Component: ComponentType<Animated.AnimatedProps<TextProps>>, { displayNameFallback }: TextHocOptions = {}): ComponentType<P> {
    function wrapped({ style, children: inChildren, ...rest }: P & JSX.IntrinsicAttributes): ReactElement<any, any> {
        const { replaceWithNativeFont } = useFonts();
        const flattenedStyle: TextStyle = StyleSheet.flatten(style) as TextStyle || {};
        const replacedStyle = replaceWithNativeFont(flattenedStyle);
        const children: typeof inChildren = Children.map(inChildren as any, (child) => {
            if (child === null) {
                return null;
            } else if (typeof child === "object" && 'props' in child) {

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
        return <Component style={replacedStyle} {...rest}>{children}</Component>
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousTextComponent";
    wrapped.displayName = displayName;
    return wrapped;
}

type I18nProps = {
    _t?: string,
    /**
     * Key for `accessibilityLabel`
     */
    _a?: string,
    /**
     * Key for `placeholder`
     */
    _p?: string,
    /**
     * Key for `returnKeyLabel`.  This is Android only.
     */
    _rkl?: string,
    _tp?: Record<string, unknown>
}
type I18nHocOptions = TextHocOptions & {
    /**
     * This is a mapping of localization key props to the real prop.
     * This is added in addition to
     * ```
     * { 
     * _a: "accessibilityLabel" ,
     * _p: "placeholder",
     * _rkl: "returnKeyLabel"
     * }
     * ```
     */
    localizedMap?: Record<string, keyof Omit<TextInputProps, "children">>;
    /**
     * If true, then the children are replaced with the value of `_t`.
     */
    _tIsChild?: boolean;
};
function i18nHoc<P extends Animated.AnimatedProps<TextProps> = Animated.AnimatedProps<TextProps>>(Component: ComponentType<P>,
    {
        displayNameFallback,
        _tIsChild = false,
        localizedMap = {
            _a: 'accessibilityLabel',
            _p: "placeholder",
            _rkl: "returnKeyLabel"
        } }: I18nHocOptions = {}) {
    const { t } = useI18n();
    function wrapped({ _t, _tp, children: inChildren, ...rest }: Omit<P, "children"> & Pick<Animated.AnimatedProps<TextProps>, 'children'> & I18nProps) {

        const localizedProps: Record<string, string | undefined> = {}
        for (const localizationKey in localizedMap) {
            if (localizationKey in rest) {
                const target = localizedMap[localizationKey] as keyof TextInputProps
                localizedProps[localizationKey] = undefined;
                localizedProps[target] = t(localizationKey, _tp);
            }
        }
        if (_tIsChild && _t) {
            return <Component {...rest as any} {...localizedProps}>{t(_t, _tp)}</Component>
        } else {
            return <Component  {...rest as any} {...localizedProps}>{inChildren}</Component>
        }
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousI18nComponent";
    wrapped.displayName = displayName;
    return wrapped;
}
export const Text = i18nHoc(textHoc(Animated.Text), {
    displayNameFallback: "HocText",
    _tIsChild: true
})
/**
 * TextInput
 */
export const TextInput = textHoc2(RNTextInput);

/**
 * This is a non-animated version of Text.  Primarily used for Markdown to Text components.
 */
export const NativeText = i18nHoc(textHoc2(RNText), { _tIsChild: true });

function Dis() {
    return <Text _t="key" _tp={{ prop: "val", prop2: "val" }} />
}
