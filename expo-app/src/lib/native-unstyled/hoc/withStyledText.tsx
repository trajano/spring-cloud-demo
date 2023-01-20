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
import { WithStyledProps } from "./withStyled";
import { StyleProps } from "../StyleProps";
import { TextStyleProps } from "../TextStyleProps";
import { useTheming } from "../ThemeContext";

/**
 * This wraps a view component so the styles are exposed.
 *
 * @typeParam Q The props for the wrapped component
 * @typeParam O Options for the HoC building
 * @param Component Component to wrap
 * @param options Options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */

export function withStyledText<
  P extends Q & StyleProps & TextStyleProps,
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
  useWrapped.displayName = hocDisplayName("withStyledText", Component);
  return forwardRef(useWrapped);
}
