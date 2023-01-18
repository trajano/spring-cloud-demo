import { FontSource, loadAsync } from "expo-font";
import { useEffect, useState } from "react";
import { TextStyle } from "react-native";

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

export function useExpoFonts(
  fontModules: Record<string, FontSource | Function>[]
): [boolean, Record<string, string>] {
  const [loaded, setLoaded] = useState(false);
  const [loadedFontFamilies, setLoadedFontFamilies] = useState<
    Record<string, string>
  >({});
  useEffect(() => {
    (async () => {
      if (loaded) {
        return;
      }
      const nextFontsLoaded: Record<string, string> = {};
      const collectedSources: Record<string, FontSource> = {};
      for (const fontModule of fontModules) {
        for (const fontName in fontModule) {
          if (
            typeof fontModule[fontName] === "function" ||
            typeof fontModule[fontName] === "object"
          ) {
            continue;
          }
          collectedSources[fontName] = fontModule[fontName] as FontSource;
          const [fontFamily, fontWeight, fontStyle] = splitName(fontName);
          nextFontsLoaded[`${fontFamily}:${fontWeight}:${fontStyle}`] =
            fontName;
          if (fontWeight === "400") {
            nextFontsLoaded[`${fontFamily}:normal:${fontStyle}`] = fontName;
          } else if (fontWeight === "700") {
            nextFontsLoaded[`${fontFamily}:bold:${fontStyle}`] = fontName;
          }
        }
      }
      await loadAsync(collectedSources);
      setLoadedFontFamilies(nextFontsLoaded);
      setLoaded(true);
    })();
  }, [loaded, fontModules]);
  return [loaded, loadedFontFamilies];
}
