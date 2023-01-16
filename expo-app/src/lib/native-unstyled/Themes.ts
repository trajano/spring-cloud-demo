import { TextStyle } from "react-native";

import { ColorSchemeColors } from "./ColorSchemeColors";

/**
 * Styles that relate directly to the native Text control.
 */
export type ThemeTextStyle = Pick<
  TextStyle,
  | "fontFamily"
  | "fontWeight"
  | "fontSize"
  | "fontVariant"
  | "letterSpacing"
  | "lineHeight"
  | "textDecorationLine"
  | "textDecorationStyle"
  | "textDecorationColor"
  | "textShadowColor"
  | "textShadowOffset"
  | "textShadowRadius"
  | "textTransform"
>;

/**
 *
 */
export interface ColorSchemes {
  /**
   * Theme when using a dark color mode
   */
  dark: ColorSchemeColors;
  /**
   * Theme when using a light color mode
   */
  light: ColorSchemeColors;
  /**
   * Other named themes.
   */
  [name: string]: ColorSchemeColors;
}
