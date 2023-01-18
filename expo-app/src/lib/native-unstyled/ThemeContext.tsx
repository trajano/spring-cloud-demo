import {
  DefaultTheme,
  Theme as ReactNavigationTheme,
} from "@react-navigation/native";
import noop from "lodash/noop";
import { createContext, useCallback, useContext, useMemo } from "react";

import { ColorSchemeColors } from "./ColorSchemeColors";
import { ITheme } from "./ITheme";
import { ThemeProviderProps } from "./ThemeProviderProps";
import { defaultColorSchemeColors } from "./defaultColorSchemes";
import { defaultLightColorSchemeColors } from "./defaultColorSchemes/defaultLightColorSchemeColors";
import { useReplaceWithNativeFontCallback } from "./replaceStyleWithNativeFont";
import { useConfiguredColorSchemes } from "./useConfiguredColorScheme";
import { useConfiguredLocale } from "./useConfiguredLocale";
import { useExpoFonts } from "./useExpoFonts";

const ThemeContext = createContext<ITheme>({
  colorScheme: "light",
  colors: defaultLightColorSchemeColors,
  defaultTypography: {},
  reactNavigationTheme: DefaultTheme,
  locale: "en",
  setColorScheme: noop,
  setLocale: noop,
  replaceWithNativeFont: (inStyle) => inStyle,
  typography: () => ({}),
  t: () => "",
  fontsLoaded: false,
});

export function ThemeProvider({
  children,
  defaultColorScheme = "light",
  defaultLocale = "en",
  colorScheme: inColorScheme,
  locale: inLocale,
  fontModules = [],
  textRoles = {},
  translations = {},
  i18nOptions,
  colorSchemeColors = defaultColorSchemeColors,
  onColorSchemeChange = noop,
  onLocaleChange = noop,
}: ThemeProviderProps) {
  const [colorScheme, setColorScheme] = useConfiguredColorSchemes(
    inColorScheme,
    defaultColorScheme,
    onColorSchemeChange
  );
  const [locale, setLocale, t] = useConfiguredLocale(
    inLocale,
    defaultLocale,
    translations,
    onLocaleChange,
    i18nOptions
  );

  const colors = useMemo(
    () => colorSchemeColors[colorScheme],
    [colorSchemeColors, colorScheme]
  );
  const reactNavigationTheme: ReactNavigationTheme = useMemo(
    () => ({
      dark: colorScheme === "dark",
      colors: {
        primary: colors.navigation.primary,
        border: colors.navigation.border,
        card: colors.navigation.card,
        notification: colors.navigation.notification,
        text: colors.default[0],
        background: colors.default[1],
      },
    }),
    [colors, colorScheme]
  );
  const typography = useCallback(
    (role?: string, size?: string) => {
      if (!role) {
        return {};
      } else if (`${role}.${size}` in textRoles) {
        return textRoles[`${role}.${size}`];
      } else if (role in textRoles) {
        return textRoles[role];
      } else {
        return {};
      }
    },
    [textRoles]
  );

  const [fontsLoaded, loadedFonts] = useExpoFonts(fontModules);
  const replaceWithNativeFont = useReplaceWithNativeFontCallback(
    fontsLoaded,
    loadedFonts
  );
  const contextValue = useMemo<ITheme>(
    () => ({
      colors,
      colorScheme,
      defaultTypography: { color: colors.default[0] },
      fontsLoaded,
      locale,
      reactNavigationTheme,
      replaceWithNativeFont,
      setColorScheme,
      setLocale,
      t,
      typography,
    }),
    [
      colors,
      colorScheme,
      locale,
      fontsLoaded,
      reactNavigationTheme,
      replaceWithNativeFont,
      setColorScheme,
      setLocale,
      t,
      typography,
    ]
  );
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
export function useTheming(): ITheme {
  return useContext(ThemeContext);
}
export function useColors(): ColorSchemeColors {
  return useContext(ThemeContext).colors;
}
