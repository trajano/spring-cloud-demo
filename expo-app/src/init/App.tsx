import 'expo-dev-client';
import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, buildSimpleEndpointConfiguration } from '@trajano/spring-docker-auth-context';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from '../../navigation';
import { ThemeProvider } from '../lib/native-unstyled/ThemeContext';

import * as IBMPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as IslandMoments from "@expo-google-fonts/island-moments";
import * as Lexend from "@expo-google-fonts/lexend";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import { useEffect, useState } from 'react';
import { LoadingScreen } from '../../screens/LoadingScreen';

export default function App() {
  const [defaultEndpointConfiguration, setDefaultEndpointConfiguration] = useState(buildSimpleEndpointConfiguration(BASE_URL));
  useEffect(() => {
    (async function () {
      let configuration = await AsyncStorage.getItem("ENDPOINT_CONFIGURATION");
      if (configuration) {
        console.log(configuration)
        setDefaultEndpointConfiguration(JSON.parse(configuration));
      }
    })();
  }, []);
  return (
    <SafeAreaProvider>
      <AuthProvider defaultEndpointConfiguration={defaultEndpointConfiguration}>
        <ThemeProvider
          defaultColorScheme='light'
          defaultTypography={{
            fontFamily: "System",
            fontWeight: "normal",
            fontSize: 16
          }}
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
          <Navigation />
          <StatusBar />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
