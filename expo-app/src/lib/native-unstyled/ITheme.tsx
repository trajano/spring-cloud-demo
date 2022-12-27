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
  setColorScheme(colorScheme: NonNullable<ColorSchemeName>): void;
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
}
