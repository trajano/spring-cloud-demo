import isEmpty from "lodash/isEmpty";
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
import { StyleProp, TextInputProps } from "react-native";

import { StyleProps } from "./StyleProps";
import { TextStyleProps } from "./TextStyleProps";
import { useTheming } from "./ThemeContext";
import { ColorSchemeColors } from "./Themes";
import { hocDisplayName } from "./hocDisplayName";
import { lookupColor } from "./lookupColor";
import { propsToStyleSheet, withoutStyledProps } from "./propsToStyleSheet";

type WithStyledProps = {
  /**
   * Specifies that the style props are stripped out before calling the component.
   * This is disabled by default on production for performance, but enabled on development.
   */
  stripStyledPropsToWrappedComponent?: boolean;
};

function doWrap<
  P extends Q & StyleProps & TextStyleProps,
  Q extends { style?: StyleProp<any> },
  T
>(
  Component: ComponentType<Q>,
  { style, ...rest }: P,
  ref: Ref<T>,
  colors: ColorSchemeColors,
  stripStyledPropsToWrappedComponent: boolean
): ReactElement<Q> {
  const stylesFromProps = propsToStyleSheet(rest, colors);
  const componentProps: Q = (stripStyledPropsToWrappedComponent
    ? withoutStyledProps(rest)
    : rest) as unknown as Q;
  const styleAvailable = !isEmpty(style);
  const styleFromAvailable = !isEmpty(stylesFromProps);
  if (styleAvailable && styleFromAvailable) {
    return (
      <Component
        {...componentProps}
        style={[style, stylesFromProps]}
        ref={ref}
      />
    );
  } else if (styleAvailable && !styleFromAvailable) {
    return <Component {...componentProps} style={style} ref={ref} />;
  } else if (!styleAvailable && styleFromAvailable) {
    return <Component {...componentProps} style={stylesFromProps} ref={ref} />;
  } else {
    return <Component {...componentProps} ref={ref} />;
  }
}

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
    return doWrap(
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

type InputState = "default" | "disabled" | "focused";
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
  function useWrapped({ ...props }: P, ref: Ref<T>): ReactElement<Q> {
    const { colors } = useTheming();
    const [inputState, setInputState] = useState<InputState>(
      props.editable === false ? "disabled" : "default"
    );
    const onFocus = useCallback(
      () => props.editable !== false && setInputState("focused"),
      [setInputState, props.editable]
    );
    const onBlur = useCallback(
      () => props.editable !== false && setInputState("default"),
      [setInputState, props.editable]
    );

    props.selectionColor =
      props.selectionColor ?? lookupColor(colors.textInput.selection, colors);
    props.placeholderTextColor =
      props.placeholderTextColor ??
      lookupColor(colors.textInput.placeholderText[inputState], colors);

    props.borderColor =
      props.borderColor ??
      lookupColor(colors.textInput.border[inputState], colors);
    props.backgroundColor =
      props.backgroundColor ??
      lookupColor(colors.textInput[inputState][1], colors);
    props.color =
      props.color ?? lookupColor(colors.textInput[inputState][0], colors);

    props.onFocus = props.onFocus ?? onFocus;
    props.onBlur = props.onBlur ?? onBlur;
    return doWrap(
      Component,
      props,
      ref,
      colors,
      !!stripStyledPropsToWrappedComponent
    );
  }
  useWrapped.displayName = hocDisplayName("withStyledTextInput", Component);
  return forwardRef(useWrapped);
}
