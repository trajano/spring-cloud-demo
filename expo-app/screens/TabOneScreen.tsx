import { BASE_URL } from '@env';
import { useHeaderHeight } from '@react-navigation/elements';
import { useFocusEffect } from '@react-navigation/native';
import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useMounted } from '@trajano/react-hooks';
import { useAuth } from '@trajano/spring-docker-auth-context';
import { useCallback, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { useAuthenticated } from '../authenticated-context';
import { Text, View } from '../src/components';
import { MainDrawerScreenProps } from '../types';
export default function TabOneScreen() {
  const { logout, refresh, accessToken, oauthToken } = useAuth();
  const { claims, internalState } = useAuthenticated();
  const isMounted = useMounted();

  async function handleLogout() {
    await logout();
  }

  const [refreshing, setRefreshing] = useState(false);

  const data = [
    oauthToken,
    claims,
    accessToken?.slice(-5),
    ...internalState
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
    <FlashList
      contentInsetAdjustmentBehavior={"automatic"}
      estimatedItemSize={188}
      ListHeaderComponent={() => <View style={{ borderWidth: 1 }}><Text style={styles.title}>Title</Text></View>}
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

});
