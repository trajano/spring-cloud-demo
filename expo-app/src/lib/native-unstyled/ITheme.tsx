import { Theme as ReactNavigationTheme } from "@react-navigation/native";
import { Scope, TranslateOptions } from "i18n-js";
import { ColorSchemeName, StyleProp, TextStyle } from "react-native";

import { ColorSchemeColors } from "./ColorSchemeColors";

/**
 * Theme will still include non-color stuff like fonts etc. But only the color
 * scheme is selectable.
 */
export interface ITheme {
  colorScheme: NonNullable<ColorSchemeName>;
  colors: ColorSchemeColors;
  reactNavigationTheme: ReactNavigationTheme;
  /**
   * Default typography. This is only set to the value specified in the provider
   * once the loading has been completed to prevent missing font messages. This
   * also specifies the colors.
   */
  defaultTypography: TextStyle;
  /** Indicates the the fonts registered in the theme have all been loaded. */
  fontsLoaded: boolean;
  /** Language tag for the current locale. */
  locale: string;
  /**
   * Sets to the color scheme
   *
   * @param colorScheme Color scheme if null it will switch to the system color
   *   scheme.
   */
  setColorScheme: (colorScheme: ColorSchemeName | null) => void;
  /**
   * This obtains the typography for a given text role and an optional size.
   *
   * @param role Text role.
   * @param size Text role size.
   */
  typography: (role?: string, size?: string) => TextStyle;
  /**
   * @param locale Locale to switch to or swith to the first system locale or
   *   default
   */
  setLocale: (locale: string | null) => void;
  /**
   * Translator function. Maybe relocate it to it's own package later to
   * separate it from theme.
   *
   * @param scope
   * @param options
   */
  t: (scope: Readonly<Scope>, options?: TranslateOptions) => string;
  /**
   * Replace the data with a native font. May return undefined if it will yield
   * an empty object.
   *
   * @param flattenedStyle Style must be flattened before this method is called.
   */
  replaceWithNativeFont: (
    flattenedStyle: TextStyle,
    defaultTextStyle?: TextStyle
  ) => StyleProp<TextStyle> | undefined;
}
