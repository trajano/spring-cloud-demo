import {
  DefaultTheme,
  Theme as ReactNavigationTheme
} from "@react-navigation/native";
import { useAsyncSetEffect } from "@trajano/react-hooks";
import { getLocales } from "expo-localization";
import noop from 'lodash/noop';
import {
  createContext,
  useCallback,
  useContext, useMemo, useState
} from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

import { defaultColorSchemeColors } from "./defaultColorSchemes";
import { defaultLightColorSchemeColors } from "./defaultLightColorSchemeColors";
import { FontsProvider } from "./Fonts";
import { I18nProvider } from "./I18n";
import { ITheme } from "./ITheme";
import { ThemeProviderProps } from "./ThemeProviderProps";
import { ColorSchemeColors } from "./Themes";

const ThemeContext = createContext<ITheme>({
  colorScheme: "light",
  colors: defaultLightColorSchemeColors,
  defaultTypography: {},
  reactNavigationTheme: DefaultTheme,
  setColorScheme: noop,
  setLocale: noop,
  typography: () => ({}),
  fontsLoaded: false,
});
export function ThemeProvider({
  children,
  defaultColorScheme = "light",
  defaultLocale = "en-US",
  colorScheme: inColorScheme,
  locale: inLocale,
  fontModules = [],
  textRoles = {},
  translations = {},
  colorSchemeColors = defaultColorSchemeColors,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const systemLocale = useMemo(() => {
    const locales = getLocales();
    if (typeof locales === "object" && Array.isArray(locales)) {
      return getLocales()
        .map(p => p.languageTag)
        .find(p => p in translations);
    } else {
      return null;
    }
  },
    [translations]);
  const [colorScheme, setColorScheme] = useState<ColorSchemeName | null>(() => {
    if (typeof inColorScheme === "string") {
      return inColorScheme;
    } else {
      return null
    }
  });
  const [locale, setLocale] = useState<string | null>(() => {
    if (typeof inLocale === "string") {
      return inLocale;
    } else {
      return null
    }
  });

  const [fontsLoaded, setFontsLoaded] = useState(false);

  useAsyncSetEffect(
    async () => {
      if (typeof inColorScheme === "function") {
        return await inColorScheme();
      } else {
        return colorScheme
      }
    },
    setColorScheme,
    [setColorScheme, inColorScheme]
  );
  useAsyncSetEffect(
    async () => {
      if (typeof inLocale === "function") {
        return await inLocale();
      } else {
        return locale
      }
    },
    setLocale,
    [setLocale, inLocale]
  );
  const colors = useMemo(
    () => colorSchemeColors[colorScheme ? colorScheme : (systemColorScheme ?? defaultColorScheme)],
    [colorSchemeColors, defaultColorScheme, colorScheme, systemColorScheme]
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
      } else if (textRoles[`${role}.${size}`]) {
        return textRoles[`${role}.${size}`];
      } else if (textRoles[role]) {
        return textRoles[role];
      } else {
        return {};
      }
    },
    [textRoles, fontModules]
  );
  const contextValue = useMemo<ITheme>(
    () => ({
      colors,
      colorScheme: colorScheme ? colorScheme : (systemColorScheme ?? defaultColorScheme),
      defaultTypography: { color: colors.default[0] },
      fontsLoaded,
      locale: locale ? locale : (systemLocale ?? defaultLocale),
      reactNavigationTheme,
      setColorScheme,
      setLocale,
      typography,
    }),
    [
      colors,
      colorScheme,
      defaultColorScheme,
      defaultLocale,
      locale,
      fontsLoaded,
      reactNavigationTheme,
      systemColorScheme,
      systemLocale,
      setColorScheme,
      typography,
    ]
  );
  return (
    <ThemeContext.Provider value={contextValue}>
      <FontsProvider
        fontModules={fontModules}
        onLoaded={() => {
          setFontsLoaded(true);
        }}
      >
        <I18nProvider translations={translations}>
          {children}
        </I18nProvider>
      </FontsProvider>
    </ThemeContext.Provider>
  );
}
export function useTheming(): ITheme {
  return useContext(ThemeContext);
}
export function useColors(): ColorSchemeColors {
  return useContext(ThemeContext).colors;
}
