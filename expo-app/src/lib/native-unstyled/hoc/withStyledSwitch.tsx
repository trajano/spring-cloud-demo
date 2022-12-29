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
  useState
} from "react";
import { SwitchProps } from "react-native";
import { hocDisplayName } from "./hocDisplayName";
import { lookupColor } from "../lookupColor";
import { StyleProps } from "../StyleProps";
import { useTheming } from "../ThemeContext";
import { WithStyledProps } from "./withStyled";
import { doWrap } from "./doWrap";
import { InputState } from "./InputState";

/**
 * This wraps a view component so the styles are exposed.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam Q the props for the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
export function withStyledSwitch<
  P extends Q & StyleProps,
  Q extends SwitchProps,
  T
>(
  Component: ComponentType<Q>,
  { stripStyledPropsToWrappedComponent }: WithStyledProps = {
    stripStyledPropsToWrappedComponent: __DEV__,
  }
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped({ onValueChange, disabled, value, ...props }: P, ref: Ref<T>): ReactElement<Q> {
    const { colors } = useTheming();
    const [inputState, setInputState] = useState<InputState>(
      disabled === true ? "disabled" : value ? "enabled" : "default"
    );
    const originalOnValueChange = useCallback(onValueChange ?? noop, [onValueChange]);

    const augmentedOnValueChange = useCallback(
      (nextValue: boolean) => {
        setInputState(value ? "enabled" : "default");
        originalOnValueChange(nextValue);
      },
      [setInputState, originalOnValueChange, value]
    );

    props.thumbColor = props.thumbColor ?? lookupColor(colors.input.switch.thumb, colors);
    props.trackColor = props.trackColor ?? {
      false: lookupColor(colors.input.switch.false, colors),
      true: lookupColor(colors.input.switch.true, colors)
    };

    props.borderColor =
      props.borderColor ??
      lookupColor(colors.input.border[inputState], colors);
    props.backgroundColor =
      props.backgroundColor ??
      lookupColor(colors.input[inputState][1], colors);

    props.ios_backgroundColor =
      props.ios_backgroundColor ?? "transparent";

    return doWrap(
      Component,
      { disabled, value, onValueChange: augmentedOnValueChange, ...props } as P,
      ref,
      colors,
      !!stripStyledPropsToWrappedComponent
    );
  }
  useWrapped.displayName = hocDisplayName("withStyledSwitch", Component);
  return forwardRef(useWrapped);
}
