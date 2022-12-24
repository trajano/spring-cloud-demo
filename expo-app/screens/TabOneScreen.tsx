import { FlashList, ListRenderItemInfo } from '@shopify/flash-list';
import { useMounted } from '@trajano/react-hooks';
import { useAuth } from '@trajano/spring-docker-auth-context';
import { useCallback, useState } from 'react';
import { Button, StyleSheet } from 'react-native';
import { useAuthenticated } from '../authenticated-context';
import { Text, View } from '../src/lib/native-unstyled';
export default function TabOneScreen() {
  const { logoutAsync, refreshAsync, accessToken, oauthToken, baseUrl } = useAuth();
  const { claims, internalState } = useAuthenticated();
  const isMounted = useMounted();

  async function handleLogout() {
    await logoutAsync();
  }

  const [refreshing, setRefreshing] = useState(false);

  const data = [
    baseUrl,
    process.env,
    oauthToken,
    claims,
    accessToken?.slice(-5),
    ...internalState
  ];
  const renderItem = useCallback(function renderItem({ item }: ListRenderItemInfo<any>) {
    return <View><Text>{JSON.stringify(item, null, 2)}</Text></View>
  }, []);

  const refreshToken = useCallback(async function refreshToken() {
    setRefreshing(true);
    await refreshAsync();
    if (isMounted()) {
      setRefreshing(false);
    }
  }, []);

  return (
    <FlashList
      contentInsetAdjustmentBehavior={"automatic"}
      estimatedItemSize={188}
      ListHeaderComponent={() => <View style={{ borderWidth: 1 }}><Text style={styles.title}>I should be Some Default Font</Text></View>}
      ListFooterComponent={() => <Button title="Logout" onPress={handleLogout} />}
      onRefresh={refreshToken}
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
    fontSize: 36,
  },

});
