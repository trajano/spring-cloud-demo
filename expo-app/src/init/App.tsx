import { TEXT_TEST } from "@env";
import * as IBMPlexMono from "@expo-google-fonts/ibm-plex-mono";
import * as IBMPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as IslandMoments from "@expo-google-fonts/island-moments";
import * as Lexend from "@expo-google-fonts/lexend";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import { FontAwesome } from "@expo/vector-icons";
import { AuthProvider } from "@trajano/spring-docker-auth-context";
import "expo-dev-client";
import { deactivateKeepAwake, ExpoKeepAwakeTag } from "expo-keep-awake";
import { lazy, Suspense, useEffect } from "react";
import { ColorSchemeName, LogBox } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { LoadingScreen } from "../../screens/LoadingScreen";
import { AppProvider } from "../app-context";
import { useStoredState } from "../hooks/useStoredState";
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
  const [storedLocale, setStoredLocale] = useStoredState<string>(
    "locale",
    null
  );
  const [storedColorScheme, setStoredColorScheme] = useStoredState<
    NonNullable<ColorSchemeName>
  >("colorScheme", null);

  return (
    <SafeAreaProvider>
      <AuthProvider defaultEndpointConfiguration={defaultEndpointConfiguration}>
        <ThemeProvider
          colorScheme={storedColorScheme}
          locale={storedLocale}
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
