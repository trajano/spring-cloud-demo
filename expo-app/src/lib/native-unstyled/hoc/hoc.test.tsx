import { render } from "@testing-library/react-native";
import {
  ComponentType,
  forwardRef,
  NamedExoticComponent,
  PropsWithoutRef,
  ReactElement,
  Ref,
  RefAttributes,
  useEffect,
  useRef,
} from "react";
import { Animated, Text, TextProps } from "react-native";

import { hocDisplayName } from "./hocDisplayName";

/**
 * This is a simple HoC that is a noop that supports ref forwarding.  The ref fowarding logic is added
 * as [refs are not passed through](https://reactjs.org/docs/higher-order-components.html#refs-arent-passed-through)
 * HoCs by default.
 * @param Component component to wrap
 * @param _options options for the HoC building
 * @typeParam P the exposed props of the higher order component (does not require Q props)
 * @typeParam Q the props for the wrapped component
 * @typeParam T type for ref attribute of the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
function hoc<P extends Q, Q extends object, T, O = object>(
  Component: ComponentType<Q>,
  _options?: O
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(props: P, ref: Ref<T>): ReactElement<Q> {
    // the an unknown as Q here is an example, but P and Q can be different.
    const componentProps: Q = props as Q;
    return <Component {...componentProps} ref={ref} />;
  }
  const displayName =
    Component.displayName || Component.name || "AnonymousComponent";
  useWrapped.displayName = displayName;
  return forwardRef(useWrapped);
}

/**
 * This is a HoC that implements the template method design pattern.  It uses functions passed in as references to do the work.
 * @param Component component to wrap
 * @param name name of the HoC to be added to the displayName
 * @param wrapper the function that gets called that wraps the original component.  Unlike a typical HoC this passes the the ref from forward.
 * @param options options for the HoC building
 * @typeParam P the exposed props of the higher order component (does not require Q props)
 * @typeParam Q the props for the wrapped component
 * @typeParam T type for ref attribute of the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
function hocTemplate<P extends Q, Q extends object, T, O = object>(
  Component: ComponentType<Q>,
  name: string,
  wrapper: (props: P, ref: Ref<T>) => ReactElement<Q>,
  options?: O
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(props: P, ref: Ref<T>): ReactElement<Q> {
    return wrapper(props, ref);
  }
  useWrapped.displayName = hocDisplayName(name, Component);
  return forwardRef(useWrapped);
}

type IgnoredProps = {
  foo: string;
  bar: string;
};
describe("hoc", () => {
  it("should work with text", () => {
    const HocText = hoc<TextProps, TextProps, Text>(Text);
    const { toJSON } = render(<HocText>simple string</HocText>);
    const { toJSON: expectedToJSON } = render(<Text>simple string</Text>);
    expect(toJSON()).toStrictEqual(expectedToJSON());
  });
  it("should work with Text implied types", () => {
    const HocText = hoc(Text);
    const { toJSON } = render(<HocText>simple string</HocText>);
    const { toJSON: expectedToJSON } = render(<Text>simple string</Text>);
    expect(toJSON()).toStrictEqual(expectedToJSON());
  });
  it("should work with Text with IgnoredProps", () => {
    const HocText = hoc<IgnoredProps & TextProps, TextProps, Text>(Text);
    const { toJSON } = render(
      <HocText foo="foo" bar="bar">
        simple string
      </HocText>
    );
    const UncheckedText = Text as unknown as ComponentType<
      Record<string, unknown>
    >;
    const { toJSON: expectedToJSON } = render(
      <UncheckedText foo="foo" bar="bar">
        simple string
      </UncheckedText>
    );
    expect(toJSON()).toStrictEqual(expectedToJSON());
  });
  it("should work with Animated.Text", () => {
    const HocText = hoc(Animated.Text);
    const { toJSON } = render(<HocText>simple string</HocText>);
    const { toJSON: expectedToJSON } = render(
      <Animated.Text>simple string</Animated.Text>
    );
    expect(toJSON()).toStrictEqual(expectedToJSON());
  });

  it("should pass ref for text", () => {
    const callback = jest.fn();
    const HocText = hoc<TextProps, TextProps, Text>(Text);
    function MyComponent() {
      const textRef = useRef<Text>(null);
      useEffect(() => {
        callback(textRef?.current);
      }, []);
      return <HocText ref={textRef}>simple string</HocText>;
    }

    const { toJSON } = render(<MyComponent />);
    const { toJSON: expectedToJSON } = render(<Text>simple string</Text>);
    expect(toJSON()).toStrictEqual(expectedToJSON());
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeTruthy();
  });

  it("should work the same way with normal Text", () => {
    const callback = jest.fn();
    function MyComponent() {
      const textRef = useRef<Text>(null);
      useEffect(() => {
        callback(textRef?.current);
      }, []);
      return <Text ref={textRef}>simple string</Text>;
    }

    const { toJSON } = render(<MyComponent />);
    const { toJSON: expectedToJSON } = render(<Text>simple string</Text>);
    expect(toJSON()).toStrictEqual(expectedToJSON());
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback.mock.calls[0][0]).toBeTruthy();
  });
});
