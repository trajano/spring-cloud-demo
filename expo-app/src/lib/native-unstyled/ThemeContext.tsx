import {
  DefaultTheme,
  Theme as ReactNavigationTheme,
} from "@react-navigation/native";
import noop from "lodash/noop";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { ColorSchemeColors } from "./ColorSchemeColors";
import { useFonts } from "./Fonts";
import { ITheme } from "./ITheme";
import { ThemeProviderProps } from "./ThemeProviderProps";
import { defaultColorSchemeColors } from "./defaultColorSchemes";
import { defaultLightColorSchemeColors } from "./defaultColorSchemes/defaultLightColorSchemeColors";
import { useConfiguredColorSchemes } from "./useConfiguredColorScheme";
import { useConfiguredLocale } from "./useConfiguredLocale";

const ThemeContext = createContext<ITheme>({
  colorScheme: "light",
  colors: defaultLightColorSchemeColors,
  defaultTypography: {},
  reactNavigationTheme: DefaultTheme,
  locale: "en",
  setColorScheme: noop,
  setLocale: noop,
  replaceWithNativeFont: () => ({}),
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

  const [fontsLoaded, setFontsLoaded] = useState(false);

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
  const { replaceWithNativeFont } = useFonts(fontModules, () =>
    setFontsLoaded(true)
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
