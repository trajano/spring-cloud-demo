import {
  ComponentType,
  forwardRef,
  NamedExoticComponent,
  PropsWithoutRef,
  ReactElement,
  Ref,
  RefAttributes,
} from "react";
import { ScrollViewProps } from "react-native";

import { StyleProps } from "../StyleProps";
import { useTheming } from "../ThemeContext";
import { doStyleWrap } from "./doStyleWrap";
import { hocDisplayName } from "./hocDisplayName";
import { WithStyledProps } from "./withStyled";

/**
 * This wraps a ScrollView component so the styles are exposed. In addition it
 * handles `indicatorStyle` for iOS devices.
 *
 * @typeParam Q The props for the wrapped component
 * @typeParam O Options for the HoC building
 * @param Component Component to wrap
 * @param options Options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */

export function withStyledScrollView<
  P extends Q & StyleProps,
  Q extends ScrollViewProps,
  T
>(
  Component: ComponentType<Q>,
  { stripStyledPropsToWrappedComponent }: WithStyledProps = {
    stripStyledPropsToWrappedComponent: __DEV__,
  }
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(
    { indicatorStyle, ...rest }: P,
    ref: Ref<T>
  ): ReactElement<Q> {
    const { colors, colorScheme } = useTheming();

    return doStyleWrap(
      Component,
      {
        ...rest,
        indicatorStyle:
          indicatorStyle ?? colorScheme === "light" ? "black" : "white",
      } as Q & StyleProps,
      ref,
      colors,
      !!stripStyledPropsToWrappedComponent
    );
  }
  useWrapped.displayName = hocDisplayName("withStyledScrollView", Component);
  return forwardRef(useWrapped);
}
