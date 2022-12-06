import { ComponentType, forwardRef, JSXElementConstructor, NamedExoticComponent, PropsWithoutRef, ReactElement, Ref, RefAttributes } from 'react';
import { render } from '@testing-library/react-native';
import { Text, TextProps } from 'react-native';

/**
 * This is a simple HoC that is a noop that supports ref forwarding.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam P the exposed props of the higher order component
 * @typeParam Q the props for the wrapped component
 * @typeParam T type for ref attribute of the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
function hoc<P, Q, T extends JSXElementConstructor<any>, O = {}>(Component: ComponentType<Q>, options?: O): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function wrapped(props: P, ref: Ref<T>): ReactElement<Q, T> {
        // the an unknown as Q here is an example, but P and Q can be different.
        const componentProps: Q = props as unknown as Q;
        return <Component {...componentProps as Q} ref={ref} />
    }
    const displayName =
        Component.displayName || Component.name || "AnonymousComponent";
    wrapped.displayName = displayName;
    return forwardRef(wrapped);
}

describe("hoc", () => {
    it("should work with text", () => {
        const HocText = hoc<TextProps, TextProps, typeof Text>(Text);
        const { toJSON } = render(<HocText>simple string</HocText>);
        const { toJSON: expectedToJSON } = render(<Text>simple string</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    });
});