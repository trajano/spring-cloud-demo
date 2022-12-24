import { pickBy } from 'lodash';
import { Children, cloneElement, ComponentType, forwardRef, NamedExoticComponent, PropsWithoutRef, ReactElement, ReactNode, Ref, RefAttributes } from 'react';
import { StyleProp, StyleSheet, TextStyle } from "react-native";
import { useFonts } from "./Fonts";
import { hocDisplayName } from './hocDisplayName';
import { useTheming } from './ThemeContext';

function useReplacedWithNativeFonts(style?: StyleProp<TextStyle>, inChildren?: ReactNode): {
    style?: StyleProp<TextStyle>,
    children?: ReactNode,
} {
    const { defaultTypography } = useTheming();
    const { replaceWithNativeFont } = useFonts();
    const flattenedStyle: TextStyle = style ? (StyleSheet.flatten(style) || {}) : {};
    const replacedStyle = replaceWithNativeFont(flattenedStyle, defaultTypography);
    const children: typeof inChildren = Children.map(inChildren, (child) => {
        if (child === null) {
            return null;
        }
        else if (typeof child === "object" && 'props' in child) {
            const clone = cloneElement(child as ReactElement, {
                style: [
                    pickBy({
                        fontFamily: flattenedStyle.fontFamily,
                        fontWeight: flattenedStyle.fontWeight,
                        fontStyle: flattenedStyle.fontStyle,
                        color: flattenedStyle.color
                    }),
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

/**
 * This replaces the friendly font faces with the native font faces.  In addition this will also replacce the color with the default if not specified.
 * @param Component component
 * @returns 
 */
export function withReplacedWithNativeFonts<
    P extends Q,
    Q extends { style?: StyleProp<TextStyle>, children?: ReactNode },
    T
>(Component: ComponentType<Q>): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function useWrapped({ style: inStyle, children: inChildren, ...rest }: P, ref: Ref<T>): ReactElement<Q> {

        const { style, children } = useReplacedWithNativeFonts(inStyle, inChildren)
        return (<Component
            {...rest as unknown as Q}
            style={style}
            ref={ref}>
            {children}
        </Component>);

    }
    useWrapped.displayName = hocDisplayName("withReplacedWithNativeFonts", Component);
    return forwardRef(useWrapped);
}