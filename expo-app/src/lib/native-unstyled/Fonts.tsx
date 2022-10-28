import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import * as Font from "expo-font";
import { useRef } from "react";
import { useEffect } from "react";
import { useState } from "react";
import {
  createContext,
  PropsWithChildren,
  ReactElement,
  useContext,
} from "react";
import { TextStyle } from "react-native";

type FontKey = Pick<TextStyle, "fontFamily" | "fontWeight" | "fontStyle">;
type IFonts = {
  /**
   * These are fonts that are loaded.  They are keyed using a colon separated composite key containing the family, weight and style of the font.
   */
  loadedFonts: Record<string, string>;
  replaceWithNativeFont(
    key: TextStyle
  ): TextStyle;
};
const FontsContext = createContext<IFonts>({
  loadedFonts: {},
  replaceWithNativeFont: () => ({}),
});
type FontsProviderProps = PropsWithChildren<{
  fontModules: any[];
}>;
const moduleFontWeightToStyleFontWeight: Record<
  string,
  TextStyle["fontWeight"]
> = {
  "100Thin": "100",
  "200ExtraLight": "200",
  "300Light": "300",
  "400Regular": "400",
  "500Medium": "500",
  "600SemiBold": "600",
  "700Bold": "700",
  "800ExtraBold": "800",
  "900Black": "900",
};
function splitName(
  fontName: string
): [TextStyle["fontFamily"], TextStyle["fontWeight"], TextStyle["fontStyle"]] {
  const split = fontName.split("_", 3);
  return [
    split[0],
    moduleFontWeightToStyleFontWeight[split[1]] ?? "normal",
    split[2] === "Italic" ? "italic" : "normal",
  ];
}

export function FontsProvider({
  fontModules,
  children
}: FontsProviderProps): ReactElement {

  const [loadedFonts, setLoadedFonts] = useState<Record<string, string>>({});

  function replaceWithNativeFont({ fontFamily, fontWeight = "normal", fontStyle = "normal", ...rest }: TextStyle): TextStyle {
    const fontFamilyForKey = loadedFonts[`${fontFamily}:${fontWeight}:${fontStyle}`];
    console.log(`${fontFamily}:${fontWeight}:${fontStyle}`)
    if (fontFamilyForKey) {
      return { fontFamily: fontFamilyForKey, ...rest };
    } else if (fontStyle === "italic" && loadedFonts[`${fontFamily}:${fontWeight}:normal`]) {
      // Allow for faux-italic fonts
      return { fontFamily: loadedFonts[`${fontFamily}:${fontWeight}:normal`], fontStyle: "italic", ...rest };
    } else {
      return { fontFamily, fontWeight, fontStyle, ...rest };
    }
  }
  useAsyncSetEffect(async function () {
    const fontsLoadedInEffect: Record<string, string> = {}
    for (const fontModule of fontModules) {


      for (const fontName in fontModule) {
        if (
          typeof fontModule[fontName] === "function" ||
          typeof fontModule[fontName] === "object"
        ) {
          continue;
        }
        const [fontFamily, fontWeight, fontStyle] = splitName(fontName);
        await Font.loadAsync({ [fontName]: fontModule[fontName] });
        fontsLoadedInEffect[`${fontFamily}:${fontWeight}:${fontStyle}`] = fontName
        if (fontWeight === "400") {
          fontsLoadedInEffect[`${fontFamily}:normal:${fontStyle}`] = fontName
        } else if (fontWeight === "700") {
          fontsLoadedInEffect[`${fontFamily}:bold:${fontStyle}`] = fontName
        }
      }
    }
    return fontsLoadedInEffect;
  },
    (fontsLoadedInEffect) => { setLoadedFonts(fontsLoadedInEffect); console.dir(fontsLoadedInEffect) },
    []);

  return <FontsContext.Provider value={{ loadedFonts, replaceWithNativeFont: replaceWithNativeFont }}>{children}</FontsContext.Provider>
}
export function useFonts() {
  return useContext(FontsContext);
}
/**
 * Implementation note.  In React Native, the styling is not sustained unlike standard HTML to handle that there needs to be a context created for nested text elements to track what is the current style.  Will do that later.
 */
