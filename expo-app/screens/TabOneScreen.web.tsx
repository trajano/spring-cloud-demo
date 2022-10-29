import { Button, ScrollView, StyleSheet } from 'react-native';
import { AuthEvent, useAuth } from '../auth-context';

import { BASE_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import base64url from 'base64url';
import * as jose from 'jose';
import pako from 'pako';
import { useCallback, useEffect, useRef, useState } from 'react';
import { RootTabScreenProps } from '../types';
import { Text, View } from '../src/components';

import { AnimatedFlashList, ListRenderItemInfo } from '@shopify/flash-list';
export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {
  const auth = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [claims, setClaims] = useState<jose.JWTPayload | null>(null)
  const mountedRef = useRef(false);

  async function handleLogout() {
    await auth.logout();
  }
  function updateAuthToken(event: AuthEvent) {
    if (event.type == "Authenticated") {
      setAccessToken(event.accessToken);
    }
  }

  const getValidatedClaims = useCallback(async () => {
    if (accessToken == null) {
      return null;
    }
    const decodedCompressed = base64url.toBuffer(accessToken)
    const jwt = pako.inflate(decodedCompressed, { to: "string" });
    const jwks = jose.createRemoteJWKSet(new URL(`${BASE_URL}/jwks`))

    console.log(jwt)
    console.log(`${BASE_URL}/jwks`)
    console.log(jwks)
    const { payload, protectedHeader } = await jose.jwtVerify(jwt, jwks, {
      issuer: 'http://localhost',
      audience: 'unknown',
    })
    console.log(protectedHeader)
    console.log(payload)
    return payload;
  }, [accessToken])

  useFocusEffect(useCallback(() => {
    const accessTokenFromAuth = auth.accessToken
    setAccessToken(accessTokenFromAuth)
    return auth.subscribe(updateAuthToken)
  }, []));

  useFocusEffect(useCallback(() => {
    (async function () {
      const claims = await getValidatedClaims();
      if (mountedRef.current) {
        setClaims(claims)
      }
    })()
  }, [accessToken]));

  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false } }, []);

  const data = [
    auth.oauthToken,
    claims,
    auth.oauthToken && pako.inflate(base64url.toBuffer(auth.oauthToken.access_token), { to: "string" })

  ];
  function renderItem({ item }: ListRenderItemInfo<any>) {
    return <View style={{ borderTopWidth: 1, borderColor: "yellow" }}><Text>{JSON.stringify(item, null, 2)}</Text></View>
  }
  return (
    <AnimatedFlashList
      estimatedItemSize={30}
      ListHeaderComponent={() => <Text style={styles.title}>Title</Text>}
      ListFooterComponent={() => <View style={{ borderTopWidth: 1, borderColor: "yellow" }}><Button title="Logout" onPress={handleLogout} /></View>}
      data={data}
      renderItem={renderItem}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
