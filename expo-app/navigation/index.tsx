/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { BASE_URL } from '@env';
import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { NavigationContainer, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAsyncSetEffect } from '@trajano/react-hooks';
import { AuthEvent, AuthState, useAuth } from '@trajano/spring-docker-auth-context';
import * as React from 'react';
import { Linking, Platform } from 'react-native';
import { AuthenticatedProvider } from '../authenticated-context';
import { DrawerNavigator } from '../screens/MainDrawer';
import ModalScreen from '../screens/ModalScreen';
import { NetworkLoggerTab } from '../screens/NetworkLoggerTab';
import NotFoundScreen from '../screens/NotFoundScreen';
import { TextTab } from '../screens/TextTab';
import { useTheming } from '../src/lib/native-unstyled';
import { RootStackParamList, RootTabParamList } from '../types';
import LinkingConfiguration from './LinkingConfiguration';
import { LoginNavigator } from './login/LoginNavigator';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';
export default function Navigation() {
  const auth = useAuth();
  const { reactNavigationTheme } = useTheming();
  const [authState, setAuthState] = React.useState(auth.authState);
  const [ready, setReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState<NavigationState>();

  function authEventHandler(event: AuthEvent) {
    console.log({ event });

    if (event.type === "Unauthenticated") {
      setAuthState(AuthState.UNAUTHENTICATED)
    } else if (event.type === "Authenticated") {
      setAuthState(AuthState.AUTHENTICATED)
    }

  }

  useAsyncSetEffect(
    async () => {

      const initialUrl = await Linking.getInitialURL();
      if (Platform.OS !== "web" && initialUrl !== null) {
        // Only restore state if there's no deep link and we're not on web
        return AsyncStorage.getItem(PERSISTENCE_KEY);
      } else {
        return null;
      }
    },
    (storedState) => {
      if (storedState !== null) {
        setInitialState(JSON.parse(storedState));
        setReady(true);
      }
    }, [ready]);

  React.useEffect(() => {

    return auth.subscribe(authEventHandler)

  }, [])

  console.log("Render", AuthState[authState])
  if (authState == AuthState.UNAUTHENTICATED) {
    return <NavigationContainer
      linking={LinkingConfiguration}
      theme={reactNavigationTheme}>
      <LoginNavigator />
    </NavigationContainer>

  } else if (authState == AuthState.AUTHENTICATED) {
    return <AuthenticatedProvider baseUrl={BASE_URL}
      accessToken={auth.accessToken!}
      accessTokenExpired={auth.accessTokenExpired}
      issuer='http://localhost'
      clientId='unknown'>
      <NavigationContainer
        linking={LinkingConfiguration}
        initialState={initialState}
        theme={reactNavigationTheme}
        onStateChange={(state) => { AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)) }}
      >
        <RootNavigator />
      </NavigationContainer>
    </AuthenticatedProvider>

  } else {
    // initial
    return <NavigationContainer
      linking={LinkingConfiguration}
      theme={reactNavigationTheme}>
      <RootNavigator />
    </NavigationContainer>

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
      <Stack.Screen name="Root" component={BottomTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="NotFound" component={NotFoundScreen} options={{ title: 'Oops!' }} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
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

  return (
    <BottomTab.Navigator
      initialRouteName="MainDrawer"
      shifting={true}
      screenOptions={{
      }}>
      <BottomTab.Screen
        name="MainDrawer"
        component={DrawerNavigator}
        options={() => ({
          title: 'Tab One',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        })}
      />
      <BottomTab.Screen
        name="TabTwo"
        component={TextTab}
        options={{
          title: 'Text',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
      <BottomTab.Screen
        name="NetworkLogger"
        component={NetworkLoggerTab}
        options={{
          title: 'Network Log',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={30} style={{ marginBottom: -3 }} {...props} />;
}
