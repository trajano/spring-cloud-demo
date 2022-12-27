import {
  DefaultTheme,
  Theme as ReactNavigationTheme
} from "@react-navigation/native";
import { useAsyncSetEffect } from "@trajano/react-hooks";
import { getLocales } from "expo-localization";
import {
  createContext,
  useCallback,
  useContext, useMemo, useState
} from "react";
import { useColorScheme } from "react-native";

import { defaultColorSchemes as defaultColorSchemeColors } from "./defaultColorSchemes";
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
  setColorScheme: () => { },
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
  const systemLocale = getLocales()[0].languageTag;
  const [colorScheme, setColorScheme] = useState(() => {
    if (typeof inColorScheme === "string") {
      return inColorScheme;
    } else {
      return systemColorScheme ?? defaultColorScheme
    }
  });
  const [locale, setLocale] = useState(() => {
    if (typeof inLocale === "string") {
      return inLocale;
    } else {
      return systemLocale ?? defaultLocale
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
      colorScheme,
      defaultTypography: { color: colors.default[0] },
      fontsLoaded,
      locale,
      reactNavigationTheme,
      setColorScheme,
      typography,
    }),
    [
      colors,
      colorScheme,
      locale,
      fontsLoaded,
      reactNavigationTheme,
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
