import { useAuth } from '@trajano/spring-docker-auth-context';
import { Button, StyleSheet } from 'react-native';

import { BASE_URL } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import { AnimatedFlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useMounted } from '@trajano/react-hooks';
import base64url from 'base64url';
import pako from 'pako';
import { useCallback, useState } from 'react';
import { useAuthenticated } from '../authenticated-context';
import { Text, View } from '../src/components';
import { RootTabScreenProps } from '../types';
export default function TabOneScreen({ navigation }: RootTabScreenProps<'TabOne'>) {
  const { logout, refresh, accessToken, oauthToken } = useAuth();
  const { claims } = useAuthenticated();
  const [whoami, setWhoami] = useState<string | null>("whoami");
  const isMounted = useMounted();

  async function handleLogout() {
    await logout();
  }


  useFocusEffect(useCallback(() => {
    (async function () {
      const z = await fetch(`${BASE_URL}/whoami`, {
        "method": "GET",
        "headers": { authorization: `Bearer ${accessToken}` }
      });
      const x = await (z).text();
      if (isMounted()) {
        setWhoami(x);
      }
    })()
  }, [accessToken]));

  const [refreshing, setRefreshing] = useState(false);

  const data = [
    oauthToken,
    claims,
    accessToken,
    whoami
  ];
  function renderItem({ item }: ListRenderItemInfo<any>) {
    return <View><Text>{JSON.stringify(item, null, 2)}</Text></View>
  }

  async function refreshToken() {
    setRefreshing(true);
    await refresh();
    if (isMounted()) {
      setRefreshing(false);
    }
  }

  return (
    <AnimatedFlashList
      estimatedItemSize={188}
      ListHeaderComponent={() => <Text style={styles.title}>Title</Text>}
      ListFooterComponent={() => <Button title="Logout" onPress={handleLogout} />}
      onRefresh={() => refreshToken()}
      refreshing={refreshing}
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
