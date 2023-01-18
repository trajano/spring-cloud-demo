import isEmpty from "lodash/isEmpty";
import { ComponentType, ReactElement, Ref } from "react";
import { StyleProp } from "react-native";

import { ColorSchemeColors } from "../ColorSchemeColors";
import { StyleProps } from "../StyleProps";
import { TextStyleProps } from "../TextStyleProps";
import { propsToStyleSheet, withoutStyledProps } from "../propsToStyleSheet";

/**
 * Wrapper function creator for styles.
 *
 * @param Component
 * @param param1
 * @param ref
 * @param colors
 * @param stripStyledPropsToWrappedComponent
 * @returns
 */
export function doStyleWrap<
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
