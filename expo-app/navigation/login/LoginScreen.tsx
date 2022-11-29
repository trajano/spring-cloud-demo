import { BASE_URL } from '@env';
import { useAuth } from '@trajano/spring-docker-auth-context';
import { format, Locale, hoursToMilliseconds } from 'date-fns';
import * as dateFnsLocales from 'date-fns/locale';
import * as Localization from 'expo-localization';
import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { TextInput } from '../../components/Themed';
import { ScrollView, Text, View } from '../../src/components';
import type { LoginStackScreenProps } from './types';

export function LoginForm() {
  const auth = useAuth();
  const [username, setUsername] = useState("");
  const disabled = useMemo(() => !auth.isConnected || username === "", [auth.isConnected, username]);
  async function handleLogin() {
    return auth.login({
      "username": username,
      "authenticated": true,
      "accessTokenExpiresInMillis": 120000,
      // thirty day expiration of refresh token
      "refreshTokenExpiresInMillis": hoursToMilliseconds(24 * 30)
    })
  }

  return (<View>
    <Text style={styles.title} _t="asdf">Login Screen</Text>
    <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} style={{ width: 300 }} />
    <Button title={`Login as ${username}`} onPress={handleLogin} disabled={disabled} />
  </View>
  )
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


  }, [Localization.locales])

  const auth = useAuth();
  const [now, setNow] = useState(format(Date.now(), "PPPPpppp", { locale }))
  useEffect(() => {

    const c = setInterval(() => setNow(format(Date.now(), "PPPPpppp", { locale })), 1000);
    return () => clearInterval(c);

  }, [locale])
  return (
    <View style={{ flex: 1 }}>
      <LoginForm />
      <ScrollView>
        <Text>{BASE_URL}</Text>
        <Text>{JSON.stringify({ isConnected: auth.isConnected, now })}</Text>
        <Text>{JSON.stringify(auth.lastAuthEvents, null, 2)}</Text>
      </ScrollView>
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
