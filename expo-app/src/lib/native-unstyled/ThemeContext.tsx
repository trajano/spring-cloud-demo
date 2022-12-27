import { FontAwesome } from "@expo/vector-icons";
import {
  DefaultTheme,
  Theme as ReactNavigationTheme,
} from "@react-navigation/native";
import { useAsyncSetEffect, useMounted } from "@trajano/react-hooks";
import { Asset } from "expo-asset";
import * as Font from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { Dict } from "i18n-js";
import {
  ComponentType,
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

import { FontsProvider, useFonts } from "./Fonts";
import { I18nProvider } from "./I18n";
import { ITheme } from "./ITheme";
import { LoadingComponentProps } from "./LoadingComponentProps";
import { ColorSchemeColors, ColorSchemes } from "./Themes";
import { Typography } from "./Typography";
import { defaultColorSchemes as defaultColorSchemeColors } from "./defaultColorSchemes";
import { defaultLightColorSchemeColors } from "./defaultLightColorSchemeColors";

const ThemeContext = createContext<ITheme>({
  colorScheme: "light",
  colors: defaultLightColorSchemeColors,
  defaultTypography: {},
  reactNavigationTheme: DefaultTheme,
  setColorScheme: () => {},
  typography: () => ({}),
});
type Loader = () => Promise<void>;
export type ThemeProviderProps = {
  colorSchemeColors?: ColorSchemes;
  /**
   * Color scheme to use.  If not present it will use the system if not available it will use the default.
   */
  colorScheme?: NonNullable<ColorSchemeName>;
  /**
   * Color scheme to use as a fallback in case it couldn't be determined from the system.
   */
  defaultColorScheme: NonNullable<ColorSchemeName>;
  /**
   * expo-font module assets to load up.
   */
  fontModules?: any[];
  /**
   * A list of roles for the text to provide repetitive text styles.
   */
  textRoles?: Record<string, Typography>;
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
  initialAssets?: number | number[];
  /**
   * Additional assets to load after the splash screen his hidden and LoadingComponent is
   * being shown.  The fonts are appended to the number.  Each of this is a callback
   * function to load an asset or some other object.  This can be used to poll for a stable
   * state.
   */
  additionalAssets?: Loader[];
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
  minimumShowLoadingTime?: number;
  translations?: Dict;
};

type LoadedTotal = {
  loaded: number;
  total: number;
};
function LoadingOrChildren({
  children,
  colorScheme,
  initialAssetsLoaded,
  fontsLoaded,
  additionalAssets,
  minimumShowLoadingTime,
  LoadingComponent,
}: {
  colorScheme: NonNullable<ColorSchemeName>;
  LoadingComponent?: ComponentType<LoadingComponentProps>;
  initialAssetsLoaded: boolean;
  fontsLoaded: boolean;
  additionalAssets: Loader[];
  minimumShowLoadingTime: number;
  children: ReactNode;
}): JSX.Element | null {
  const { loaded: loadedFonts, total: totalFonts } = useFonts();
  const isMounted = useMounted();
  const [additionalAssetsLoaded, setAdditionalAssetsLoaded] = useState(0);
  const [fromComponent, setFromComponent] = useState<LoadedTotal>({
    loaded: 0,
    total: 0,
  });

  const totalAssets = useMemo(
    () => additionalAssets.length + 1 + totalFonts + fromComponent.total,
    [totalFonts, additionalAssets.length, fromComponent.total]
  );

  const loadedAssets = useMemo(
    () =>
      loadedFonts +
      additionalAssets.length +
      (fontsLoaded ? 1 : 0) +
      fromComponent.loaded,
    [fontsLoaded, loadedFonts, additionalAssetsLoaded, fromComponent.loaded]
  );

  const [minimumTimeSpent, setMinimumTimeSpent] = useState(
    minimumShowLoadingTime === 0
  );
  const minimumShowLoadingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    async function loadAdditionalAssetsAsync() {
      let assetsLoaded = 0;
      for (const additionalLoadedAsset of additionalAssets) {
        await additionalLoadedAsset();
        ++assetsLoaded;
        if (isMounted()) {
          setAdditionalAssetsLoaded(assetsLoaded);
        } else {
          break;
        }
      }
    }
    loadAdditionalAssetsAsync();
  }, [additionalAssets]);
  useEffect(() => {
    if (minimumShowLoadingTimeoutRef.current !== undefined) {
      clearTimeout(minimumShowLoadingTimeoutRef.current);
    }
    minimumShowLoadingTimeoutRef.current = setTimeout(() => {
      if (isMounted()) {
        setMinimumTimeSpent(true);
      }
    }, minimumShowLoadingTime);
    return () => {
      clearTimeout(minimumShowLoadingTimeoutRef.current);
      minimumShowLoadingTimeoutRef.current = undefined;
    };
  }, [minimumShowLoadingTime]);

  if (!initialAssetsLoaded) {
    return null;
  }
  const loadingComponentMustBeShown =
    loadedAssets !== totalAssets || !minimumTimeSpent;
  // Loading component is not defined
  if (!LoadingComponent && loadingComponentMustBeShown) {
    return null;
  }

  function additionalResourceUpdate(loaded: number, total: number) {
    setFromComponent({
      loaded,
      total,
    });
  }

  // assets are still being loaded
  if (LoadingComponent && loadingComponentMustBeShown) {
    return (
      <LoadingComponent
        colorScheme={colorScheme}
        loadedAssets={loadedAssets}
        totalAssets={totalAssets}
        additionalResourceUpdate={additionalResourceUpdate}
      />
    );
  } else {
    return children as JSX.Element;
  }
}

export function ThemeProvider({
  children,
  defaultColorScheme = "light",
  colorScheme: inColorScheme,
  fontModules = [],
  initialAssets = [],
  additionalAssets = [],
  textRoles = {},
  minimumShowLoadingTime = 0,
  translations = {},
  LoadingComponent,
  colorSchemeColors = defaultColorSchemeColors,
  getColorScheme,
}: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState(
    inColorScheme ?? systemColorScheme ?? defaultColorScheme
  );
  const [initialAssetsLoaded, setInitialAssetsLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useAsyncSetEffect(
    async function loadInitialAssets() {
      let nextColorScheme = colorScheme;
      try {
        SplashScreen.preventAutoHideAsync();
        const assetModules: any[] = Array.isArray(initialAssets)
          ? initialAssets
          : [initialAssets];
        const assetModuleIds: number[] = assetModules.filter(
          (assetModule) => typeof assetModule === "number"
        );
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
        SplashScreen.hideAsync().catch((e) =>
          console.error("hideAsync failed", e)
        );
      }
      return { nextInitialAssetsLoaded: true, nextColorScheme };
    },
    ({ nextInitialAssetsLoaded, nextColorScheme }) => {
      setInitialAssetsLoaded(nextInitialAssetsLoaded);
      setColorScheme(nextColorScheme);
    }
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
  const contextValue = useMemo(
    () => ({
      colorScheme,
      colors,
      reactNavigationTheme,
      setColorScheme,
      defaultTypography: { color: colors.default[0] },
      typography,
    }),
    [colorScheme, colors, reactNavigationTheme, setColorScheme, typography]
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
          {/* TODO move this outside of native-unstyled */}
          <LoadingOrChildren
            colorScheme={colorScheme}
            LoadingComponent={LoadingComponent}
            initialAssetsLoaded={initialAssetsLoaded}
            fontsLoaded={fontsLoaded}
            additionalAssets={additionalAssets}
            minimumShowLoadingTime={minimumShowLoadingTime}
          >
            {children}
          </LoadingOrChildren>
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
