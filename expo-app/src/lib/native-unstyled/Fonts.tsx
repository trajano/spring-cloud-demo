import { useMounted } from "@trajano/react-hooks";
import * as Font from "expo-font";
import {
  createContext,
  PropsWithChildren,
  ReactElement,
  useCallback,
  useContext,
  useEffect, useMemo, useState
} from "react";
import { StyleProp, TextStyle } from "react-native";

type FontTextStyle = Pick<TextStyle, "fontFamily" | "fontStyle" | "fontWeight">;
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
    flattenedStyle: StyleProp<TextStyle>
  ): StyleProp<TextStyle>;
};
const FontsContext = createContext<IFonts>({
  loadedFonts: {},
  loaded: 0,
  total: 0,
  replaceWithNativeFont: () => ({}),
});
type FontsProviderProps = PropsWithChildren<{
  fontModules: any[];
  onLoaded: () => void;
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
  onLoaded,
  children
}: FontsProviderProps): ReactElement {

  const [loadedFonts, setLoadedFonts] = useState<{ loaded: boolean, fonts: Record<string, string> }>({ loaded: false, fonts: {} });
  const [loaded, setLoaded] = useState(0);
  const total = useMemo(() => fontModules.length, [fontModules]);
  const fontFamilyNames = useMemo(
    () => new Set(fontModules.flatMap(fontModule => Object.entries(fontModule))
      .filter(en => typeof en[1] === "number")
      .map(en => en[0])
      .map(fontName => splitName(fontName))
      .map(split => split[0])
      .filter(n => !!n)
      .reduce<string[]>((s, fontFamily) => [...s, fontFamily!], [])),
    [fontModules]);
  const isMounted = useMounted();

  const replaceWithNativeFont = useCallback(({ fontFamily, fontWeight = "normal", fontStyle = "normal", ...rest }: TextStyle = {}): TextStyle => {
    if (!fontFamily && !fontWeight && !fontStyle) {
      return rest;
    }
    const fontFamilyForKey = loadedFonts.fonts[`${fontFamily}:${fontWeight}:${fontStyle}`];
    if (fontFamilyForKey) {
      return { fontFamily: fontFamilyForKey, ...rest };
      // } else if (fontWeight === "bold" && fontStyle === "italic" && loadedFonts[`${fontFamily}:normal:italic`]) {
      //   // Allow for faux-italic fonts
      //   return { fontFamily: loadedFonts[`${fontFamily}:normal:normal`], fontWeight: "bold", fontStyle: "italic", ...rest };

    } else if (fontWeight === "bold" && loadedFonts.fonts[`${fontFamily}:normal:${fontStyle}`]) {
      // Allow for faux-bold fonts
      return { fontFamily: loadedFonts.fonts[`${fontFamily}:normal:${fontStyle}`], fontWeight: "bold", ...rest };

    } else if (fontStyle === "italic" && loadedFonts.fonts[`${fontFamily}:${fontWeight}:normal`]) {
      // Allow for faux-italic fonts
      return { fontFamily: loadedFonts.fonts[`${fontFamily}:${fontWeight}:normal`], fontStyle: "italic", ...rest };

    } else if (fontWeight === "bold" && fontStyle === "italic" && loadedFonts.fonts[`${fontFamily}:normal:normal`]) {
      // Allow for faux-bold fonts
      return { fontFamily: loadedFonts.fonts[`${fontFamily}:normal:${fontStyle}`], fontWeight: "bold", fontStyle: "italic", ...rest };
    } else if (fontFamily && !Font.isLoaded(fontFamily)) {
      return { fontWeight, fontStyle, ...rest };
    } else {
      return { fontFamily, fontWeight, fontStyle, ...rest };
    }
  }, [fontFamilyNames, loadedFonts]);

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
        setLoadedFonts({ loaded: true, fonts: fontsLoadedInEffect });
        onLoaded();
      }
    }
    loadFontsAsync();

  }, [])


  return <FontsContext.Provider value={{ loadedFonts: loadedFonts.fonts, loaded, total, replaceWithNativeFont }}>{children}</FontsContext.Provider>
}
export function useFonts() {
  return useContext(FontsContext);
}
/**
 * Implementation note.  In React Native, the styling is not sustained unlike standard HTML to handle that there needs to be a context created for nested text elements to track what is the current style.  Will do that later.
 */
