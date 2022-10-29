import { Button, StyleSheet } from 'react-native';
import { AuthEvent, useAuth } from '../auth-context';

import { BASE_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedFlashList, ListRenderItemInfo } from '@shopify/flash-list';
import base64url from 'base64url';
import * as jose from 'node-jose';
import pako from 'pako';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from '../src/components';
import { RootTabScreenProps } from '../types';
export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {
  const auth = useAuth();
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null)
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
    const jwksFetch = await fetch(`${BASE_URL}/jwks`)
    const jwksJson = await jwksFetch.json();
    const jwks = await jose.JWK.asKeyStore(jwksJson);
    const jwsResult = await jose.JWS.createVerify(jwks, { allowEmbeddedKey: false }).verify(jwt);
    const payload = JSON.parse(jwsResult.payload.toString()) as {
      aud: string[],
      exp: number
    };
    if (payload.aud.findIndex(aud => aud === "unknown") >= 0 && payload.exp >= Date.now() / 1000) {
      return payload;
    }
    else {
      throw new Error("JWT not valid")
    }
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
    claims
  ];
  function renderItem({ item }: ListRenderItemInfo<any>) {
    return <View><Text>{JSON.stringify(item, null, 2)}</Text></View>
  }
  //const uncompressedJwt = pako.deflate(base64.decode(oauthToken.access_token))
  return (
    <AnimatedFlashList
      estimatedItemSize={188}
      ListHeaderComponent={() => <Text style={styles.title}>Title</Text>}
      ListFooterComponent={() => <Button title="Logout" onPress={handleLogout} />}
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
