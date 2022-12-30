import {
  ComponentType,
  forwardRef,
  NamedExoticComponent,
  PropsWithoutRef,
  ReactElement,
  Ref,
  RefAttributes,
} from "react";
import { StyleProp } from "react-native";

import { StyleProps } from "../StyleProps";
import { useTheming } from "../ThemeContext";
import { doWrap } from "./doWrap";
import { hocDisplayName } from "./hocDisplayName";

export type WithStyledProps = {
  /**
   * Specifies that the style props are stripped out before calling the component.
   * This is disabled by default on production for performance, but enabled on development.
   */
  stripStyledPropsToWrappedComponent?: boolean;
};

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
>(
  Component: ComponentType<Q>,
  { stripStyledPropsToWrappedComponent }: WithStyledProps = {
    stripStyledPropsToWrappedComponent: __DEV__,
  }
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(props: P, ref: Ref<T>): ReactElement<Q> {
    const { colors } = useTheming();
    return doWrap(
      Component,
      props,
      ref,
      colors,
      !!stripStyledPropsToWrappedComponent
    );
  }
  useWrapped.displayName = hocDisplayName("withStyled", Component);
  return forwardRef(useWrapped);
}
