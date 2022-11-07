import { BASE_URL } from '@env';
import { format, Locale } from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { createRef, useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet, View as RNView } from 'react-native';
import { useAuth } from '@trajano/spring-docker-auth-context';
import { TextInput } from '../../components/Themed';
import { Text, View } from '../../src/components';
import type { LoginStackScreenProps } from './types';

export default function LoginScreen({ navigation }: LoginStackScreenProps<'Login'>) {

  // given Localization.locales
  // translate to DateFnsLocales
  const locale: Locale = useMemo(() => {

    const dateFnsLocales2 = dateFnsLocales as Record<string, Locale>;
    return Localization.locales.map(locale => {
      // handle special cases
      return locale.replaceAll("-", "")
    })
      .filter(localKey => !!dateFnsLocales2[localKey])
      .map(localKey => dateFnsLocales2[localKey])[0] ?? dateFnsLocales.enUS;


  }, [Localization.locales])

  const [username, setUsername] = useState("")
  const auth = useAuth();
  const [now, setNow] = useState(format(Date.now(), "PPPPpppp", { locale }))
  async function handleLogin() {
    return auth.login({
      "username": username,
      "authenticated": true,
      "accessTokenExpiresInMillis": 120000,
      // two day expiration of refresh token
      "refreshTokenExpiresInMillis": 172800000
    })
  }
  useEffect(() => {

    const c = setInterval(() => setNow(format(Date.now(), "PPPPpppp", { locale })), 1000);
    return () => clearInterval(c);

  }, [locale])
  const viewRef = createRef<RNView>();

  const disabled = useMemo(() => !auth.isConnected || username === "", [auth.isConnected, username]);
  return (
    <View style={styles.container} ref={viewRef}>
      <Text style={styles.title} _t="asdf">Login Screen</Text>
      <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} style={{ width: 300 }} />
      <Button title={`Login as ${username}`} onPress={handleLogin} disabled={disabled} />
      <Text>{BASE_URL}</Text>
      <Text>{JSON.stringify({ isConnected: auth.isConnected, now })}</Text>
      <Text>{JSON.stringify(auth.lastUnauthenticatedEvents, null, 2)}</Text>
    </View>
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
