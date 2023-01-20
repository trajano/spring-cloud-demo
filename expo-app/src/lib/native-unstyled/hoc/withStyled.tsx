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

import { doStyleWrap } from "./doStyleWrap";
import { hocDisplayName } from "./hocDisplayName";
import { StyleProps } from "../StyleProps";
import { useTheming } from "../ThemeContext";

export interface WithStyledProps {
  /**
   * Specifies that the style props are stripped out before calling the
   * component. This is disabled by default on production for performance, but
   * enabled on development.
   */
  stripStyledPropsToWrappedComponent?: boolean;
}

/**
 * This wraps a view component so the styles are exposed.
 *
 * @typeParam Q The props for the wrapped component
 * @typeParam O Options for the HoC building
 * @param Component Component to wrap
 * @param options Options for the HoC building
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
    return doStyleWrap(
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
