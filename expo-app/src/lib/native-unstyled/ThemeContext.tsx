import { DefaultTheme, Theme as ReactNavigationTheme } from "@react-navigation/native";
import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import { Asset } from "expo-asset";
import * as SplashScreen from 'expo-splash-screen';
import { ComponentType, createContext, ReactElement, useContext, useEffect, useMemo, useState } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";
import { defaultColorSchemes } from "./defaultColorSchemes";
import { defaultLightColorSchemeColors } from './defaultLightColorSchemeColors';
import { FontsProvider, useFonts } from "./Fonts";
import { LoadingComponentProps } from "./LoadingComponentProps";
import { ColorSchemeColors, ColorSchemes } from "./Themes";

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
export type ThemeProviderProps = {
    colorSchemes?: ColorSchemes,
    defaultColorScheme: NonNullable<ColorSchemeName>,
    /**
     * expo-font module assets to load up.
     */
    fontModules?: any[],
    /**
     * Component to show while the theme and all its resources are being loaded.
     * If not specified, then it shows the children immediately.
     * 
     * This component must style itself to take the whole screen, no styles will be 
     * passed into this component.
     * 
     * Because it is the loading screen, it must only contain the assets already.
     */
    LoadingComponent?: ComponentType<LoadingComponentProps>;
    /**
     * Assets to initially load.  These have to load before the splash screen is hidden.
     * These are expected to be local resources as such only `number` is allowed.
     */
    initialAssets?: number | number[]
    /**
     * Additional assets to load after the splash screen his hidden and LoadingComponent is 
     * being shown.  The fonts are appended to this list.
     */
    additionalAssets?: (number | string)[];
    /**
     * Provides an alternate method to get the color scheme.  This allows stored preference
     * for the app to override the system provided one.
     */
    getColorScheme?: () => Promise<NonNullable<ColorSchemeName>>;
    children: ReactElement<any, any>;
};

function LoadingOrChildren({ children, colorScheme, initialAssetsLoaded, additionalAssets, LoadingComponent }: {
    colorScheme: NonNullable<ColorSchemeName>,
    LoadingComponent?: ComponentType<LoadingComponentProps>,
    initialAssetsLoaded: boolean,
    additionalAssets: (string | number)[],
    children: ReactElement<any, any>
}): ReactElement<any, any> | null {
    const { loaded: loadedFonts, total: totalFonts } = useFonts();
    const isMounted = useMounted();
    const [additionalAssetsLoaded, setAdditionalAssetsLoaded] = useState(0);
    const loadedAssets = useMemo(() => loadedFonts + additionalAssets.length, [loadedFonts, additionalAssetsLoaded]);
    const totalAssets = useMemo(() => totalFonts + additionalAssets.length, [totalFonts, additionalAssets.length]);

    useEffect(() => {
        async function loadAdditionalAssetsAsync() {
            let assetsLoaded = 0;
            for (const moduleId in additionalAssets) {
                await Asset.loadAsync(moduleId);
                ++assetsLoaded;
                if (isMounted()) {
                    setAdditionalAssetsLoaded(assetsLoaded);
                } else {
                    break;
                }
            }
        }
        loadAdditionalAssetsAsync();
    }, [additionalAssets])

    if (!initialAssetsLoaded) {
        return null;
    }
    // Loading component is not defined
    if (!LoadingComponent && loadedAssets !== totalAssets) {
        return null;
    }
    // assets are still being loaded
    if (LoadingComponent && loadedAssets !== totalAssets) {
        return <LoadingComponent colorScheme={colorScheme} loadedAssets={loadedAssets} totalAssets={totalAssets} />;
    } else {
        return children;
    }
}

export function ThemeProvider({ children,
    defaultColorScheme = "light",
    fontModules = [],
    initialAssets = [],
    additionalAssets = [],
    LoadingComponent,
    colorSchemes = defaultColorSchemes, getColorScheme }: ThemeProviderProps) {
    const systemColorScheme = useColorScheme();
    const [colorScheme, setColorScheme] = useState(systemColorScheme ?? defaultColorScheme);
    const [initialAssetsLoaded, setInitialAssetsLoaded] = useState(false);
    useAsyncSetEffect(
        async function loadInitialAssets() {
            let nextColorScheme = colorScheme;
            try {
                SplashScreen.preventAutoHideAsync();
                await Asset.loadAsync(initialAssets);
                if (getColorScheme) {
                    nextColorScheme = await getColorScheme();
                }
            } catch (e) {
                // We might want to provide this error information to an error reporting service
                console.warn(e);
            } finally {
                SplashScreen.hideAsync();
            }
            return { nextInitialAssetsLoaded: true, nextColorScheme };
        },
        ({ nextInitialAssetsLoaded, nextColorScheme }) => {
            setInitialAssetsLoaded(nextInitialAssetsLoaded);
            setColorScheme(nextColorScheme);
        },
        []);
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
            <LoadingOrChildren
                colorScheme={colorScheme}
                LoadingComponent={LoadingComponent}
                initialAssetsLoaded={initialAssetsLoaded}
                additionalAssets={additionalAssets}
            >
                {children}
            </LoadingOrChildren>
        </FontsProvider>
    </ThemeContext.Provider>
}
export function useTheming(): ITheme {
    return useContext(ThemeContext);
}
export function useColors(): ColorSchemeColors {
    return useContext(ThemeContext).colors;
}