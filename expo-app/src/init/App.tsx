import { BASE_URL, TEXT_TEST } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, buildSimpleEndpointConfiguration } from '@trajano/spring-docker-auth-context';
import 'expo-dev-client';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../lib/native-unstyled/ThemeContext';

import * as IBMPlexMono from "@expo-google-fonts/ibm-plex-mono";
import * as IBMPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as IslandMoments from "@expo-google-fonts/island-moments";
import * as Lexend from "@expo-google-fonts/lexend";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import { lazy, Suspense, useEffect, useState } from 'react';
import { LogBox } from 'react-native';
import { AuthenticatedEndpointConfiguration } from '../../navigation/login/types';
import { LoadingScreen } from '../../screens/LoadingScreen';
import { ActivityIndicator, StatusBar, View } from '../lib/native-unstyled';
import { deactivateKeepAwake } from 'expo-keep-awake';
import { AppProvider } from '../app-context';
import { startNetworkLogging } from 'react-native-network-logger';
import Constants from 'expo-constants';

const TextTest = lazy(() => import('../../screens/TextTest'));
const Navigation = lazy(() => import('../../navigation'))

LogBox.ignoreLogs([/^Could not find Fiber with id/]);
function SuspenseView() { return <View flex={1} justifyContent="center" alignItems='center'><ActivityIndicator size='large' /></View> }
export default function App() {
  const [defaultEndpointConfiguration, setDefaultEndpointConfiguration] = useState<AuthenticatedEndpointConfiguration>(buildSimpleEndpointConfiguration(BASE_URL ?? "https://api.trajano.net/"));

  useEffect(() => {
    let ignoredHosts: string[] = [];
    if (__DEV__) {
      try {
        const launchHostUrlString = Constants.manifest2?.launchAsset?.url;
        if (launchHostUrlString) {
          const r =
            /^(([^:\/?#]+):)?(\/\/([^\/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(
              launchHostUrlString
            );
          if (r && r[4] && r[4].split(":")[0]) {
            ignoredHosts = [r[4].split(":")[0]];
          }
        }
      } catch (e: unknown) {
        console.log(e);
      }
    }
    startNetworkLogging({ ignoredHosts });

  }, [])
  useEffect(() => {
    (async function () {
      let configuration = await AsyncStorage.getItem("ENDPOINT_CONFIGURATION");
      if (configuration) {
        setDefaultEndpointConfiguration(JSON.parse(configuration));
      }
    })();
    deactivateKeepAwake();
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider defaultEndpointConfiguration={defaultEndpointConfiguration}>
        <ThemeProvider
          defaultColorScheme='light'
          fontModules={[NotoSans, IBMPlexSans, NotoSansMono, Lexend, IBMPlexMono, IslandMoments]}
          textRoles={{
            mono: { fontFamily: "IBMPlexMono" },
            "sans-serif": { fontFamily: "Lexend" }
          }}
          initialAssets={[
            require("../../assets/lottie/28839-ikura-sushi.json"),
            require("../../assets/images/icon.png")]}
          LoadingComponent={LoadingScreen}
        >
          <Suspense fallback={<SuspenseView />}>
            {TEXT_TEST ?
              (<TextTest />) :
              (<AppProvider><Navigation /></AppProvider>)}
          </Suspense>
          <StatusBar />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
