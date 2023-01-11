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
 * This wraps a ScrollView component so the styles are exposed.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam Q the props for the wrapped component
 * @typeParam O options for the HoC building
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
  function useWrapped(props: P, ref: Ref<T>): ReactElement<Q> {
    const { colors } = useTheming();

    return doStyleWrap(
      Component,
      props,
      ref,
      colors,
      !!stripStyledPropsToWrappedComponent
    );
  }
  useWrapped.displayName = hocDisplayName("withStyledScrollView", Component);
  return forwardRef(useWrapped);
}
