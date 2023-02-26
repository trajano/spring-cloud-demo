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
import { SwitchProps } from "react-native";

import { InputState } from "./InputState";
import { doStyleWrap } from "./doStyleWrap";
import { hocDisplayName } from "./hocDisplayName";
import { WithStyledProps } from "./withStyled";
import { StyleProps } from "../StyleProps";
import { useTheming } from "../ThemeContext";
import { lookupColor } from "../lookupColor";

/**
 * This wraps a view component so the styles are exposed.
 *
 * @typeParam Q The props for the wrapped component
 * @typeParam O Options for the HoC building
 * @param Component Component to wrap
 * @param options Options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
export function withStyledSwitch<
  P extends Q & StyleProps,
  Q extends SwitchProps,
  T
>(
  Component: ComponentType<Q>,
  {
    displayName,
    defaultDisplayName,
    stripStyledPropsToWrappedComponent,
  }: WithStyledProps = {
    stripStyledPropsToWrappedComponent: __DEV__,
  }
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(
    { onValueChange: originalOnValueChange, disabled, value, ...props }: P,
    ref: Ref<T>
  ): ReactElement<Q> {
    const { colors } = useTheming();
    const [inputState, setInputState] = useState<InputState>(() => {
      if (disabled) {
        return "disabled";
      } else if (value === true) {
        return "enabled";
      } else {
        return "disabled";
      }
    });

    const augmentedOnValueChange = useCallback(
      (nextValue: boolean) => {
        setInputState(value ? "enabled" : "default");
        const res = originalOnValueChange?.(nextValue);
        if (res instanceof Promise) {
          res.catch(console.error);
        }
      },
      [setInputState, originalOnValueChange, value]
    );

    props.thumbColor =
      props.thumbColor ?? lookupColor(colors.input.switch.thumb, colors);
    props.trackColor = props.trackColor ?? {
      false: lookupColor(colors.input.switch.false, colors),
      true: lookupColor(colors.input.switch.true, colors),
    };

    props.borderColor =
      props.borderColor ?? lookupColor(colors.input.border[inputState], colors);
    props.backgroundColor =
      props.backgroundColor ?? lookupColor(colors.input[inputState][1], colors);

    props.ios_backgroundColor = props.ios_backgroundColor ?? "transparent";

    return doStyleWrap(
      Component,
      { disabled, value, onValueChange: augmentedOnValueChange, ...props } as P,
      ref,
      colors,
      !!stripStyledPropsToWrappedComponent
    );
  }
  useWrapped.displayName = hocDisplayName("withStyledSwitch", Component, {
    displayName,
    defaultDisplayName,
  });
  return forwardRef(useWrapped);
}
