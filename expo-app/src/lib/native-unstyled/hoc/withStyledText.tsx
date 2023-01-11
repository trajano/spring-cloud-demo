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
import { TextStyleProps } from "../TextStyleProps";
import { useTheming } from "../ThemeContext";
import { doStyleWrap } from "./doStyleWrap";
import { hocDisplayName } from "./hocDisplayName";
import { WithStyledProps } from "./withStyled";

/**
 * This wraps a view component so the styles are exposed.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam Q the props for the wrapped component
 * @typeParam O options for the HoC building
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
