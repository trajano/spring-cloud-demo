import { ColorValue } from "react-native";

import { ColorSwatch } from "./ColorSwatch";

/**
 * Defines a color. If it is a {@link ColorSwatch} then context-sensitive effects
 * can be applied based on the swatch. If it is a {@link ColorValue}, then it
 * will use that color in all contexts.
 */
type Color = ColorSwatch | ColorValue;
/**
 * Foreground (first element) and background (second element) colors or
 * swatches.
 */
type ColorLayers = UnswatchedColorLayers | [Color, Color];
/**
 * Foreground (first element) and background (second element) colors. These are
 * not swatched as they should have no context. Also it must be string color
 * values and not an OpaqueColorValue as [there is no function to convert
 * OpaqueColorValue to a
 * string](https://stackoverflow.com/questions/74414382/how-do-you-convert-opaquecolorvalue-of-colorvalue-to-a-string)
 * and React Navigation requires `string` in their theme.
 */
type UnswatchedColorLayers = [string, string];

export interface ColorSchemeColors {
  /** This are the layers used by the root views */
  default: UnswatchedColorLayers;
  /**
   * These are specifically used for navigation elements corresponding to React
   * Native Navigation. The values of `text` and `background` will be taken from
   * `default`.
   */
  navigation: {
    primary: string;
    card: string;
    border: string;
    notification: string;
  };

  /** Colors for input fields such as TextInput. */
  input: {
    /**
     * TextInput will use `enabled` when focused. Switch will use this as the
     * "true" value.
     */
    enabled: UnswatchedColorLayers;
    /** Disabled is `editable = false` */
    disabled: UnswatchedColorLayers;
    default: UnswatchedColorLayers;
    /** Color for the placeholder text which can vary depending on field state. */
    placeholderText: {
      enabled: ColorValue;
      disabled: ColorValue;
      default: ColorValue;
    };
    /** Color for the border which can vary depending on field state. */
    border: {
      enabled: ColorValue;
      disabled: ColorValue;
      default: ColorValue;
    };
    /**
     * Color for the selection highlight and cursor color. Applicable only on
     * focused.
     */
    selection: ColorValue;
    switch: {
      /** Color for the Switch thumb. */
      thumb: ColorValue;
      /** Color for true value track */
      true: ColorValue;
      /** Color for false value track */
      false: ColorValue;
    };
  };

  /**
   * Other color layers. This may be `primary`, `secondary`, `disabled`,
   * `danger` to represent different button states.
   */
  layers: Record<string, ColorLayers>;
  /** Aliased colors. */
  aliases: Record<string, Color>;
}
