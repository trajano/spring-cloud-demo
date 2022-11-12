import { BASE_URL } from '@env';
import { AuthProvider } from '@trajano/spring-docker-auth-context';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Navigation from '../../navigation';
import { ThemeProvider } from '../lib/native-unstyled/ThemeContext';

import * as IBMPlexSans from "@expo-google-fonts/ibm-plex-sans";
import * as IslandMoments from "@expo-google-fonts/island-moments";
import * as Lexend from "@expo-google-fonts/lexend";
import * as NotoSans from "@expo-google-fonts/noto-sans";
import * as NotoSansMono from "@expo-google-fonts/noto-sans-mono";
import { View } from '../components';

export default function App() {
  return (
    <ThemeProvider
      defaultColorScheme='light'
      fontModules={[NotoSans, IBMPlexSans, NotoSansMono, Lexend, IslandMoments]}
      LoadingComponent={View}
    >
      <AuthProvider baseUrl={BASE_URL}
        clientId='myClient'
        clientSecret='mySecret'>
        <SafeAreaProvider>
          <Navigation />
          <StatusBar />
        </SafeAreaProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
