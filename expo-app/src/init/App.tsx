import { BASE_URL, TEXT_TEST } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, buildSimpleEndpointConfiguration } from '@trajano/spring-docker-auth-context';
import 'expo-dev-client';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../lib/native-unstyled/ThemeContext';

import * as IBMPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as IslandMoments from "@expo-google-fonts/island-moments";
import * as Lexend from "@expo-google-fonts/lexend";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import { lazy, Suspense, useEffect, useState } from 'react';
import { LoadingScreen } from '../../screens/LoadingScreen';
import { AuthenticatedEndpointConfiguration } from '../../navigation/login/types';
import { LogBox } from 'react-native';
import { View, ActivityIndicator } from '../lib/native-unstyled';

const TextTest = lazy(() => import('../../screens/TextTest'));
const Navigation = lazy(() => import('../../navigation'))

LogBox.ignoreLogs([/^Could not find Fiber with id/]);
function SuspenseView() { return <View flex={1} justifyContent="center" alignItems='center'><ActivityIndicator size='large' /></View> }
export default function App() {
  const [defaultEndpointConfiguration, setDefaultEndpointConfiguration] = useState<AuthenticatedEndpointConfiguration>(buildSimpleEndpointConfiguration(BASE_URL));

  useEffect(() => {
    (async function () {
      let configuration = await AsyncStorage.getItem("ENDPOINT_CONFIGURATION");
      if (configuration) {
        setDefaultEndpointConfiguration(JSON.parse(configuration));
      }
    })();
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider defaultEndpointConfiguration={defaultEndpointConfiguration}>
        <ThemeProvider
          defaultColorScheme='light'
          fontModules={[NotoSans, IBMPlexSans, NotoSansMono, Lexend, IslandMoments]}
          textRoles={{
            mono: { fontFamily: "NotoSansMono" },
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
              (<Navigation />)}
            <StatusBar />
          </Suspense>
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
