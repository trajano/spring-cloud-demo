import { FontSource } from "expo-font";
import type { Dict, I18nOptions } from "i18n-js";
import type { PropsWithChildren } from "react";
import type { ColorSchemeName } from "react-native";

import type { ColorSchemes } from "./Themes";
import type { Typography } from "./Typography";

interface ColorThemeProviderProps {
  colorSchemeColors?: ColorSchemes;
  /**
   * Color scheme to use. If falsy it will use the system if not available it
   * will use the default.
   */
  colorScheme?: ColorSchemeName;
  /**
   * Color scheme to use as a fallback in case it couldn't be determined from
   * the system.
   */
  defaultColorScheme?: NonNullable<ColorSchemeName>;
  /**
   * If specified, this gets called when the color scheme is changed using
   * setColorScheme.
   *
   * @param nextColorScheme Color scheme, nullable to allow clearing the value.
   */
  onColorSchemeChange?: (nextColorScheme: ColorSchemeName) => void;
}
interface FontThemeProviderProps {
  /** Expo-font module assets to load up. */
  fontModules?: Record<string, FontSource | Function>[];
  /** A list of roles for the text to provide repetitive text styles. */
  textRoles?: Record<string, Typography>;
}
interface LocalizationThemeProviderProps {
  /**
   * Locale to use. If not present it will use the system if not available it
   * will use the default.
   */
  locale?: string | null;
  /** Locale if not provided by the system */
  defaultLocale?: string;
  /** I18n translations. */
  translations?: Dict;
  /** I18n options. */
  i18nOptions?: I18nOptions;
  /**
   * If specified, this gets called when the locale is changed using setLocale.
   *
   * @param nextLocale Locale, nullable to allow clearing the value.
   */
  onLocaleChange?: (nextLocale: string | null) => void;
}
export type ThemeProviderProps = PropsWithChildren<
  ColorThemeProviderProps &
    FontThemeProviderProps &
    LocalizationThemeProviderProps
>;
