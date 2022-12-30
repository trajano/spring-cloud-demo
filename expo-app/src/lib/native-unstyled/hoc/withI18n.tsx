import {
  ComponentType,
  forwardRef,
  NamedExoticComponent,
  PropsWithoutRef,
  ReactElement,
  Ref,
  RefAttributes,
} from "react";
import { TextInputProps, TextProps } from "react-native";

import { useTheming } from "../ThemeContext";
import { hocDisplayName } from "./hocDisplayName";

type I18nProps = {
  _t?: string;
  /**
   * Key for `accessibilityLabel`
   */
  _a?: string;
  /**
   * Key for `placeholder`
   */
  _p?: string;
  /**
   * Key for `returnKeyLabel`.  This is Android only.
   */
  _rkl?: string;
  _tp?: Record<string, unknown>;
};
type I18nHocOptions = {
  /**
   * This is a mapping of localization key props to the real prop.
   * This is added in addition to
   * ```
   * {
   * _a: "accessibilityLabel" ,
   * _p: "placeholder",
   * _rkl: "returnKeyLabel"
   * }
   * ```
   */
  localizedMap?: Record<string, keyof Omit<TextInputProps, "children">>;
  /**
   * If true, then the children are replaced with the value of `_t`.
   */
  _tIsChild?: boolean;
};
export function withI18n<P extends Q & I18nProps, Q extends TextProps, T>(
  Component: ComponentType<Q>,
  {
    _tIsChild = false,
    localizedMap = {
      _a: "accessibilityLabel",
    },
  }: I18nHocOptions = {}
): NamedExoticComponent<PropsWithoutRef<P> & RefAttributes<T>> {
  function useWrapped(
    { _t, _tp, children: inChildren, ...rest }: P,
    ref: Ref<T>
  ): ReactElement<Q> {
    const { t } = useTheming();

    const localizedProps: Record<string, string | undefined> = {};
    for (const localizationKey in localizedMap) {
      if (localizationKey in rest) {
        const target = localizedMap[localizationKey] as keyof TextInputProps;
        localizedProps[localizationKey] = undefined;
        localizedProps[target] = t(localizationKey, _tp);
      }
    }
    if (_tIsChild && _t) {
      return (
        <Component ref={ref} {...(rest as any)} {...localizedProps}>
          {t(_t, _tp)}
        </Component>
      );
    } else {
      return (
        <Component ref={ref} {...(rest as any)} {...localizedProps}>
          {inChildren}
        </Component>
      );
    }
  }
  useWrapped.displayName = hocDisplayName("withI18n", Component);
  return forwardRef(useWrapped);
}