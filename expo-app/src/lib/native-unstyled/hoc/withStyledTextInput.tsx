import noop from "lodash/noop";
import {
  ComponentType,
  forwardRef,
  NamedExoticComponent,
  PropsWithoutRef,
  ReactElement,
  Ref,
  RefAttributes,
  useCallback,
  useState,
} from "react";
import { TextInputProps } from "react-native";

import { StyleProps } from "../StyleProps";
import { TextStyleProps } from "../TextStyleProps";
import { useTheming } from "../ThemeContext";
import { lookupColor } from "../lookupColor";
import type { InputState } from "./InputState";
import { doWrap } from "./doWrap";
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
export function withStyledTextInput<
  P extends Q & StyleProps & TextStyleProps,
  Q extends TextInputProps,
  T
>(
  Component: ComponentType<Q>,
  { stripStyledPropsToWrappedComponent }: WithStyledProps = {
    stripStyledPropsToWrappedComponent: __DEV__,
  }
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(
    { editable, onFocus, onBlur, ...props }: P,
    ref: Ref<T>
  ): ReactElement<Q> {
    const { colors } = useTheming();
    const [inputState, setInputState] = useState<InputState>(
      editable === false ? "disabled" : "default"
    );
    const originalOnFocus = useCallback(onFocus ?? noop, [onFocus]);
    const augmentedOnFocus = useCallback(
      (ev: Parameters<NonNullable<TextInputProps["onFocus"]>>[0]) => {
        if (editable !== false) {
          setInputState("enabled");
        }
        originalOnFocus(ev);
      },
      [setInputState, originalOnFocus, editable]
    );

    const originalOnBlur = useCallback(onBlur ?? noop, [onBlur]);
    const augmentedOnBlur = useCallback(
      (ev: Parameters<NonNullable<TextInputProps["onBlur"]>>[0]) => {
        if (editable !== false) {
          setInputState("default");
        }
        originalOnBlur(ev);
      },
      [setInputState, originalOnBlur, editable]
    );

    props.selectionColor =
      props.selectionColor ?? lookupColor(colors.input.selection, colors);
    props.placeholderTextColor =
      props.placeholderTextColor ??
      lookupColor(colors.input.placeholderText[inputState], colors);

    props.borderColor =
      props.borderColor ?? lookupColor(colors.input.border[inputState], colors);
    props.backgroundColor =
      props.backgroundColor ?? lookupColor(colors.input[inputState][1], colors);
    props.color =
      props.color ?? lookupColor(colors.input[inputState][0], colors);

    return doWrap(
      Component,
      {
        editable,
        onFocus: augmentedOnFocus,
        onBlur: augmentedOnBlur,
        ...props,
      } as P,
      ref,
      colors,
      !!stripStyledPropsToWrappedComponent
    );
  }
  useWrapped.displayName = hocDisplayName("withStyledTextInput", Component);
  return forwardRef(useWrapped);
}