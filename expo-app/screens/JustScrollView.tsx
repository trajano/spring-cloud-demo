import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { AuthState, useAuth } from "@trajano/spring-docker-auth-context";
import {
  addSeconds,
  format,
  getTime,
  millisecondsToSeconds,
  startOfSecond,
} from "date-fns";
import { useCallback, useMemo, useRef, useState } from "react";
import { Animated, ColorValue, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuthenticated } from "../authenticated-context";
import { AuthenticatedEndpointConfiguration } from "../navigation/login/types";
import { Button } from "../src/components/Button";
import { Text, useRefreshControl } from "../src/lib/native-unstyled";
export function JustScrollView() {
  const safeAreaInsets = useSafeAreaInsets();
  const {
    accessToken,
    accessTokenExpired,
    authState,
    backendReachable,
    baseUrl,
    endpointConfiguration,
    forceCheckAuthStorageAsync,
    lastCheckAt,
    refreshAsync,
    tokenExpiresAt,
  } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState<number>(
    millisecondsToSeconds(tokenExpiresAt.getTime() - Date.now())
  );
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const refreshControl = useRefreshControl(
    async () => {
      setWhoamiJson("");
      await refreshAsync();
    },
    {
      title: "Refreshing auth token",
    }
  );
  const { whoami } = useAuthenticated();
  const [whoamiJson, setWhoamiJson] = useState("");

  const expire = useCallback(() => {
    AsyncStorage.setItem(
      `auth.${baseUrl.toString()}..tokenExpiresAt`,
      new Date(Date.now() - 10).toISOString()
    )
      .then(() => forceCheckAuthStorageAsync())
      .catch(console.error);
  }, [baseUrl, forceCheckAuthStorageAsync]);

  const breakToken = useCallback(() => {
    (async () => {
      await AsyncStorage.setItem(
        `auth.${baseUrl.toString()}..tokenExpiresAt`,
        new Date(Date.now() + 15000).toISOString()
      );
      await AsyncStorage.setItem(
        `auth.${baseUrl.toString()}..oauthToken`,
        JSON.stringify({
          access_token: "bad",
          refresh_token: "badrefresh",
          expires_in: 16,
          token_type: "Bearer",
        })
      );

      await forceCheckAuthStorageAsync();
    })();
  }, [baseUrl, forceCheckAuthStorageAsync]);

  const updateClock = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setTimeRemaining(
        millisecondsToSeconds(tokenExpiresAt.getTime() - Date.now())
      );
      updateClock();
    }, getTime(startOfSecond(addSeconds(Date.now(), 1))) - Date.now());
    return () => clearTimeout(timerRef.current);
  }, [timerRef, tokenExpiresAt]);
  useFocusEffect(updateClock);
  const updateWhoAmI = useCallback(() => {
    whoami()
      .then((nextWhoAmI) => setWhoamiJson(JSON.stringify(nextWhoAmI, null, 2)))
      .catch(console.error);
  }, [whoami]);

  const accessTokenBackgroundColor: ColorValue | undefined = useMemo(() => {
    if (accessTokenExpired && timeRemaining < 0) {
      return "red";
    } else if (accessTokenExpired && timeRemaining >= 0) {
      return "yellow";
    } else {
      return undefined;
    }
  }, [timeRemaining, accessTokenExpired]);

  return (
    <Animated.ScrollView
      contentInset={safeAreaInsets}
      contentContainerStyle={styles.contentContainerStyle}
      refreshControl={refreshControl}
    >
      <Text backgroundColor={accessTokenBackgroundColor}>
        Access token <Text typeScale="mono">{accessToken?.slice(-5)}</Text>{" "}
        expires on{" "}
        <Text fontWeight="bold">{format(tokenExpiresAt, "HH:mm")}</Text>
      </Text>
      <Text>
        Time remaining <Text fontWeight="bold">{timeRemaining} seconds</Text>
      </Text>
      <Text style={{ fontFamily: "NotoSansMono", fontSize: 16 }}>
        Last check <Text bold>{format(lastCheckAt, "HH:mm")}</Text>
      </Text>
      <Text backgroundColor={backendReachable ? undefined : "red"}>
        {backendReachable ? `${baseUrl} reachable` : `${baseUrl} NOT REACHABLE`}
      </Text>
      <Text fontFamily="Lexend">
        AuthState{" "}
        <Text fontFamily="Noto" fontWeight="bold">
          {AuthState[authState]}
        </Text>
      </Text>

      <Button onPress={expire}>Expire {baseUrl.toString()}</Button>
      <Button onPress={breakToken}>Break Token</Button>
      <Button onPress={updateWhoAmI}>
        {(endpointConfiguration as AuthenticatedEndpointConfiguration)
          .whoamiEndpoint ?? "whoami"}
      </Button>

      <View
        style={{
          width: 300,
          height: 400,
          borderRadius: 20,
          backgroundColor: "transparent",
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,

          elevation: 5,
        }}
      >
        <Text>{whoamiJson.substring(0, 1000)}</Text>
      </View>
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainerStyle: { padding: 16 },
});
