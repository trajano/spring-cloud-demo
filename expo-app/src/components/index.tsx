import { Animated, SectionListProps, TextInputProps, StyleSheet, StyleProp, TextProps, ViewProps } from "react-native";
import { FlashList, FlashListProps } from "@shopify/flash-list";
import { createElement, forwardRef, RefAttributes, Ref, Component, ComponentType, ReactElement, PropsWithChildren, PropsWithRef, PropsWithoutRef, useMemo, useCallback } from 'react'
import * as RN from "react-native";
export const ScrollView = Animated.ScrollView;



export function SectionList<ItemT, SectionT>(props: Animated.AnimatedProps<SectionListProps<ItemT, SectionT>>) {
    return <Animated.SectionList {...props} />
}


// export function FlatList<T>(props: FlashListProps<T>): ReactElement<FlashListProps<T>> {
//     return <FlashList {...props} />
// }


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
    return useCallback((props) => <I18nedComponent forwardedRef={ref} {...props} />, [config]);
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

}
/**
 * For styling to occur, the props must already contain a `style` prop
 */
export type StyledProps<P = unknown> = P & StyleProps;
function propsToStyleSheet(props: StyleProps): StyleProp<unknown> {
    const accumulatedStyle = {};
    function add(propKey: string, styleKey: string) {
        if (props[propKey] !== null || props[propKey] !== undefined) {
            accumulatedStyle[styleKey] = props[propKey];
        }
    }
    add("bg", "backgroundColor");
    return accumulatedStyle;
}
export function withStyled<P>(WrappedComponent: ComponentType<P>, ref: Ref<any>) {
    const displayName =
        WrappedComponent.displayName || WrappedComponent.name || "Component";
    function StyledComponent({ forwardedRef, extendStyle, style, ...rest }: StyledProps<P> & { forwardedRef: Ref<ComponentType<P>> }) {
        const computedStyle = useMemo(() => {
            return extendStyle === false ? propsToStyleSheet(rest) : StyleSheet.compose(style, propsToStyleSheet(rest));
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
    return useCallback((props) => <StyledComponent forwardedRef={ref} {...props} />, []);
}


// export type StyledProps<P = unknown> = PropsWithRef<P> & { style?: StyleProp<any> } & StyleProps;
// type StyledWithRefProps<P = unknown> = PropsWithRef<P> & { style?: StyleProp<any> };
// export function withStyled<P>(WrappedComponent: ComponentType<StyledWithRefProps<P>>): ComponentType<StyledProps<P>> {
//     const displayName =
//         WrappedComponent.displayName || WrappedComponent.name || "Component";
//     function StyledComponent({ forwardedRef, extendStyle, style, ...rest }: PropsWithoutRef<StyledProps<P>> & { forwardedRef: Ref<ComponentType<P>> }): ReactElement<StyledProps<P>> {
//         let computedStyle: StyleProp<any> = style;

//         if (extendStyle) {
//             computedStyle = StyleSheet.compose(style, style);
//         }
//         return <><WrappedComponent
//             ref={forwardedRef}
//             style={computedStyle}
//             {...rest as unknown as PropsWithRef<P>}
//         /></>;

//     }
//     StyledComponent.displayName = displayName;
//     //    return (props) => <StyledComponent {...props} />
//     return forwardRef<
//         ComponentType<StyledWithRefProps<P,>>,
//         StyledWithRefProps<P,>
//     >(
//         (props, ref) => <StyledComponent {...props} forwardedRef={ref} />
//     );
//     //<ComponentType<StyledWithRefProps<P extends {}>>, StyledWithRefProps<P extends {}>>/</P>
//     // return forwardRef<ComponentType<StyledWithRefProps<P extends {}>>, StyledWithRefProps<P extends {}>>(
//     //     (props, ref) => <StyledComponent {...props} forwardedRef={ref} />
//     // );
//     // return forwardRef<ComponentType<StyledWithRefProps<P extends {}>>, StyledWithRefProps<P extends {}>>(
//     //     (props, ref) => <StyledComponent {...props} forwardedRef={ref} />
//     // );
//     // return forwardRef(
//     //     function forwarded(props, ref): ReactElement<StyledProps<P>> {
//     //         return <StyledComponent {...props} forwardedRef={ref} />;
//     //     }
//     // );
//     //return forwardRef<ComponentType<PropsWithRef<P>>, StyledProps<P>>((props: PropsWithoutRef<StyledProps<P>>, ref: Ref<ComponentType<P>>) => <StyledComponent {...props} forwardedRef={ref} />) as ComponentType<StyledProps<P>>
//     //return forwardRef<ComponentType<P>, StyledProps<P>>((props: PropsWithoutRef<StyledProps<P>>, ref: Ref<ComponentType<P>>) => <StyledComponent {...props} forwardedRef={ref} />) as ComponentType<StyledProps<P>>
// }

// export const Text = Animated.Text;
// export function Text(props: I18nedProps<StyledProps<Animated.AnimatedProps<TextProps>>>) {
//     return withI18n(withStyled((props) => <Animated.Text {...props as Animated.AnimatedProps<TextProps>} />));
// }

type AnimatedStyledFC<P> = StyledFC<Animated.AnimatedProps<P>>;
type I18nStyledFC<P> = (props: I18nedProps<StyledProps<P>> & RefAttributes<Component>) => ReactElement<P>;
type StyledFC<P> = (props: StyledProps<P> & RefAttributes<Component>) => ReactElement<P>;
type ViewFC = AnimatedStyledFC<ViewProps>;
export const View: ViewFC = forwardRef((props, ref: Ref<any>) => createElement(withStyled(Animated.View, ref), props)) as ViewFC;
export const Text: I18nStyledFC<Animated.AnimatedProps<TextProps>> = forwardRef((props, ref: Ref<any>) => createElement<Animated.AnimatedProps<TextProps>>(withI18n(withStyled(Animated.Text, ref), ref), props)) as AnimatedStyledFC<TextProps>;


export function TextInput(props: TextInputProps): ReactElement<TextInputProps> {
    return <RN.TextInput {...props} />
}


export function FlatList<T>(props: StyledProps<FlashListProps<T>>) {
    return withStyled((props) => <FlashList {...props as FlashListProps<T>} />);
}

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

