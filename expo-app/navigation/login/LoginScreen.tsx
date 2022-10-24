import { BASE_URL } from '@env';
import { useEffect, useMemo, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { useAuth } from '../../auth-context';

import { Text, TextInput, View } from '../../components/Themed';
import type { LoginStackScreenProps } from './types';

import NetworkLogger from 'react-native-network-logger';

export default function LoginScreen({ navigation }: LoginStackScreenProps<'Login'>) {
  const [username, setUsername] = useState("")
  const auth = useAuth();
  const [isConnected, setIsConnected] = useState(auth.isConnected());
  useEffect(() => {
    return auth.subscribe((authEvent) => {
      if (authEvent.type === "Connection") {
        setIsConnected(auth.isConnected());
      }
    })
  }, [])
  async function handleLogin() {
    return auth.login({
      "username": username,
      "authenticated": true,
      "accessTokenExpiresInMillis": 120000,
      // two day expiration of refresh token
      "refreshTokenExpiresInMillis": 172800000
    })
  }

  const disabled = useMemo(() => !isConnected || username === "", [isConnected, username]);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login Screen</Text>
      <TextInput placeholder='Username' defaultValue={username} onChangeText={setUsername} />
      <Button title={`Login as ${username}`} onPress={handleLogin} disabled={disabled} />
      <Text>{BASE_URL}</Text>
      <Text>{JSON.stringify({ isConnected })}</Text>
      <View style={{ flex: 1 }}>
        <NetworkLogger />
      </View>
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
