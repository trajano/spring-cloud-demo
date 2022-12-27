import { Dict } from "i18n-js";
import type { PropsWithChildren } from 'react';
import { ColorSchemeName } from "react-native";
import { ColorSchemes } from "./Themes";
import { Typography } from "./Typography";

export type ThemeProviderProps = PropsWithChildren<{
  colorSchemeColors?: ColorSchemes;
  /**
   * Color scheme to use.  If not present it will use the system if not available it will use the default.
   * If a function is provided it will use the value of the function as the intial color scheme, but uses 
   * defaultColorScheme while it is starting up.
   */
  colorScheme?: NonNullable<ColorSchemeName> | (() => Promise<NonNullable<ColorSchemeName>>);
  /**
   * Color scheme to use.  If not present it will use the system if not available it will use the default.
   * If a function is provided it will use the value of the function as the intial locale, but uses 
   * defaultLocale while it is starting up.
   */
  locale?: string | (() => Promise<string>);
  /**
   * Color scheme to use as a fallback in case it couldn't be determined from the system.
   */
  defaultColorScheme: NonNullable<ColorSchemeName>;
  /**
   * Locale if not provided by the system
   */
  defaultLocale?: string;
  /**
   * expo-font module assets to load up.
   */
  fontModules?: any[];
  /**
   * A list of roles for the text to provide repetitive text styles.
   */
  textRoles?: Record<string, Typography>;

  /**
   * i18n translations.
   */
  translations?: Dict;
}>;
