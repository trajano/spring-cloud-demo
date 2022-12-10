import { Children, ReactNode, cloneElement, ComponentType, forwardRef, NamedExoticComponent, PropsWithoutRef, ReactElement, Ref, RefAttributes } from 'react';
import {
    Animated,
    StyleSheet,
    Text as RNText,
    StyleProp,
    TextInput as RNTextInput,
    TextInputProps,
    TextProps,
    TextStyle
} from "react-native";
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

function useTextHoc<Q>(style: StyleProp<any>, inChildren: ReactNode): {
    style: StyleProp<any>,
    children: ReactNode,
} {
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
    return {
        style: replacedStyle,
        children
    };
}

function textHoc2<P extends Pick<TextProps, "children" | "style">, Q, T>
    (Component: ComponentType<Q>, { displayNameFallback }: TextHocOptions = {}): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function wrapped({ style: inStyle, children: inChildren, ...rest }: P, ref: Ref<T>): ReactElement<Q> {
        const { style, children } = useTextHoc<Q>(inStyle, inChildren)
        return <Component style={style} {...rest as unknown as Q}>{children}</Component>
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousTextComponent";
    wrapped.displayName = displayName;
    return forwardRef(wrapped);
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
function textHoc<P extends Pick<Animated.AnimatedProps<TextProps>, "children" | "style">, Q, T>
    (Component: ComponentType<Q>, { displayNameFallback }: TextHocOptions = {}): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function wrapped({ style: inStyle, children: inChildren, ...rest }: P, ref: Ref<T>): ReactElement<Q> {
        const { style, children } = useTextHoc<Q>(inStyle, inChildren as ReactNode)
        return <Component style={style} {...rest as unknown as Q}>{children}</Component>
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousAnimatedTextComponent";
    wrapped.displayName = displayName;
    return forwardRef(wrapped);
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
    function useWrapped({ _t, _tp, children: inChildren, ...rest }: Omit<P, "children"> & Pick<Animated.AnimatedProps<TextProps>, 'children'> & I18nProps, ref: Ref<RNText>) {
        const { t } = useI18n();

        const localizedProps: Record<string, string | undefined> = {}
        for (const localizationKey in localizedMap) {
            if (localizationKey in rest) {
                const target = localizedMap[localizationKey] as keyof TextInputProps
                localizedProps[localizationKey] = undefined;
                localizedProps[target] = t(localizationKey, _tp);
            }
        }
        if (_tIsChild && _t) {
            return <Component ref={ref} {...rest as any} {...localizedProps}>{t(_t, _tp)}</Component>
        } else {
            return <Component ref={ref} {...rest as any} {...localizedProps}>{inChildren}</Component>
        }
    }
    const displayName =
        Component.displayName || Component.name || displayNameFallback || "AnonymousI18nComponent";
    useWrapped.displayName = displayName;
    return forwardRef(useWrapped);
}
export const Text = i18nHoc(textHoc<Animated.AnimatedProps<TextProps>, Animated.AnimatedProps<TextProps>, typeof RNText>(Animated.Text), {
    displayNameFallback: "HocText",
    _tIsChild: true
})
// export const Text = textHoc<Animated.AnimatedProps<TextProps>, Animated.AnimatedProps<TextProps>, typeof RNText>(Animated.Text, {
//     displayNameFallback: "HocText"
// })
/**
 * TextInput
 */
export const TextInput = textHoc2<TextInputProps, TextInputProps, typeof RNTextInput>(RNTextInput);

/**
 * This is a non-animated version of Text.  Primarily used for Markdown to Text components.
 */
export const NativeText = textHoc2<TextProps, TextProps, typeof RNText>(RNText);
