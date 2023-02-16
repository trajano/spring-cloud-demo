import * as RN from "react-native";

import { ColorSchemeColors } from "./ColorSchemeColors";

function lookupLayerColor(
  requestedLayerColor: string,
  colorSchemeColors: ColorSchemeColors
) {
  if (requestedLayerColor === "default:f") {
    // default layer foreground lookup
    return lookupColor(colorSchemeColors.default[0], colorSchemeColors);
  } else if (requestedLayerColor.startsWith("default:")) {
    // default layer background lookup
    return lookupColor(colorSchemeColors.default[1], colorSchemeColors);
  }
  // This is a layer lookup
  const layerName = requestedLayerColor.substring(
    0,
    requestedLayerColor.indexOf(":")
  );
  const isForeground = requestedLayerColor.endsWith(":f");
  if (!(layerName in colorSchemeColors.layers)) {
    return requestedLayerColor;
  }
  const layer = colorSchemeColors.layers[layerName];
  if (isForeground) {
    if (typeof layer[0] === "object" && layer[0].hasOwnProperty("500")) {
      return lookupColor(layer[0]["500"], colorSchemeColors);
    } else {
      return lookupColor(layer[0] as RN.ColorValue, colorSchemeColors);
    }
  } else {
    if (typeof layer[1] === "object" && layer[1].hasOwnProperty("500")) {
      return lookupColor(layer[1]["500"], colorSchemeColors);
    } else {
      return lookupColor(layer[1] as RN.ColorValue, colorSchemeColors);
    }
  }
}

/**
 * Given a color, resolve based on the aliases The color can be requested as any
 * standard react-native color value or `color.swatchvalue` (with the . means it
 * is a swatch lookup) `layer:f` or `layer:b` (with the : means its a layer look
 * up) Layer lookup will be done first then the alias will be looked up. The
 * `:b` is optional, only `:f` needs to be explicit
 *
 * @param requestedColor The requested color.
 * @param colorSchemeColors
 * @returns A color value. This will never return null.
 */
export function lookupColor(
  requestedColor: RN.ColorValue | string,
  colorSchemeColors: ColorSchemeColors
): RN.ColorValue {
  if (typeof requestedColor === "string") {
    if (requestedColor.indexOf(":") > 0) {
      return lookupLayerColor(requestedColor, colorSchemeColors);
    }

    let colorName = requestedColor;
    let swatchValue = "500";
    if (requestedColor.indexOf(".") > 0) {
      colorName = requestedColor.substring(0, requestedColor.indexOf("."));
      swatchValue = requestedColor.substring(requestedColor.indexOf(".") + 1);
    }
    // resolve alias first
    const aliased = colorSchemeColors.aliases[colorName];
    if (aliased) {
      if (
        typeof aliased === "object" &&
        aliased.hasOwnProperty(swatchValue) &&
        (swatchValue === "50" ||
          swatchValue === "100" ||
          swatchValue === "200" ||
          swatchValue === "300" ||
          swatchValue === "400" ||
          swatchValue === "500" ||
          swatchValue === "600" ||
          swatchValue === "700" ||
          swatchValue === "800" ||
          swatchValue === "900")
      ) {
        return aliased[swatchValue];
      } else if (aliased.hasOwnProperty("__TYPE__")) {
        return aliased as RN.ColorValue;
      } else if (typeof aliased === "string") {
        return aliased;
      }
    }
  }
  return requestedColor;
}
