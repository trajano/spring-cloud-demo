import { BASE_URL } from "@env";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  buildSimpleEndpointConfiguration,
  useAuth,
} from "@trajano/spring-docker-auth-context";
import { format, hoursToMilliseconds, Locale } from "date-fns";
import * as dateFnsLocales from "date-fns/locale";
import * as Localization from "expo-localization";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Platform, ScrollView, StyleSheet, View } from "react-native";
import { Menu, Provider } from "react-native-paper";

import type {
  AuthenticatedEndpointConfiguration,
  LoginStackScreenProps,
} from "./types";
import { Text, TextInput } from "../../src/lib/native-unstyled";

export function LoginForm() {
  const { loginAsync, backendReachable, baseUrl, setEndpointConfiguration } =
    useAuth();
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const disabled = useMemo(
    () => !backendReachable || username === "" || isLoggingIn,
    [backendReachable, username, isLoggingIn]
  );

  function openMenu() {
    setVisible(true);
  }

  function closeMenu() {
    setVisible(false);
  }

  const handleLogin = useCallback(() => {
    setIsLoggingIn(true);
    loginAsync({
      username,
      authenticated: true,
      accessTokenExpiresInMillis: 120000,
      // thirty day expiration of refresh token
      refreshTokenExpiresInMillis: hoursToMilliseconds(24 * 30),
    }).finally(() => setIsLoggingIn(false));
  }, [loginAsync, username]);

  async function setAndSaveBaseUrlAsync(nextBaseUrl: string) {
    const configuration = buildSimpleEndpointConfiguration(nextBaseUrl);
    await AsyncStorage.setItem(
      "ENDPOINT_CONFIGURATION",
      JSON.stringify(configuration)
    );
    setEndpointConfiguration(configuration);
  }
  async function setAndSaveEndpointConfigurationAsync(
    nextEndpointConfiguration: AuthenticatedEndpointConfiguration
  ) {
    await AsyncStorage.setItem(
      "ENDPOINT_CONFIGURATION",
      JSON.stringify(nextEndpointConfiguration)
    );
    setEndpointConfiguration(nextEndpointConfiguration);
  }

  return (
    <View>
      <Text style={styles.title} _t="asdf">
        Login Screen
      </Text>
      <Menu
        visible={visible}
        onDismiss={closeMenu}
        anchor={<Button onPress={openMenu} title={baseUrl.toString()} />}
      >
        <Menu.Item
          onPress={() => {
            setAndSaveBaseUrlAsync(BASE_URL!);
          }}
          title={BASE_URL}
        />
        {Platform.OS === "web" && (
          <Menu.Item
            onPress={() => {
              setAndSaveBaseUrlAsync("http://localhost:28082/").catch(
                console.error
              );
            }}
            title="Local server"
          />
        )}
      </Menu>
      <TextInput
        placeholder="Username"
        defaultValue={username}
        onChangeText={setUsername}
        style={{ width: 300 }}
      />
      <Button
        title={`Login as ${username}`}
        onPress={handleLogin}
        disabled={disabled}
      />
    </View>
  );
}

export default function LoginScreen({
  navigation,
}: LoginStackScreenProps<"Login">) {
  /*
   * given Localization.locales
   * translate to DateFnsLocales
   */
  const locale: Locale = useMemo(() => {
    const dateFnsLocales2 = dateFnsLocales as Record<string, Locale>;
    return (
      Localization.locales
        .map((locale) =>
          /*
           * handle special cases
           * Android does not support replaceAll() this is a workaround.
           */
          locale.split("-").join("")
        )
        .filter((localeKey) => !!dateFnsLocales2[localeKey])
        .map((localeKey) => dateFnsLocales2[localeKey])[0] ??
      dateFnsLocales.enUS
    );
  }, []);

  const auth = useAuth();
  const [now, setNow] = useState(format(Date.now(), "PPPPpppp", { locale }));
  useEffect(() => {
    const c = setInterval(
      () => setNow(format(Date.now(), "PPPPpppp", { locale })),
      1000
    );
    return () => clearInterval(c);
  }, [locale]);
  return (
    <Provider>
      <View style={{ flex: 1 }}>
        <LoginForm />
        <ScrollView>
          <Text>
            {JSON.stringify({ isConnected: auth.backendReachable, now })}
          </Text>
        </ScrollView>
      </View>
    </Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    color: "#2e78b7",
  },
});
