import { Children, cloneElement, ComponentType, forwardRef, NamedExoticComponent, PropsWithoutRef, ReactElement, ReactNode, Ref, RefAttributes } from 'react';
import { StyleProp, StyleSheet, TextStyle } from "react-native";
import { useFonts } from "./Fonts";
import { hocDisplayName } from './hocDisplayName';

function useReplacedWithNativeFonts(style?: StyleProp<TextStyle>, inChildren?: ReactNode): {
    style?: StyleProp<TextStyle>,
    children?: ReactNode,
} {
    const { replaceWithNativeFont } = useFonts();
    const flattenedStyle: TextStyle = StyleSheet.flatten(style) || {};
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

export function withReplacedWithNativeFonts<
    P extends Q,
    Q extends { style?: StyleProp<TextStyle>, children?: ReactNode },
    T
>(Component: ComponentType<Q>): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function useWrapped({ style: inStyle, children: inChildren, ...rest }: P, ref: Ref<T>): ReactElement<Q> {

        const { style, children } = useReplacedWithNativeFonts(inStyle, inChildren)
        return (<Component
            {...rest as unknown as Q}
            style={style}>
            {children}
        </Component>);

    }
    useWrapped.displayName = hocDisplayName("withReplacedWithNativeFonts", Component);
    return forwardRef(useWrapped);
}