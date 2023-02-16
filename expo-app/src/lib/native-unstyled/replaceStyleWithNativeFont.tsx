import Constants from "expo-constants";
import * as Font from "expo-font";
import isEmpty from "lodash/isEmpty";
import omit from "lodash/omit";
import pickBy from "lodash/pickBy";
import { useCallback } from "react";
import { StyleProp, TextStyle } from "react-native";
function fontAvailable(fontFamily: string): boolean {
  return (
    Font.isLoaded(fontFamily) ||
    Constants.systemFonts.findIndex((f) => f === fontFamily) !== -1
  );
}
/** @testonly */
export function replaceStyleWithNativeFont(
  { fontFamily, fontWeight, fontStyle, ...rest }: TextStyle,
  fonts: Record<string, string>,
  defaultTextStyle: TextStyle
): TextStyle | undefined {
  let ret: TextStyle | undefined = undefined;
  if (!fontFamily && !fontWeight && !fontStyle) {
    ret = { ...defaultTextStyle, ...rest };
  } else if (fontFamily) {
    const fontFamilyForKey =
      fonts[`${fontFamily}:${fontWeight ?? "400"}:${fontStyle ?? "normal"}`];
    if (fontFamilyForKey) {
      ret = { ...defaultTextStyle, fontFamily: fontFamilyForKey, ...rest };
    } else if (
      fontWeight === "bold" &&
      fontStyle &&
      fonts[`${fontFamily}:normal:${fontStyle}`]
    ) {
      // Allow for faux-bold fonts
      ret = {
        ...defaultTextStyle,
        fontFamily: fonts[`${fontFamily}:normal:${fontStyle}`],
        fontWeight: "bold",
        ...rest,
      };
    } else if (
      fontStyle === "italic" &&
      fontWeight &&
      fonts[`${fontFamily}:${fontWeight}:normal`]
    ) {
      // Allow for faux-italic fonts
      ret = {
        ...defaultTextStyle,
        fontFamily: fonts[`${fontFamily}:${fontWeight}:normal`],
        fontStyle: "italic",
        ...rest,
      };
    } else if (
      fontWeight === "bold" &&
      fontStyle === "italic" &&
      fonts[`${fontFamily}:normal:normal`]
    ) {
      // Allow for faux-bold-italic fonts
      ret = {
        ...defaultTextStyle,
        fontFamily: fonts[`${fontFamily}:normal:normal`],
        fontWeight: "bold",
        fontStyle: "italic",
        ...rest,
      };
    } else if (!fontAvailable(fontFamily)) {
      ret = { ...defaultTextStyle, fontWeight, fontStyle, ...rest };
    } else {
      ret = { ...defaultTextStyle, fontFamily, fontWeight, fontStyle, ...rest };
    }
  }
  return isEmpty(ret) ? undefined : pickBy(ret);
}

export function useReplaceWithNativeFontCallback(
  loaded: boolean,
  loadedFonts: Record<string, string>
): (
  flattenedStyle: TextStyle,
  defaultTextStyle?: TextStyle
) => StyleProp<TextStyle> | undefined {
  const replaceWithNativeFont = useCallback(
    (flattenedStyle: TextStyle, defaultTextStyle: TextStyle = {}) => {
      if (loaded) {
        return replaceStyleWithNativeFont(
          flattenedStyle,
          loadedFonts,
          defaultTextStyle
        );
      } else {
        const ret = omit(
          { ...defaultTextStyle, ...flattenedStyle },
          "fontFamily"
        );
        return isEmpty(ret) ? undefined : pickBy(ret);
      }
    },
    [loaded, loadedFonts]
  );
  return replaceWithNativeFont;
}
