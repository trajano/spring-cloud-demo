import { useHeaderHeight } from "@react-navigation/elements";
import { StackScreenProps } from "@react-navigation/stack";
import { ListRenderItemInfo } from "@shopify/flash-list";
import { useMounted } from "@trajano/react-hooks";
import { useAuth } from "@trajano/spring-docker-auth-context";
import { useCallback, useState } from "react";
import {
  Button,
  LayoutChangeEvent,
  LayoutRectangle,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthenticated } from "../authenticated-context";
import { ScrollView, Text, useTheming, View } from "../src/lib/native-unstyled";
import { useAlert } from "../src/lib/native-unstyled/useAlert";
import { MainDrawerTabOneParamList } from "../types";
export default function TabOneScreen({
  navigation,
  route,
}: StackScreenProps<MainDrawerTabOneParamList>) {
  const { logoutAsync, refreshAsync, accessToken, oauthToken, baseUrl } =
    useAuth();
  const { claims, internalState } = useAuthenticated();
  const isMounted = useMounted();
  const headerHeight = useHeaderHeight();
  const { colorScheme, setColorScheme, locale, setLocale, t } = useTheming();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { top: safeAreaInsetTop } = useSafeAreaInsets();
  const { alert } = useAlert();

  const [scrollViewLayout, setScrollViewLayout] = useState<LayoutRectangle>({
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  });

  const onLayout = useCallback(
    function onLayout(ev: LayoutChangeEvent) {
      setScrollViewLayout(ev.nativeEvent.layout);
    },
    [setScrollViewLayout]
  );

  const switchColorScheme = useCallback(() => {
    if (colorScheme === "light") {
      setColorScheme("dark");
    } else {
      setColorScheme("light");
    }
  }, [colorScheme, setColorScheme]);

  const switchToSystemColorScheme = useCallback(() => {
    setColorScheme(null);
  }, [colorScheme, setColorScheme]);

  const switchToSystemLocale = useCallback(() => {
    setLocale(null);
  }, [setLocale]);

  const switchToEnCa = useCallback(() => {
    setLocale("en-CA");
  }, [setLocale]);

  const switchToEnUS = useCallback(() => {
    setLocale("en-US");
  }, [setLocale]);

  const switchToEn = useCallback(() => {
    setLocale("en");
  }, [setLocale]);

  const switchToJa = useCallback(() => {
    setLocale("ja");
  }, [setLocale]);

  const handleLogout = useCallback(() => {
    alert(t`logout`, "Are you sure you want to logout?", [
      {
        text: "No",
      },
      {
        style: "destructive",
        text: "Yes",
        onPress: logoutAsync,
      },
    ]);
  }, [logoutAsync, alert]);

  const headerTransparent = useCallback(() => {
    navigation.setOptions({ headerTransparent: true });
  }, [navigation]);
  const headerNotTransparent = useCallback(() => {
    navigation.setOptions({ headerTransparent: false });
  }, [navigation]);
  const toSystemFonts = useCallback(() => {
    navigation.navigate("SystemFonts");
  }, [navigation]);
  const toOneView = useCallback(() => {
    navigation.navigate("OneView", {
      x: 0,
      y: 0,
      width: 375,
      height: 603 - headerHeight, // this is the height with the header and status area minus the tab bar
    });
  }, [navigation]);
  const toOneViewTransparentHeader = useCallback(() => {
    navigation.navigate("OneViewTransparentHeader", {
      x: 0,
      y: 0,
      width: 375,
      height: 603, // this is the height with the header and status area minus the tab bar
    });
  }, [navigation]);

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

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" onLayout={onLayout}>
      <View
        height={headerHeight - safeAreaInsetTop}
        borderWidth={1}
        borderColor="yellow"
      >
        <Text>
          {headerHeight}-{safeAreaInsetTop}={headerHeight - safeAreaInsetTop}
        </Text>
      </View>
      <Text>Testing1</Text>
      <Button title="header transparent" onPress={headerTransparent} />
      <Button title="header not transparent" onPress={headerNotTransparent} />
      <Button title="System Fonts" onPress={toSystemFonts} />
      <Button title="One view" onPress={toOneView} />
      <Button title="One view (trans)" onPress={toOneViewTransparentHeader} />
      <Button title={t("logout")} onPress={handleLogout} />
      <Text>Testing3</Text>
      <Button
        title={
          colorScheme === "light"
            ? t("switchToDarkColorScheme")
            : t("switchToLightColorScheme")
        }
        onPress={switchColorScheme}
      />
      <Button
        title="switch to system color scheme"
        onPress={switchToSystemColorScheme}
      />
      <Text>{locale}</Text>
      <Button title="switch to system locale" onPress={switchToSystemLocale} />
      <Button title="switch to en-CA" onPress={switchToEnCa} />
      <Button title="switch to en-US" onPress={switchToEnUS} />
      <Button title="switch to en" onPress={switchToEn} />
      <Button title="switch to ja" onPress={switchToJa} />

      <Text>Disabled buttons</Text>
      <Button title="switch to ja" disabled onPress={switchToJa} />
      <Text>
        w:{windowWidth} h:{windowHeight} hh:{headerHeight}
      </Text>
      <Text>{JSON.stringify(scrollViewLayout)}</Text>
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
