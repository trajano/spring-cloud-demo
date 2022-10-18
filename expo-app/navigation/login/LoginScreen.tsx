import { BASE_URL } from '@env';
import { useNetInfo } from '@react-native-community/netinfo';
import { useMemo, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { useAuth } from '../../auth-context';

import { Text, TextInput, View } from '../../components/Themed';
import type { LoginStackScreenProps } from './types';

export default function LoginScreen({ navigation }: LoginStackScreenProps<'Login'>) {
  const [username, setUsername] = useState("")
  const auth = useAuth();
  async function handleLogin() {
    return auth.login({
      "username": username,
      "authenticated": true,
      "accessTokenExpiresInMillis": 120000,
      "refreshTokenExpiresInMillis": 240000
    })
  }
  const netInfo = useNetInfo({
    reachabilityUrl: `${BASE_URL}/ping`
  });
  const disabled = useMemo(() => !netInfo.isConnected || username === "", [netInfo.isConnected, username]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Screen.</Text>
      <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} />
      <Button title={`Login as ${username}`} onPress={handleLogin} disabled={disabled} />
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
