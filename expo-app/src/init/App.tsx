import { BASE_URL } from '@env';
import { AuthProvider } from '@trajano/spring-docker-auth-context';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import useCachedResources from '../../hooks/useCachedResources';
import useColorScheme from '../../hooks/useColorScheme';
import Navigation from '../../navigation';
import { ThemeProvider } from '../lib/native-unstyled/ThemeContext';

import * as IBMPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as IslandMoments from "@expo-google-fonts/island-moments";
import * as Lexend from "@expo-google-fonts/lexend";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <ThemeProvider defaultColorScheme='light' fontModules={[NotoSans, IBMPlexSans, NotoSansMono, Lexend, IslandMoments]}>
        <AuthProvider baseUrl={BASE_URL}
          clientId='myClient'
          clientSecret='mySecret'>
          <SafeAreaProvider>
            <Navigation colorScheme={colorScheme} />
            <StatusBar />
          </SafeAreaProvider>
        </AuthProvider>
      </ThemeProvider>
    );
  }
}
