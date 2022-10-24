import { BASE_URL } from '@env';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../../auth-context';
import './initialize';

import useCachedResources from '../../hooks/useCachedResources';
import useColorScheme from '../../hooks/useColorScheme';
import Navigation from '../../navigation';

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();
  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <AuthProvider baseUrl={BASE_URL}
        clientId='myClient'
        clientSecret='mySecret'>
        <SafeAreaProvider>
          <Navigation colorScheme={colorScheme} />
          <StatusBar />
        </SafeAreaProvider>
      </AuthProvider>
    );
  }
}
