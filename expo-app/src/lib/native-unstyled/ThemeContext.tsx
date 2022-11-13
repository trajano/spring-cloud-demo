import { FontAwesome } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { DefaultTheme, Theme as ReactNavigationTheme } from "@react-navigation/native";
import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import { TextStyle } from 'react-native';
import { Asset } from "expo-asset";
import * as SplashScreen from 'expo-splash-screen';
import { ComponentType, createContext, ReactElement, ReactFragment, useContext, useEffect, useMemo, useState, ReactNode } from "react";
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
export type FontAlias = {
    fontFamily?: TextStyle['fontFamily'],
    fontWeight?: TextStyle['fontWeight'],
    fontSize?: TextStyle['fontSize'];
    fontStyle?: TextStyle['fontStyle']
}
export type ThemeProviderProps = {
    colorSchemes?: ColorSchemes,
    defaultColorScheme: NonNullable<ColorSchemeName>,
    /**
     * expo-font module assets to load up.
     */
    fontModules?: any[],
    /**
     * A list of aliases for the fonts to provide repetitive text styles.
     */
    fontAliases?: Record<string, FontAlias>,
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
     * Note that by default Expo treats `json` as code so do not load them as assets
     * even Lottie animation.
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
    children: ReactNode;
    /**
     * Minimum amount of time to show the loading screen, used to simulate a long
     * asset load time.
     */
    minimumShowLoadingTime: number;
};

function LoadingOrChildren({ children, colorScheme, initialAssetsLoaded, additionalAssets, minimumShowLoadingTime, LoadingComponent }: {
    colorScheme: NonNullable<ColorSchemeName>,
    LoadingComponent?: ComponentType<LoadingComponentProps>,
    initialAssetsLoaded: boolean,
    additionalAssets: (string | number)[],
    minimumShowLoadingTime: number,
    children: ReactNode
}): JSX.Element | null {
    const { loaded: loadedFonts, total: totalFonts } = useFonts();
    const isMounted = useMounted();
    const [additionalAssetsLoaded, setAdditionalAssetsLoaded] = useState(0);
    const loadedAssets = useMemo(() => loadedFonts + additionalAssets.length, [loadedFonts, additionalAssetsLoaded]);
    const totalAssets = useMemo(() => totalFonts + additionalAssets.length, [totalFonts, additionalAssets.length]);
    const [minimumTimeSpent, setMinimumTimeSpent] = useState(minimumShowLoadingTime === 0);

    useEffect(() => {
        async function loadAdditionalAssetsAsync() {
            let assetsLoaded = 0;
            for (const moduleId of additionalAssets) {
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
    useEffect(() => {
        const t = setTimeout(() => { if (isMounted()) { setMinimumTimeSpent(true) } }, minimumShowLoadingTime);
        return () => clearTimeout(t);
    }, [minimumShowLoadingTime])

    if (!initialAssetsLoaded) {
        return null;
    }
    const loadingComponentMustBeShown = loadedAssets !== totalAssets || !minimumTimeSpent;
    // Loading component is not defined
    if (!LoadingComponent && loadingComponentMustBeShown) {
        return null;
    }
    // assets are still being loaded
    if (LoadingComponent && loadingComponentMustBeShown) {
        return <LoadingComponent colorScheme={colorScheme} loadedAssets={loadedAssets} totalAssets={totalAssets} />;
    } else {
        return children as JSX.Element;
    }
}

export function ThemeProvider({ children,
    defaultColorScheme = "light",
    fontModules = [],
    initialAssets = [],
    additionalAssets = [],
    minimumShowLoadingTime = 0,
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
                const assetModules: any[] = Array.isArray(initialAssets) ? initialAssets : [initialAssets];
                const assetModuleIds: number[] = assetModules.filter((assetModule) => typeof assetModule === "number");
                await Font.loadAsync({
                    ...FontAwesome.font,
                });
                for (const moduleId of assetModuleIds) {
                    await Asset.loadAsync(moduleId);
                }
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
                minimumShowLoadingTime={minimumShowLoadingTime}
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