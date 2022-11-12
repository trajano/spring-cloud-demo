import { ColorValue, TextStyle } from "react-native";

/**
 * Use https://json-color-palette-generator.vercel.app/ to generate the swatches for you.
 */
export type ColorSwatch = {
  "50": ColorValue;
  "100": ColorValue;
  "200": ColorValue;
  "300": ColorValue;
  "400": ColorValue;
  "500": ColorValue;
  "600": ColorValue;
  "700": ColorValue;
  "800": ColorValue;
  "900": ColorValue;
};
/**
 * Defines a color.  If it is a {@link ColorSwatch} then context-sensitive effects can
 * be applied based on the swatch.  If it is a {@link ColorValue}, then it will use that color in all contexts.
 */
export type Color = ColorSwatch | ColorValue;
/**
 * Foreground (first element) and background (second element) colors or swatches.
 */
export type ColorLayers = UnswatchedColorLayers | [Color, Color];
/**
 * Foreground (first element) and background (second element) colors.
 * These are not swatched as they should have no context.  Also it
 * must be string color values and not an OpaqueColorValue as
 * [there is no function to convert OpaqueColorValue to a string](https://stackoverflow.com/questions/74414382/how-do-you-convert-opaquecolorvalue-of-colorvalue-to-a-string)
 * and React Navigation requires `string` in their theme.
 */
export type UnswatchedColorLayers = [string, string];
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

export type ColorSchemeColors = {
  /**
   * This are the layers used by the root views
   */
  default: UnswatchedColorLayers;
  /**
   * These are specifically used for navigation elements corresponding to React Native Navigation.
   * The values of `text` and `background` will be taken from `default`.
   */
  navigation: {
    primary: string;
    card: string;
    border: string;
    notification: string;
  };
  primary: ColorLayers;
  secondary: ColorLayers;
  tertiary: ColorLayers;
  /**
   * Danger.  Usually red.
   */
  danger: ColorLayers;
  /**
   * Warning.  Usually yellow.
   */
  warning: ColorLayers;
};
/**
 *
 */
export type ColorSchemes = {
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
};
