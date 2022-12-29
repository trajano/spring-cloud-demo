import isEmpty from "lodash/isEmpty";
import {
  ComponentType,
  forwardRef,
  NamedExoticComponent,
  PropsWithoutRef,
  ReactElement,
  Ref,
  RefAttributes,
} from "react";
import { TextProps } from "react-native";

import { useTheming } from "../ThemeContext";
import { hocDisplayName } from "./hocDisplayName";

/**
 * This is a simple HoC that is a noop that supports ref forwarding.  The ref fowarding logic is added
 * as [refs are not passed through](https://reactjs.org/docs/higher-order-components.html#refs-arent-passed-through)
 * HoCs by default.
 * @param Component component to wrap
 * @param options options for the HoC building
 * @typeParam P the exposed props of the higher order component (does not require Q props)
 * @typeParam Q the props for the wrapped component
 * @typeParam T type for ref attribute of the wrapped component
 * @typeParam O options for the HoC building
 * @returns A named exotic componentwith P props that accepts a ref
 */
export function withTextRole<
  P extends Q & { role?: string; typeScale?: string },
  Q extends TextProps,
  T
>(
  Component: ComponentType<Q>
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(
    { role, typeScale, style, ...rest }: P,
    ref: Ref<T>
  ): ReactElement<Q> {
    const { typography } = useTheming();
    const typographyStyle = typography(role, typeScale);
    const styleAvailable = !isEmpty(style);
    const styleFromAvailable = !isEmpty(typographyStyle);

    if (styleAvailable && styleFromAvailable) {
      return (
        <Component
          {...(rest as any)}
          style={[style, typographyStyle]}
          ref={ref}
        />
      );
    } else if (styleAvailable && !styleFromAvailable) {
      return <Component {...(rest as any)} style={style} ref={ref} />;
    } else if (!styleAvailable && styleFromAvailable) {
      return <Component {...(rest as any)} style={typographyStyle} ref={ref} />;
    } else {
      return <Component {...(rest as any)} ref={ref} />;
    }
  }
  useWrapped.displayName = hocDisplayName("withTextRole", Component);
  return forwardRef(useWrapped);
}
