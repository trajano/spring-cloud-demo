import { DefaultTheme, Theme as ReactNavigationTheme } from "@react-navigation/native";
import { useAsyncSetEffect } from "@trajano/react-hooks";
import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";
import { ColorSchemeColors, ColorSchemes } from "./Themes";
import { defaultLightColorSchemeColors } from './defaultLightColorSchemeColors'
import { defaultColorSchemes } from "./defaultColorSchemes";
import { FontsProvider } from "./Fonts";

/**
 * Theme will still include non-color stuff like fonts etc.  But only the color scheme is selectable.
 */
interface ITheme {
    colorScheme: NonNullable<ColorSchemeName>
    colors: ColorSchemeColors
    reactNavigationTheme: ReactNavigationTheme,
    setColorScheme: (colorScheme: NonNullable<ColorSchemeName>) => void,
}
const ThemeContext = createContext<ITheme>({
    colorScheme: "light",
    colors: defaultLightColorSchemeColors,
    reactNavigationTheme: DefaultTheme,
    setColorScheme: () => { }
})
export function ThemeProvider({ children, defaultColorScheme = "light",
    fontModules = [],
    colorSchemes = defaultColorSchemes, getColorScheme }: PropsWithChildren<{
        colorSchemes?: ColorSchemes, defaultColorScheme: NonNullable<ColorSchemeName>, fontModules?: any[], getColorScheme?: () => Promise<NonNullable<ColorSchemeName>>
    }>) {
    const systemColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useState(systemColorScheme ?? defaultColorScheme);
    useAsyncSetEffect(async () => {
        if (getColorScheme) {
            return getColorScheme();
        } else {
            return colorScheme;
        }
    }, (nextColorScheme) => setColorScheme(nextColorScheme));
    console.log({ systemColorScheme, colorScheme })
    const colors = useMemo(() => colorSchemes[colorScheme], [colorSchemes, colorScheme])
    const reactNavigationTheme: ReactNavigationTheme = useMemo(() => ({
        dark: colorScheme === "dark",
        colors: {
            primary: colors.navigation.primary,
            border: colors.navigation.border,
            card: colors.navigation.card,
            notification: colors.navigation.notification,
            text: colors.default[0],
            background: colors.default[1]
        }
    }), [colors, colorScheme]);
    return <ThemeContext.Provider value={{
        colorScheme,
        colors: colors,
        reactNavigationTheme,
        setColorScheme
    }}>
        <FontsProvider fontModules={fontModules}>
            {children}
        </FontsProvider>
    </ThemeContext.Provider>
}
export function useTheming(): ITheme {
    return useContext(ThemeContext);
}
export function useColors(): ColorSchemeColors {
    return useContext(ThemeContext).colors;
}