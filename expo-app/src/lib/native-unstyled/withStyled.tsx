import { ComponentType, forwardRef, NamedExoticComponent, PropsWithoutRef, ReactElement, Ref, RefAttributes } from 'react';
import {
    Animated,
    View
} from "react-native";
import { StyleProps } from './StyleProps';

/**
 * This wraps a view component so the styles are exposed.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam Q the props for the wrapped component
 * @typeParam T type for ref attribute of the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
export function withStyled<
    P extends Q & StyleProps,
    Q extends {},
    T,
    O = {}
>(Component: ComponentType<Q>, options?: O): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function useWrapped(props: P, ref: Ref<T>): ReactElement<Q> {
        // the an unknown as Q here is an example, but P and Q can be different.
        const componentProps: Q = props as unknown as Q;
        return <Component {...componentProps} ref={ref} />;
    }
    const displayName = Component.displayName || Component.name || "AnonymousComponent";
    useWrapped.displayName = displayName;
    return forwardRef(useWrapped);
}

/**
 * This wraps a view component so the styles are exposed.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam Q the props for the wrapped component
 * @typeParam T type for ref attribute of the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
export function withStyledNoAnimation<
    P extends Q & StyleProps,
    Q extends {},
    T,
    O = {}
>(Component: ComponentType<Q>, options?: O): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<View>> {
    function useWrapped(props: P, ref: Ref<View>): ReactElement<Q> {
        // the an unknown as Q here is an example, but P and Q can be different.
        const componentProps: Q = props as unknown as Q;
        return <Component {...componentProps} ref={ref} />;
    }
    const displayName = Component.displayName || Component.name || "AnonymousComponent";
    useWrapped.displayName = displayName;
    return forwardRef(useWrapped);
}

withStyled(Animated.View)
