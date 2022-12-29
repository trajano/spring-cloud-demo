import { ColorSchemes } from "../Themes";
import { defaultDarkColorSchemeColors } from "./defaultDarkColorSchemeColors";
import { defaultLightColorSchemeColors } from "./defaultLightColorSchemeColors";

/**
 * Default color schemes.  These are kept as minimal as possible as this was
 * meant to be extended.  There are no heavy defaults that include
 * [Apple system colors](https://developer.apple.com/design/human-interface-guidelines/foundations/color/#specifications)
 * nor [design tokens](https://docs.nativebase.io/design-tokens) that I found made
 * NativeBase too bloated once you start getting into customization.
 * The number of palette colors are also limitted to the ones provided by React Navigation.
 */
export const defaultColorSchemeColors: ColorSchemes = {
  dark: defaultDarkColorSchemeColors,
  light: defaultLightColorSchemeColors,
};
