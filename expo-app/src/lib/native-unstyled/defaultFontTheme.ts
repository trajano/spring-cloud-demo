import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as IbmPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import * as Font from "expo-font";
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
export function loadExpoGoogleFont(fontModule: any) {
  Font.loadAsync(fontModule);
  for (const fontName in fontModule) {
    if (
      typeof fontModule[fontName] === "function" ||
      typeof fontModule[fontName] === "object"
    ) {
      continue;
    }
    const [fontFamily, fontWeight, fontStyle] = splitName(fontName);
    // so what do we look up?
    const keys = [`${fontFamily}:${fontWeight}:${fontStyle}`];
    if (fontWeight === "400") {
      keys.push(`${fontFamily}:normal:${fontStyle}`);
    } else if (fontWeight === "700") {
      keys.push(`${fontFamily}:bold:${fontStyle}`);
    }
    
  }
}
loadExpoGoogleFont(NotoSans);
loadExpoGoogleFont(IbmPlexSans);
loadExpoGoogleFont(NotoSansMono);
/**
 * I chose Noto-sans because it satisfies most of what I want
 * * open tail `g`
 * * distinguishable capital I and lowercase l
 *
 * The flaws are:
 * * there's no way to distinguish lowercase l and the pipe | symbol.
 * * double-storey `a`
 *
 * It's good for the screen, but I still prefer a proper serif font for paper and e-ink
 */

/**
 * I chose IBM Plex Sans because it satisfies most of what I want
 * * distinguishable capital I and lowercase l
 * * Able to to distinguish lowercase l and the pipe | symbol.
 * * Large variety of weights
 *
 * It's main flaws for me are
 * * double-storey `a`
 * * loop-tail `g`
 *
 * It's good for the screen, but I still prefer a proper serif font for paper and e-ink
 */

/**
 * I chose Noto Sans Mono because I don't have access to Cascadia Cove.
 * * distinguishable capital I and lowercase l
 * * Able to to distinguish lowercase l and the pipe | symbol.
 * * open tail `g`
 *
 * It's main flaw for me are
 * * double-storey `a`
 *
 * And it's monospaced so it's function is a bit more limitted.
 */
