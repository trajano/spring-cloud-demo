import { BASE_URL } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@trajano/spring-docker-auth-context';
import { format, hoursToMilliseconds, Locale } from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { Menu, Provider } from 'react-native-paper';
import { TextInput } from '../../components/Themed';
import { ScrollView, Text, View } from '../../src/components';
import type { LoginStackScreenProps } from './types';

export function LoginForm() {
  const { login, isConnected, baseUrl, setBaseUrl } = useAuth();
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const disabled = useMemo(() => !isConnected || username === "" || isLoggingIn, [isConnected, username, isLoggingIn]);

  function openMenu() { setVisible(true); }

  function closeMenu() { setVisible(false); }

  async function handleLogin() {
    try {
      setIsLoggingIn(true);
      return login({
        "username": username,
        "authenticated": true,
        "accessTokenExpiresInMillis": 120000,
        // thirty day expiration of refresh token
        "refreshTokenExpiresInMillis": hoursToMilliseconds(24 * 30)
      })
    } finally {
      setIsLoggingIn(false);
    }
  }

  async function setAndSaveBaseUrlAsync(baseUrl: string) {
    await AsyncStorage.setItem("BASE_URL", baseUrl);
    setBaseUrl(baseUrl);
  }

  return (
    <View>
      <Text style={styles.title} _t="asdf">Login Screen</Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={<Button onPress={openMenu} title={baseUrl.toString()} />}
      >
        <Menu.Item onPress={() => setAndSaveBaseUrlAsync(BASE_URL)} title={BASE_URL} />
        <Menu.Item onPress={() => setAndSaveBaseUrlAsync("http://localhost:28082")} title="localhost" />
        <Menu.Item onPress={() => setAndSaveBaseUrlAsync("http://192.168.0.19:28082")} title="192.168.0.19" />
      </Menu>
      <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} style={{ width: 300 }} />
      <Button title={`Login as ${username}`} onPress={handleLogin} disabled={disabled} />
    </View>
  );
}

export default function LoginScreen({ navigation }: LoginStackScreenProps<'Login'>) {

  // given Localization.locales
  // translate to DateFnsLocales
  const locale: Locale = useMemo(() => {

    const dateFnsLocales2 = dateFnsLocales as Record<string, Locale>;
    return Localization.getLocales().map(locale => {
      // handle special cases
      return locale.languageTag.replaceAll("-", "")
    })
      .filter(localeKey => !!dateFnsLocales2[localeKey])
      .map(localeKey => dateFnsLocales2[localeKey])[0] ?? dateFnsLocales.enUS;


  }, [])

  const auth = useAuth();
  const [now, setNow] = useState(format(Date.now(), "PPPPpppp", { locale }))
  useEffect(() => {

    const c = setInterval(() => setNow(format(Date.now(), "PPPPpppp", { locale })), 1000);
    return () => clearInterval(c);

  }, [locale])
  return (
    <Provider>
      <View style={{ flex: 1 }}>
        <LoginForm />
        <ScrollView>
          <Text>{JSON.stringify({ isConnected: auth.isConnected, now })}</Text>
          <Text>{JSON.stringify(auth.lastAuthEvents, null, 2)}</Text>
        </ScrollView>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
