import { ColorValue, TextStyle } from "react-native";

/**
 * Use https://json-color-palette-generator.vercel.app/ to generate the swatches for you.
 * Color swatches must be strings as there's no capability of swapping OpaqueColors to strings.
 */
export type ColorSwatch = {
  "50": string;
  "100": string;
  "200": string;
  "300": string;
  "400": string;
  "500": string;
  "600": string;
  "700": string;
  "800": string;
  "900": string;
};
/**
 * Defines a color.  If it is a {@link ColorSwatch} then context-sensitive effects can
 * be applied based on the swatch.  If it is a {@link ColorValue}, then it will use that color in all contexts.
 */
export type Color = ColorSwatch | ColorValue;
/**
 * Foreground (first element) and background (second element) colors or swatches.
 */
export type ColorLayers = UnswatchedColorLayers | [ColorValue, ColorValue];
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

  /**
   * Colors for TextInput fields
   */
  textInput: {
    focused: ColorLayers;
    /**
     * Disabled is `editable = false`
     */
    disabled: ColorLayers;
    default: ColorLayers;
    /**
     * Color for the placeholder text which can vary depending on field state.
     */
    placeholderText: {
      focused: ColorValue;
      disabled: ColorValue;
      default: ColorValue;
    };
    /**
     * Color for the border which can vary depending on field state.
     */
    border: {
      focused: ColorValue;
      disabled: ColorValue;
      default: ColorValue;
    };
    /**
     * Color for the selection highlight and cursor color. Applicable only on focused.
     */
    selection: ColorValue;
  };
  /**
   * Other color layers.  This may be `primary`, `secondary`, `disabled`, `danger` to represent different button states.
   */
  layers: Record<string, ColorLayers>;
  /**
   * Aliased colors.
   */
  aliases: Record<string, Color>;
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
