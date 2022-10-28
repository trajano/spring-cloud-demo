import { Animated, SectionListProps, TextInputProps, StyleSheet, StyleProp, TextProps, ViewProps } from "react-native";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import React, { ReactNode, Children, createElement, forwardRef, RefAttributes, Ref, Component, ComponentType, createContext, useContext, ReactElement, PropsWithChildren, PropsWithRef, PropsWithoutRef, useMemo, useCallback, useState } from 'react'
import * as RN from "react-native";
import { useColors, useFonts } from "../lib/native-unstyled";
export const ScrollView = Animated.ScrollView;



export function SectionList<ItemT, SectionT>(props: Animated.AnimatedProps<SectionListProps<ItemT, SectionT>>) {
    return <Animated.SectionList {...props} />
}


// export function FlatList<T>(props: FlashListProps<T>): ReactElement<FlashListProps<T>> {
//     return <FlashList {...props} />
// }

type ITextStyleContext = Pick<
    RN.TextStyle,
    "fontFamily" | "fontWeight" | "fontStyle"
> & {
    provided: boolean,
    updateForStyleProp(style: RN.TextStyle): void
};

const TextStyleContext = createContext<ITextStyleContext>({
    provided: false, fontFamily: "sans-serif", fontWeight: "normal", fontStyle: "normal",
    updateForStyleProp: () => { }
})

const ForwardedRefContextedMyText = forwardRef<RN.Text, Animated.AnimatedProps<TextProps>>(({ style, ...rest }, ref) => {
    const colors = useColors();
    const [fontFamily, setFontFamily] = useState<NonNullable<RN.TextStyle['fontFamily']>>("sans-serif");
    const [fontWeight, setFontWeight] = useState<NonNullable<RN.TextStyle['fontWeight']>>("400");
    const [fontStyle, setFontStyle] = useState<NonNullable<RN.TextStyle['fontStyle']>>("normal");
    function updateForStyleProp({ fontFamily: nextFontFamily, fontWeight: nextFontWeight, fontStyle: nextFontStyle }: RN.TextStyle) {
        if (nextFontFamily) {
            setFontFamily(nextFontFamily)
        }
        if (nextFontWeight) {
            setFontWeight(nextFontWeight)
        }
        if (nextFontStyle) {
            setFontStyle(nextFontStyle)
        }
    }
    // the compose will actually have to pull the data from the fonts.
    const flattenedStyle = useMemo(() => StyleSheet.compose({ fontFamily, fontWeight, fontStyle, color: colors.default[0] }, style), [fontFamily, fontWeight, fontStyle, style]);
    return <TextStyleContext.Provider value={{ provided: true, fontFamily, fontWeight, fontStyle, updateForStyleProp }}>
        <Animated.Text {...rest} style={flattenedStyle as RN.TextStyle} ref={ref} />
    </TextStyleContext.Provider>

});
const ForwardedRefMyText = forwardRef<RN.Text, Animated.AnimatedProps<TextProps>>(({ style, ...rest }, ref) => {
    const { provided, updateForStyleProp } = useContext(TextStyleContext);
    const flattenedStyle = useMemo(() => StyleSheet.flatten(style), [style]);
    updateForStyleProp(flattenedStyle as Pick<
        RN.TextStyle,
        "fontFamily" | "fontWeight" | "fontStyle"
    >);
    return useMemo(() => {
        if (provided) {
            return <Animated.Text {...rest} style={style} ref={ref} />;
        } else {
            return <ForwardedRefContextedMyText {...rest} style={style} ref={ref} />;
        }
    }, []);
});

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

            return React.cloneElement<any>(child, {
                internalTextStyle: nextInternalTextStyle
            });
        }
    });
    const nextTextStyle = useMemo(() => replaceWithNativeFont(flattenedStyle), [flattenedStyle]);
    console.log({ style, flattenedStyle, internalTextStyle, nextTextStyle, text: children })
    return useMemo(() => {
        return <Animated.Text {...rest} style={nextTextStyle} ref={ref}>{newChildren}</Animated.Text>;
    }, []);
});


export function Bold({ children }: PropsWithChildren<{}>) {
    // 
    const textStyleContext = useContext(TextStyleContext);
    return useCallback(() => <Animated.Text style={{ fontWeight: "700" }} />, [])
}

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


export type StyleProps = {
    /**
     * If true, the existing `style` attribute will be extended.  If false then the stylings will not modify the existing style attribute.  Defaults to true.
     */
    extendStyle?: boolean
    /**
     * Existing style.
     */
    style?: StyleProp<unknown>;

    /**
     * Background color
     */
    bg?: string;
    /**
     * Foreground color
     */
    fg?: string;
    borderColor?: string;
    borderWidth?: number;

}

/**
 * For styling to occur, the props must already contain a `style` prop
 */
export type StyledProps<P = unknown> = P & StyleProps;
function propsToStyleSheet(props: StyleProps): StyleProp<Record<string, unknown>> {
    const accumulatedStyle: Record<string, unknown> = {};
    function add(propKey: string, styleKey?: string) {
        if (props.hasOwnProperty(propKey) && (props as Record<string, unknown>)[propKey] !== null) {
            accumulatedStyle[styleKey ?? propKey] = (props as Record<string, unknown>)[propKey];
        }
    }
    add("bg", "backgroundColor");
    add("fg", "color");
    add("borderColor");
    add("borderWidth");
    return accumulatedStyle;
}

/**
 * WithStyled configuration.  This will allow specifying props that can contain style props.
 */
type WithStyledConfig = {}
export function withStyled<P>(WrappedComponent: ComponentType<P>, ref: Ref<any>, config: WithStyledConfig = {}): ComponentType<StyledProps<P>> {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || "Component";
    function StyledComponent({ forwardedRef, extendStyle, style, ...rest }: StyledProps<P> & { forwardedRef: Ref<ComponentType<P>> }) {
        const { default: defaultColors } = useColors();
        const computedStyle = useMemo(() => {
            return extendStyle === false ? [{ color: defaultColors[0], backgroundColor: defaultColors[1] }, propsToStyleSheet(rest)] : StyleSheet.compose([{ color: defaultColors[0], backgroundColor: defaultColors[1] }, style], propsToStyleSheet(rest));
        }, [style, extendStyle, rest]);
        return <WrappedComponent ref={forwardedRef} style={computedStyle} {...rest as P & JSX.IntrinsicAttributes} />;
    }
    StyledComponent.displayName = displayName;
    // const render = (props, ref) => <StyledComponent forwardedRef={ref} {...props} />
    //return useCallback((props) => <StyledComponent {...props} />, []));
    //return useCallback((props) => createElement(StyledComponent, props), []);
    // return forwardRef<ComponentType<P>, P>(useCallback((props, ref) => <StyledComponent forwardedRef={ref} {...props} />, []));
    // return forwardRef<ComponentType<P>, P>((props, ref) => {
    //     console.log("render", ref)
    //     return <WrappedComponent ref={ref} {...props} />
    // })
    // return useCallback(forwardRef(render), []);
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


export function TextInput(props: TextInputProps): ReactElement<TextInputProps> {
    return <RN.TextInput {...props} />
}


// export function FlatList<T>(props: StyledProps<FlashListProps<T>>) {
//     return withStyled((props) => <FlashList {...props as FlashListProps<T>} />);
// }

// export function withStyled<P, S extends StyleProps>(WrappedComponent: ComponentType<P>): ComponentType<P & S> {
//     const displayName =
//         WrappedComponent.displayName || WrappedComponent.name || "Component";
//     function StyledComponent(props: P & S) {

//         //return forwardRef(StyledComponent;

//         return forwardRef((props: ComponentType<P>, ref) => <><WrappedComponent ref={ref} {...props} /></>)

//     }
//     StyledComponent.displayName = displayName;
//     return forwardRef((props: , ref) => <StyledComponent {...props} forwardedRef={ref} />)
// }

