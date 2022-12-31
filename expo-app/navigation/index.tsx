/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createMaterialBottomTabNavigator } from "@react-navigation/material-bottom-tabs";
import { NavigationContainer, NavigationState } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
  AuthEvent,
  AuthState,
  useAuth,
} from "@trajano/spring-docker-auth-context";
import { ComponentProps, useCallback, useEffect, useState } from "react";
import { Linking, Platform, StyleSheet } from "react-native";

import { AuthenticatedProvider } from "../authenticated-context";
import { DrawerNavigator } from "../screens/MainDrawer";
import ModalScreen from "../screens/ModalScreen";
import { NetworkLoggerTab } from "../screens/NetworkLoggerTab";
import NotFoundScreen from "../screens/NotFoundScreen";
import { TextTab } from "../screens/TextTab";
import { ActivityIndicator, useTheming } from "../src/lib/native-unstyled";
import { RootStackParamList, RootTabParamList } from "../types";
import LinkingConfiguration from "./LinkingConfiguration";
import { LoginNavigator } from "./login/LoginNavigator";
import { AuthenticatedEndpointConfiguration } from "./login/types";

const PERSISTENCE_KEY = "NAVIGATION_STATE_V1";
function cleanAuthEvent({
  type,
  authState,
  accessToken,
  authorization: _authorization,
  ...rest
}: AuthEvent & Record<string, any>): string {
  return (
    `${AuthState[authState]} [${type}] ` +
    JSON.stringify({
      accessToken: accessToken?.slice(-5),
      ...rest,
    })
  );
}
export default function Navigation() {
  const auth = useAuth();
  const { reactNavigationTheme } = useTheming();
  const [authNavigationState, setAuthNavigationState] = useState(
    auth.authState
  );
  const [ready, setReady] = useState(false);
  const [initialState, setInitialState] = useState<NavigationState>();

  const authEventHandler = useCallback(function authEventHandler(
    event: AuthEvent
  ) {
    console.log(cleanAuthEvent(event));

    if (event.type === "Unauthenticated") {
      setAuthNavigationState(AuthState.UNAUTHENTICATED);
    } else if (event.type === "Authenticated") {
      setAuthNavigationState(AuthState.AUTHENTICATED);
    }
  },
  []);

  useEffect(() => {
    const restoreState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();

        if (Platform.OS !== "web" && initialUrl == null) {
          // Only restore state if there's no deep link and we're not on web
          const savedStateString = await AsyncStorage.getItem(PERSISTENCE_KEY);
          const state = savedStateString
            ? JSON.parse(savedStateString)
            : undefined;

          if (state !== undefined) {
            setInitialState(state);
          }
        }
      } finally {
        setReady(true);
      }
    };

    if (!ready) {
      restoreState();
    }
  }, [ready]);

  const onStateChange = useCallback((state: NavigationState | undefined) => {
    AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state));
  }, []);

  useEffect(() => {
    return auth.subscribe(authEventHandler);
  }, []);

  const endpointConfiguration =
    auth.endpointConfiguration as AuthenticatedEndpointConfiguration;
  if (authNavigationState === AuthState.UNAUTHENTICATED) {
    return (
      <NavigationContainer
        linking={LinkingConfiguration}
        theme={reactNavigationTheme}
      >
        <LoginNavigator />
      </NavigationContainer>
    );
  } else if (authNavigationState === AuthState.AUTHENTICATED && !ready) {
    return <ActivityIndicator />;
  } else if (authNavigationState === AuthState.AUTHENTICATED && ready) {
    return (
      <AuthenticatedProvider
        whoAmIEndpoint={endpointConfiguration.whoamiEndpoint}
        issuer="http://localhost"
        verifyClaims={endpointConfiguration.verifyClaims}
        clientId={endpointConfiguration.clientId}
      >
        <NavigationContainer
          linking={LinkingConfiguration}
          initialState={initialState}
          theme={reactNavigationTheme}
          onStateChange={onStateChange}
        >
          <RootNavigator />
        </NavigationContainer>
      </AuthenticatedProvider>
    );
  } else {
    // initial
    return (
      <NavigationContainer
        linking={LinkingConfiguration}
        theme={reactNavigationTheme}
      >
        <RootNavigator />
      </NavigationContainer>
    );
  }
}

/**
 * A root stack navigator is often used for displaying modals on top of all other content.
 * https://reactnavigation.org/docs/modal
 */
const Stack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Root"
        component={BottomTabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="NotFound"
        component={NotFoundScreen}
        options={{ title: "Oops!" }}
      />
      <Stack.Group screenOptions={{ presentation: "modal" }}>
        <Stack.Screen name="Modal" component={ModalScreen} />
      </Stack.Group>
    </Stack.Navigator>
  );
}

/**
 * A bottom tab navigator displays tab buttons on the bottom of the display to switch screens.
 * https://reactnavigation.org/docs/bottom-tab-navigator
 */
const BottomTab = createMaterialBottomTabNavigator<RootTabParamList>();
function BottomTabNavigator() {
  const MainDrawerTabIcon = useCallback(
    ({ color }: { color: string }) => (
      <TabBarIcon name="archive" color={color} />
    ),
    []
  );
  const TabTwoTabIcon = useCallback(
    ({ color }: { color: string }) => (
      <TabBarIcon name="address-book" color={color} />
    ),
    []
  );
  const NetworkLoggerTabIcon = useCallback(
    ({ color }: { color: string }) => <TabBarIcon name="globe" color={color} />,
    []
  );
  return (
    <BottomTab.Navigator
      initialRouteName="MainDrawer"
      shifting
      barStyle={{
        height: 64,
      }}
      screenOptions={{}}
    >
      <BottomTab.Screen
        name="MainDrawer"
        component={DrawerNavigator}
        options={{
          title: "Tab One",
          tabBarIcon: MainDrawerTabIcon,
        }}
      />
      <BottomTab.Screen
        name="TabTwo"
        component={TextTab}
        options={{
          title: "Text",
          tabBarIcon: TabTwoTabIcon,
        }}
      />
      <BottomTab.Screen
        name="NetworkLogger"
        component={NetworkLoggerTab}
        options={{
          title: "Network Log",
          tabBarIcon: NetworkLoggerTabIcon,
        }}
      />
    </BottomTab.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={30} style={styles.TabBarIcon} {...props} />;
}
const styles = StyleSheet.create({
  TabBarIcon: { marginBottom: -3 },
});
