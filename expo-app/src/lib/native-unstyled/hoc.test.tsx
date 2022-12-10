import { render } from '@testing-library/react-native';
import { ComponentType, forwardRef, NamedExoticComponent, PropsWithoutRef, ReactElement, Ref, RefAttributes, useEffect, useRef } from 'react';
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
function hoc<P, Q, T, O = {}>(Component: ComponentType<Q>, options?: O): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
    function wrapped(props: P, ref: Ref<T>): ReactElement<Q> {
        // the an unknown as Q here is an example, but P and Q can be different.
        const componentProps: Q = props as unknown as Q;
        return <Component {...componentProps} ref={ref} />
    }
    const displayName =
        Component.displayName || Component.name || "AnonymousComponent";
    wrapped.displayName = displayName;
    return forwardRef(wrapped);
}

describe("hoc", () => {
    it("should work with text", () => {
        const HocText = hoc<TextProps, TextProps, Text>(Text);
        const { toJSON } = render(<HocText>simple string</HocText>);
        const { toJSON: expectedToJSON } = render(<Text>simple string</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
    });

    it("should pass ref for text", () => {
        const callback = jest.fn();
        const HocText = hoc<TextProps, TextProps, Text>(Text);
        function MyComponent() {
            const textRef = useRef<Text>(null);
            useEffect(() => {
                callback(textRef?.current)
            }, []);
            return <HocText ref={textRef}>simple string</HocText>
        }

        const { toJSON } = render(<MyComponent />);
        const { toJSON: expectedToJSON } = render(<Text>simple string</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
        expect(callback).toBeCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeTruthy();
    });

    it("should work the same way with normal Text", () => {
        const callback = jest.fn();
        function MyComponent() {
            const textRef = useRef<Text>(null);
            useEffect(() => {
                callback(textRef?.current)
            }, []);
            return <Text ref={textRef}>simple string</Text>
        }

        const { toJSON } = render(<MyComponent />);
        const { toJSON: expectedToJSON } = render(<Text>simple string</Text>)
        expect(toJSON()).toStrictEqual(expectedToJSON())
        expect(callback).toBeCalledTimes(1);
        expect(callback.mock.calls[0][0]).toBeTruthy();
    });


});