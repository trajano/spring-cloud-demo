import Constants from 'expo-constants';
import * as Font from "expo-font";
import isEmpty from 'lodash/isEmpty';
import pickBy from 'lodash/pickBy';
import { TextStyle } from "react-native";
function fontAvailable(fontFamily: string): boolean {
  return Font.isLoaded(fontFamily) || Constants.systemFonts.findIndex((f) => f === fontFamily) !== -1;
}
export function replaceStyleWithNativeFont({ fontFamily, fontWeight, fontStyle, ...rest }: TextStyle, fonts: Record<string, string>, defaultTextStyle: TextStyle): TextStyle | undefined {
  let ret: TextStyle;
  if (!fontFamily && !fontWeight && !fontStyle) {
    ret = { ...defaultTextStyle, ...rest };
  } else {
    const fontFamilyForKey = fonts[`${fontFamily}:${fontWeight ?? "400"}:${fontStyle ?? "normal"}`];
    if (fontFamilyForKey) {
      ret = { ...defaultTextStyle, fontFamily: fontFamilyForKey, ...rest };
      // } else if (fontWeight === "bold" && fontStyle === "italic" && loadedFonts[`${fontFamily}:normal:italic`]) {
      //   // Allow for faux-italic fonts
      //   return { fontFamily: loadedFonts[`${fontFamily}:normal:normal`], fontWeight: "bold", fontStyle: "italic", ...rest };
    } else if (fontWeight === "bold" && fonts[`${fontFamily}:normal:${fontStyle}`]) {
      // Allow for faux-bold fonts
      ret = { ...defaultTextStyle, fontFamily: fonts[`${fontFamily}:normal:${fontStyle}`], fontWeight: "bold", ...rest };

    } else if (fontStyle === "italic" && fonts[`${fontFamily}:${fontWeight}:normal`]) {
      // Allow for faux-italic fonts
      ret = { ...defaultTextStyle, fontFamily: fonts[`${fontFamily}:${fontWeight}:normal`], fontStyle: "italic", ...rest };

    } else if (fontWeight === "bold" && fontStyle === "italic" && fonts[`${fontFamily}:normal:normal`]) {
      // Allow for faux-bold fonts
      ret = { ...defaultTextStyle, fontFamily: fonts[`${fontFamily}:normal:${fontStyle}`], fontWeight: "bold", fontStyle: "italic", ...rest };
    } else if (fontFamily && !fontAvailable(fontFamily)) {
      ret = ({ ...defaultTextStyle, fontWeight, fontStyle, ...rest });
    } else {
      ret = ({ ...defaultTextStyle, fontFamily, fontWeight, fontStyle, ...rest });
    }
  }
  return isEmpty(ret) ? undefined : pickBy(ret);
}
