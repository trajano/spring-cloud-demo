import { ComponentType, forwardRef, NamedExoticComponent, PropsWithoutRef, ReactElement, Ref, RefAttributes } from 'react';
import {
    StyleProp
} from "react-native";
import { hocDisplayName } from './hocDisplayName';
import { propsToStyleSheet, withoutStyledProps } from './propsToStyleSheet';
import { StyleProps } from './StyleProps';
import { useTheming } from './ThemeContext';

/**
 * This wraps a view component so the styles are exposed.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam Q the props for the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
export function withStyled<
    P extends Q & StyleProps,
    Q extends { style?: StyleProp<any> },
    T
>(Component: ComponentType<Q>): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function useWrapped({ style, ...rest }: P, ref: Ref<T>): ReactElement<Q> {
        const { colors } = useTheming();
        // the an unknown as Q here is an example, but P and Q can be different.
        const stylesFromProps = propsToStyleSheet(rest, colors)
        const componentProps: Q = withoutStyledProps(rest) as unknown as Q;
        return <Component {...componentProps} style={[style, stylesFromProps]} ref={ref} />;
    }
    useWrapped.displayName = hocDisplayName("withStyled", Component);
    return forwardRef(useWrapped);
}
