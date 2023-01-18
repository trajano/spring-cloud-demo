import { TEXT_TEST } from "@env";
import * as IBMPlexMono from "@expo-google-fonts/ibm-plex-mono";
import * as IBMPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as IslandMoments from "@expo-google-fonts/island-moments";
import * as Lexend from "@expo-google-fonts/lexend";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import { FontAwesome } from "@expo/vector-icons";
import { useAsyncStorage } from "@react-native-async-storage/async-storage";
import { AuthProvider } from "@trajano/spring-docker-auth-context";
import Constants from "expo-constants";
import "expo-dev-client";
import { deactivateKeepAwake, ExpoKeepAwakeTag } from "expo-keep-awake";
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { ColorSchemeName, LogBox, useWindowDimensions } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingScreen } from "../../screens/LoadingScreen";
import { AppProvider } from "../app-context";
import { AppLoading } from "../lib/app-loading";
import {
  ActivityIndicator,
  StatusBar,
  ThemeProvider,
  View,
} from "../lib/native-unstyled";
import { useStoredEndpointConfigurationEffect } from "./useStoredEndpointConfigurationEffect";

const TextTest = lazy(() => import("../../screens/TextTest"));
const Navigation = lazy(() => import("../../navigation"));

LogBox.ignoreLogs([/^Could not find Fiber with id/]);
function SuspenseView() {
  return (
    <View flex={1} justifyContent="center" alignItems="center">
      <ActivityIndicator size="large" />
    </View>
  );
}
export default function App() {
  const defaultEndpointConfiguration = useStoredEndpointConfigurationEffect();
  useEffect(() => {
    if (!__DEV__) {
      deactivateKeepAwake(ExpoKeepAwakeTag);
    }
  }, []);
  const storedLocale = useAsyncStorage("locale");
  const storedColorScheme = useAsyncStorage("colorScheme");
  const { width, height } = useWindowDimensions();
  const [initialLocale, setInitialLocale] = useState<string | null>(null);
  const [initialColorScheme, setInitialColorScheme] =
    useState<ColorSchemeName | null>(null);

  const setStoredColorScheme = useCallback(
    async (nextColorScheme: ColorSchemeName) => {
      if (nextColorScheme) {
        storedColorScheme.setItem(nextColorScheme);
      }
    },
    [storedColorScheme]
  );
  const setStoredLocale = useCallback(
    async (nextLocale: string | null) => {
      if (nextLocale) {
        storedLocale.setItem(nextLocale);
      }
    },
    [storedLocale]
  );

  useEffect(() => {
    (async () => {
      const nextInitialLocale = await storedLocale.getItem();
      const nextInitialColorScheme = await storedColorScheme.getItem();
      setInitialLocale(nextInitialLocale);
      setInitialColorScheme(nextInitialColorScheme as ColorSchemeName);
    })();
  }, [storedLocale, storedColorScheme]);
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width, height },
        insets: {
          top: Constants.statusBarHeight,
          left: 0,
          right: 0,
          bottom: 0,
        },
      }}
    >
      <AuthProvider defaultEndpointConfiguration={defaultEndpointConfiguration}>
        <ThemeProvider
          colorScheme={initialColorScheme}
          locale={initialLocale}
          defaultColorScheme="light"
          fontModules={[
            NotoSans,
            IBMPlexSans,
            NotoSansMono,
            Lexend,
            IBMPlexMono,
            IslandMoments,
            FontAwesome.font,
          ]}
          textRoles={{
            mono: { fontFamily: "IBMPlexMono" },
            "sans-serif": { fontFamily: "Lexend" },
          }}
          translations={{
            en: require("../i18n/en.json"),
            "en-US": require("../i18n/en-US.json"),
            "en-CA": require("../i18n/en-CA.json"),
            ja: require("../i18n/ja.json"),
          }}
          onColorSchemeChange={setStoredColorScheme}
          onLocaleChange={setStoredLocale}
        >
          {/* <HeaderTestNavigationContainer /> */}
          <AppLoading
            initialAssets={[
              // require("../../assets/lottie/28839-ikura-sushi.json"),
              require("../../assets/images/icon.png"),
            ]}
            LoadingComponent={LoadingScreen}
          >
            <Suspense fallback={<SuspenseView />}>
              {TEXT_TEST ? (
                <TextTest />
              ) : (
                <AppProvider>
                  <Navigation />
                </AppProvider>
              )}
            </Suspense>
            <StatusBar />
          </AppLoading>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
