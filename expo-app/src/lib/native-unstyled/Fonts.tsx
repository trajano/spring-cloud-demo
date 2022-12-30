import { useMounted } from "@trajano/react-hooks";
import * as Font from "expo-font";
import noop from "lodash/noop";
import omit from "lodash/omit";
import { useCallback, useEffect, useMemo, useState } from "react";
import { StyleProp, TextStyle } from "react-native";

import { replaceStyleWithNativeFont } from "./replaceStyleWithNativeFont";

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
  /**
   * Replace the data with a native font.  May return undefined if it will yield an empty object.
   * @param flattenedStyle
   */
  replaceWithNativeFont(
    flattenedStyle: StyleProp<TextStyle>,
    defaultTextStyle?: Pick<TextStyle, "color">
  ): StyleProp<TextStyle> | undefined;
};
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

async function loadFontModuleAsync(
  fontModule: any
): Promise<Record<string, string>> {
  const fontsLoaded: Record<string, string> = {};
  for (const fontName in fontModule) {
    if (
      typeof fontModule[fontName] === "function" ||
      typeof fontModule[fontName] === "object"
    ) {
      continue;
    }
    const [fontFamily, fontWeight, fontStyle] = splitName(fontName);
    await Font.loadAsync({ [fontName]: fontModule[fontName] });
    fontsLoaded[`${fontFamily}:${fontWeight}:${fontStyle}`] = fontName;
    if (fontWeight === "400") {
      fontsLoaded[`${fontFamily}:normal:${fontStyle}`] = fontName;
    } else if (fontWeight === "700") {
      fontsLoaded[`${fontFamily}:bold:${fontStyle}`] = fontName;
    }
  }
  return fontsLoaded;
}

export function useFonts(
  fontModules: any[] = [],
  onLoaded: () => void = noop
): IFonts {
  const [loadedFonts, setLoadedFonts] = useState<{
    loaded: boolean;
    fonts: Record<string, string>;
  }>({ loaded: false, fonts: {} });
  const [loaded, setLoaded] = useState(0);
  const total = useMemo(() => fontModules.length, [fontModules]);
  const fontFamilyNames = useMemo(
    () =>
      new Set(
        fontModules
          .flatMap((fontModule) => Object.entries(fontModule))
          .filter((en) => typeof en[1] === "number")
          .map((en) => en[0])
          .map((fontName) => splitName(fontName))
          .map((split) => split[0])
          .filter((n) => !!n)
          .reduce<string[]>((s, fontFamily) => [...s, fontFamily!], [])
      ),
    [fontModules]
  );
  const isMounted = useMounted();

  const replaceWithNativeFont = useCallback(
    function replaceWithNativeFont(
      style: TextStyle = {},
      defaultTextStyle: TextStyle = {}
    ): TextStyle | undefined {
      if (loadedFonts.loaded) {
        return replaceStyleWithNativeFont(
          style,
          loadedFonts.fonts,
          defaultTextStyle
        );
      } else {
        // If the fonts are not loaded then the family has to be excluded.
        return omit({ ...defaultTextStyle, ...style }, "fontFamily");
      }
    },
    [fontFamilyNames, loadedFonts]
  );

  useEffect(() => {
    async function loadFontsAsync() {
      let fontsLoadedInEffect: Record<string, string> = {};
      let fontsLoaded = 0;
      for (const fontModule of fontModules) {
        fontsLoadedInEffect = {
          ...fontsLoadedInEffect,
          ...(await loadFontModuleAsync(fontModule)),
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
  }, []);

  const contextValue = useMemo<IFonts>(
    () => ({
      loadedFonts: loadedFonts.fonts,
      loaded,
      total,
      replaceWithNativeFont,
    }),
    [loadedFonts.fonts, loaded, total]
  );

  return contextValue;
}
/**
 * Implementation note.  In React Native, the styling is not sustained unlike standard HTML to handle that there needs to be a context created for nested text elements to track what is the current style.  Will do that later.
 */
