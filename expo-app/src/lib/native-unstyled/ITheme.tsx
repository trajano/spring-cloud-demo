import { Theme as ReactNavigationTheme } from "@react-navigation/native";
import { ColorSchemeName, TextStyle } from "react-native";

import { ColorSchemeColors } from "./Themes";

/**
 * Theme will still include non-color stuff like fonts etc.  But only the color scheme is selectable.
 */
export interface ITheme {
  colorScheme: NonNullable<ColorSchemeName>;
  colors: ColorSchemeColors;
  reactNavigationTheme: ReactNavigationTheme;
  /**
   * Sets to the color scheme
   * @param colorScheme color scheme if null it will switch to the system color scheme.
   */
  setColorScheme(colorScheme: ColorSchemeName | null): void;
  /**
   * 
   * @param locale locale to switch to or swith to the first system locale or default
   */
  setLocale(locale: string | null): void;
  /**
   * Default typography.  This is only set to the value specified in the provider once the loading
   * has been completed to prevent missing font messages.  This also specifies the colors.
   */
  defaultTypography: TextStyle;
  /**
   * This obtains the typography for a given text role and an optional size.
   * @param role text role.
   * @param size text role size.
   */
  typography(role?: string, size?: string): TextStyle;
  /**
   * Indicates the the fonts registered in the theme have all been loaded.
   */
  fontsLoaded: boolean;
}
