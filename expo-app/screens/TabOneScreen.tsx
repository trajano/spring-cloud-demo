import { FlashList, ListRenderItemInfo } from "@shopify/flash-list";
import { useMounted } from "@trajano/react-hooks";
import { useAuth } from "@trajano/spring-docker-auth-context";
import { useCallback, useState } from "react";
import { Button, StyleSheet } from "react-native";

import { useAuthenticated } from "../authenticated-context";
import { ScrollView, Text, useTheming, View } from "../src/lib/native-unstyled";
export default function TabOneScreen() {
  const { logoutAsync, refreshAsync, accessToken, oauthToken, baseUrl } =
    useAuth();
  const { claims, internalState } = useAuthenticated();
  const isMounted = useMounted();
  const { colorScheme, setColorScheme, locale, setLocale } = useTheming();

  async function handleLogout() {
    await logoutAsync();
  }
  const switchColorScheme = useCallback(() => {
    if (colorScheme === "light") {
      setColorScheme("dark");
    } else {
      setColorScheme("light");
    }
  }, [colorScheme, setColorScheme])

  const switchToSystemColorScheme = useCallback(() => {
    setColorScheme(null);
  }, [colorScheme, setColorScheme])

  const switchToSystemLocale = useCallback(() => {
    setLocale(null);
  }, [setLocale])

  const [refreshing, setRefreshing] = useState(false);

  const data = [
    baseUrl,
    process.env,
    oauthToken,
    claims,
    accessToken?.slice(-5),
    ...internalState,
  ];
  const renderItem = useCallback(function renderItem({
    item,
  }: ListRenderItemInfo<any>) {
    return (
      <View>
        <Text>{JSON.stringify(item, null, 2)}</Text>
      </View>
    );
  },
    []);

  const refreshToken = useCallback(async function refreshToken() {
    setRefreshing(true);
    await refreshAsync();
    if (isMounted()) {
      setRefreshing(false);
    }
  }, []);

  const ListHeaderComponent = useCallback(
    () => (
      <View style={{ borderWidth: 1 }}>
        <Text style={styles.title}>I should be Some Default Font</Text>
      </View>
    ),
    []
  );
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
    >
      <Text>Testing1</Text>
      <Button title="logout" onPress={logoutAsync} />
      <Text>Testing3</Text>
      <Button title={colorScheme === "light" ? "switch to dark" : "switch to light"} onPress={switchColorScheme} />
      <Button title="switch to system color scheme" onPress={switchToSystemColorScheme} />
      <Text>{locale}</Text>
      <Button title="switch to system locale" onPress={switchToSystemLocale} />
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
      <Text>Testing</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 36,
  },
});
