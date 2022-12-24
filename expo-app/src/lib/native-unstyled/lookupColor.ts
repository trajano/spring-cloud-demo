import * as RN from "react-native";
import { ColorSchemeColors } from "./Themes";

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
  const layer = colorSchemeColors.layers[layerName];
  if (!layer) {
    return requestedLayerColor;
  }
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
 * Given a color, resolve based on the aliases
 * The color can be requested as any standard react-native color value or
 * `color.swatchvalue` (with the . means it is a swatch lookup)
 * `layer:f` or `layer:b` (with the : means its a layer look up)  Layer lookup will be done first then the alias will be looked up.  The `:b` is optional, only `:f`  needs to be explicit
 *
 * @param requestedColor the requested color.
 * @param colorSchemeColors
 * @return a color value.  This will never return null.
 */
export function lookupColor(
  requestedColor: RN.ColorValue,
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
    const aliased = colorSchemeColors.aliases[colorName] as any;
    if (aliased) {
      if (typeof aliased === "object" && aliased.hasOwnProperty(swatchValue)) {
        return aliased[swatchValue] as string;
      } else if (
        typeof aliased === "object" &&
        !aliased.hasOwnProperty(swatchValue)
      ) {
        return aliased as RN.ColorValue;
      } else if (typeof aliased === "string") {
        return aliased;
      }
    }
  }
  return requestedColor;
}
