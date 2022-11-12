import { useMounted } from "@trajano/react-hooks";
import * as Font from "expo-font";
import {
  createContext,
  PropsWithChildren,
  ReactElement,
  useContext, useEffect, useMemo, useState
} from "react";
import { TextStyle } from "react-native";

type IFonts = {
  /**
   * These are fonts that are loaded.  They are keyed using a colon separated composite key containing the family, weight and style of the font.
   */
  loadedFonts: Record<string, string>;
  /**
   * Number of fonts that are loaded.
   */
  loaded: number;
  /**
   * Total number of fonts to load.
   */
  total: number;
  replaceWithNativeFont(
    key: TextStyle
  ): TextStyle;
};
const FontsContext = createContext<IFonts>({
  loadedFonts: {},
  loaded: 0,
  total: 0,
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

async function loadFontModuleAsync(fontModule: any): Promise<Record<string, string>> {
  const fontsLoaded: Record<string, string> = {}
  for (const fontName in fontModule) {
    if (
      typeof fontModule[fontName] === "function" ||
      typeof fontModule[fontName] === "object"
    ) {
      continue;
    }
    const [fontFamily, fontWeight, fontStyle] = splitName(fontName);
    await Font.loadAsync({ [fontName]: fontModule[fontName] });
    fontsLoaded[`${fontFamily}:${fontWeight}:${fontStyle}`] = fontName
    if (fontWeight === "400") {
      fontsLoaded[`${fontFamily}:normal:${fontStyle}`] = fontName
    } else if (fontWeight === "700") {
      fontsLoaded[`${fontFamily}:bold:${fontStyle}`] = fontName
    }
  }
  return fontsLoaded;

}

export function FontsProvider({
  fontModules,
  children
}: FontsProviderProps): ReactElement {

  const [loadedFonts, setLoadedFonts] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState(0);
  const total = useMemo(() => fontModules.length, [fontModules]);
  const isMounted = useMounted();

  function replaceWithNativeFont({ fontFamily, fontWeight = "normal", fontStyle = "normal", ...rest }: TextStyle): TextStyle {
    const fontFamilyForKey = loadedFonts[`${fontFamily}:${fontWeight}:${fontStyle}`];
    if (fontFamilyForKey) {
      return { fontFamily: fontFamilyForKey, ...rest };
      // } else if (fontWeight === "bold" && fontStyle === "italic" && loadedFonts[`${fontFamily}:normal:italic`]) {
      //   // Allow for faux-italic fonts
      //   return { fontFamily: loadedFonts[`${fontFamily}:normal:normal`], fontWeight: "bold", fontStyle: "italic", ...rest };

    } else if (fontWeight === "bold" && loadedFonts[`${fontFamily}:normal:${fontStyle}`]) {
      // Allow for faux-bold fonts
      return { fontFamily: loadedFonts[`${fontFamily}:normal:${fontStyle}`], fontWeight: "bold", ...rest };

    } else if (fontStyle === "italic" && loadedFonts[`${fontFamily}:${fontWeight}:normal`]) {
      // Allow for faux-italic fonts
      return { fontFamily: loadedFonts[`${fontFamily}:${fontWeight}:normal`], fontStyle: "italic", ...rest };

    } else if (fontWeight === "bold" && fontStyle === "italic" && loadedFonts[`${fontFamily}:normal:normal`]) {
      // Allow for faux-bold fonts
      return { fontFamily: loadedFonts[`${fontFamily}:normal:${fontStyle}`], fontWeight: "bold", fontStyle: "italic", ...rest };


    } else {
      return { fontFamily, fontWeight, fontStyle, ...rest };
    }
  }

  useEffect(() => {
    async function loadFontsAsync() {
      let fontsLoadedInEffect: Record<string, string> = {}
      let fontsLoaded = 0;
      for (const fontModule of fontModules) {

        fontsLoadedInEffect = {
          ...fontsLoadedInEffect,
          ...(await loadFontModuleAsync(fontModule))
        };
        ++fontsLoaded;
        if (isMounted()) {
          setLoaded(fontsLoaded);
        } else {
          break;
        }
      }
      if (isMounted()) {
        setLoadedFonts(fontsLoadedInEffect);
      }
    }
    loadFontsAsync();

  }, [])


  return <FontsContext.Provider value={{ loadedFonts, loaded, total, replaceWithNativeFont: replaceWithNativeFont }}>{children}</FontsContext.Provider>
}
export function useFonts() {
  return useContext(FontsContext);
}
/**
 * Implementation note.  In React Native, the styling is not sustained unlike standard HTML to handle that there needs to be a context created for nested text elements to track what is the current style.  Will do that later.
 */
