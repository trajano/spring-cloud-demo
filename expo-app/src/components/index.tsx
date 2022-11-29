import React, { Children, Component, ComponentType, createElement, forwardRef, PropsWithChildren, ReactElement, Ref, RefAttributes, useCallback, useMemo } from 'react';
import * as RN from "react-native";
import { StyleProp } from 'react-native';
import { Animated, StyleSheet, TextInputProps, TextProps, ViewProps } from "react-native";
import { useFonts, useTheming } from "../lib/native-unstyled";
import { propsToStyleSheet } from './propsToStyleSheet';
import { StyleProps } from './StyleProps';
export const ScrollView = Animated.ScrollView;

// export function SectionList<ItemT, SectionT>(props: Animated.AnimatedProps<SectionListProps<ItemT, SectionT>>) {
//     return <Animated.SectionList {...props} />
// }

type FontLookupKey = Pick<
    RN.TextStyle,
    "fontFamily" | "fontWeight" | "fontStyle"
>;

const ForwardedRefMyText2 = forwardRef<RN.Text, Animated.AnimatedProps<TextProps> & {
    internalTextStyle?: FontLookupKey
}>(({ style, internalTextStyle, children, ...rest }, ref) => {
    const { replaceWithNativeFont } = useFonts();

    const flattenedStyle = useMemo(() => StyleSheet.flatten([style, internalTextStyle]), [style, internalTextStyle]) as RN.TextStyle;
    const newChildren = Children.map<any, any>(children, (child) => {
        if (!React.isValidElement(child) || ((child as ReactElement).type !== Text)) {
            return child;
        } else {
            const nextInternalTextStyle: RN.TextStyle = {}
            if (flattenedStyle.fontFamily) { nextInternalTextStyle["fontFamily"] = flattenedStyle.fontFamily; }
            if (flattenedStyle.fontWeight) { nextInternalTextStyle["fontWeight"] = flattenedStyle.fontWeight; }
            if (flattenedStyle.fontStyle) { nextInternalTextStyle["fontStyle"] = flattenedStyle.fontStyle; }
            if (flattenedStyle.color) { nextInternalTextStyle["color"] = flattenedStyle.color; }

            return React.cloneElement<any>(child, {
                internalTextStyle: nextInternalTextStyle
            });
        }
    });
    const nextTextStyle = useMemo(() => replaceWithNativeFont(flattenedStyle), [flattenedStyle]);
    return useMemo(() => {
        return <Animated.Text {...rest} style={nextTextStyle} ref={ref}>{newChildren}</Animated.Text>;
    }, []);
});


const ForwardedRefMyTextInput = forwardRef<RN.TextInput, Animated.AnimatedProps<TextInputProps> & {
    internalTextStyle?: FontLookupKey
}>(({ style, internalTextStyle, children, ...rest }, ref) => {
    const { replaceWithNativeFont } = useFonts();

    const flattenedStyle = useMemo(() => StyleSheet.flatten([style, internalTextStyle]), [style, internalTextStyle]) as RN.TextStyle;
    const newChildren = Children.map<any, any>(children, (child) => {
        if (!React.isValidElement(child) || ((child as ReactElement).type !== Text)) {
            return child;
        } else {
            const nextInternalTextStyle: RN.TextStyle = {}
            if (flattenedStyle.fontFamily) { nextInternalTextStyle["fontFamily"] = flattenedStyle.fontFamily; }
            if (flattenedStyle.fontWeight) { nextInternalTextStyle["fontWeight"] = flattenedStyle.fontWeight; }
            if (flattenedStyle.fontStyle) { nextInternalTextStyle["fontStyle"] = flattenedStyle.fontStyle; }
            if (flattenedStyle.color) { nextInternalTextStyle["color"] = flattenedStyle.color; }

            return React.cloneElement<any>(child, {
                internalTextStyle: nextInternalTextStyle
            });
        }
    });
    const nextTextStyle = useMemo(() => replaceWithNativeFont(flattenedStyle), [flattenedStyle]);
    return useMemo(() => {
        return <Animated.Text {...rest} style={nextTextStyle} ref={ref}>{newChildren}</Animated.Text>;
    }, []);
});


export type I18nProps = {
    /**
     * Content I18n key.  Replaces the main text content.
     */
    _t?: string;
    /**
 * Placeholder text I18n key.  Replaces the place holder text content.
 */
    _p?: string;
    /**
* Accessibility text I18n key.  Replaces the place holder text content.
*/
    _a?: string;
}
export type I18nedProps<P = unknown> = PropsWithChildren<P> & I18nProps;
export type WithI18nConfig = {
    /**
     * The children of the element contains the text.  If false then `textProp` must be specified.
     */
    childrenIsText?: boolean;
    /**
     * Prop containing the text.
     */
    textProp?: string;
    /**
     * Allow basic markdown.  Supports only bold, itaic, underline, strikethru
     */
    allowBasicMarkdown?: boolean;
}
export function withI18n<P>(WrappedComponent: ComponentType<P>, ref: Ref<any>, config: WithI18nConfig = {}): ComponentType<I18nedProps<P>> {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || "Component";
    const defaultConfig: WithI18nConfig = {
        childrenIsText: true
    };
    function I18nedComponent({ forwardedRef, children, _t, ...rest }: I18nedProps<P> & { forwardedRef: Ref<ComponentType<P>> }) {
        const activeConfig = { ...defaultConfig, ...config };
        const nextChildren = (activeConfig.childrenIsText && _t !== undefined) ? _t : children;
        return <WrappedComponent ref={forwardedRef} {...rest as P & JSX.IntrinsicAttributes}>{nextChildren}</WrappedComponent>;

    }
    I18nedComponent.displayName = displayName;
    return useCallback((props: I18nedProps<P>) => <I18nedComponent forwardedRef={ref} {...props} />, [config]);
    //return forwardRef<ComponentType<P>, I18nedProps<P>>((props: I18nedProps<P>, ref) => <StyledComponent {...props} forwardedRef={ref} />) as ComponentType<I18nedProps<P>>
}

/**
 * For styling to occur, the props must already contain a `style` prop
 */
export type StyledProps<P = unknown> = P & StyleProps;
/**
 * WithStyled configuration.  This will allow specifying props that can contain style props.
 */
type WithStyledConfig = {}
export function withStyled<P>(WrappedComponent: ComponentType<P>, ref: Ref<any>, config: WithStyledConfig = {}): ComponentType<StyledProps<P>> {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || "Component";
    function StyledComponent({ forwardedRef, extendStyle, style, role, size, ...rest }: StyledProps<P> & { forwardedRef: Ref<ComponentType<P>> }) {
        const { defaultTypography, typography, colors } = useTheming();

        const computedStyle = useMemo(() => {
            const propStyles = [role ? typography(role, size) : {}, propsToStyleSheet(rest, colors)];
            if (extendStyle === false) {
                // use Compose to reduce the amount of array objects that are created.
                return StyleSheet.compose(defaultTypography, propStyles);
            } else {
                return StyleSheet.compose(defaultTypography, StyleSheet.compose(style, propStyles));
            }
        }, [style, extendStyle, rest]);
        return <WrappedComponent ref={forwardedRef} style={computedStyle} {...rest as P & JSX.IntrinsicAttributes} />;
    }
    StyledComponent.displayName = displayName;
    return useCallback((props: StyledProps<P>) => <StyledComponent forwardedRef={ref} {...props} />, []);
}


type AnimatedStyledFC<P, R = Component> = StyledFC<Animated.AnimatedProps<P>, R>;
type I18nStyledFC<P, R = Component> = (props: I18nedProps<StyledProps<P>> & RefAttributes<R>) => ReactElement<P>;
type StyledFC<P, R = Component> = (props: StyledProps<P> & RefAttributes<R>) => ReactElement<P>;
type ViewFC = AnimatedStyledFC<ViewProps, RN.View>;
export const View: ViewFC = forwardRef((props, ref: Ref<RN.View>) => createElement(withStyled(Animated.View, ref), props)) as ViewFC;
export const Text: I18nStyledFC<Animated.AnimatedProps<TextProps>, RN.Text> =
    forwardRef<RN.Text, I18nedProps<StyledProps<Animated.AnimatedProps<TextProps>>>>((props, ref) =>
        createElement(withI18n(withStyled(ForwardedRefMyText2, ref), ref), props)
    ) as I18nStyledFC<Animated.AnimatedProps<TextProps>, RN.Text>;

// export const TextInput = RN.TextInput;
// export function TextInput(props: TextInputProps): ReactElement<TextInputProps> {
//     return <RN.TextInput {...props} />
// }

// export const TextInput: I18nStyledFC<TextInputProps, RN.TextInput> =
//     forwardRef<RN.TextInput, I18nedProps<StyledProps<TextInputProps>>>((props, ref) =>
//         createElement(withI18n(withStyled(RN.TextInput, ref), ref), props)
//     ) as I18nStyledFC<TextInputProps, RN.TextInput>;

export const TextInput = forwardRef<RN.TextInput, StyledProps<TextInputProps>>(({
    role,
    size,
    extendStyle,
    style,
    ...rest }, ref) => {
    const { defaultTypography, typography, colors } = useTheming();
    const computedStyle = useMemo<StyleProp<RN.TextStyle>>(() => {
        const propStyles : StyleProp<RN.TextStyle> = [role ? typography(role, size) : {}, propsToStyleSheet(rest, colors)];
        if (extendStyle === false) {
            // use Compose to reduce the amount of array objects that are created.
            return StyleSheet.compose(defaultTypography, propStyles);
        } else {
            return StyleSheet.compose(defaultTypography, StyleSheet.compose(style, propStyles));
        }
    }, [style, extendStyle, rest]);

    return <RN.TextInput ref={ref} style={computedStyle} {...rest} />;
}
);