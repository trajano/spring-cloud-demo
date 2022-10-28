/**
 * If you are not familiar with React Navigation, refer to the "Fundamentals" guide:
 * https://reactnavigation.org/docs/getting-started
 *
 */
import { FontAwesome } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme, NavigationState } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as React from 'react';
import { ColorSchemeName, Linking, Platform, Pressable } from 'react-native';
import { useAuth } from '../auth-context';
import { AuthEvent } from '../auth-context/AuthEvent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import ModalScreen from '../screens/ModalScreen';
import NotFoundScreen from '../screens/NotFoundScreen';
import TabOneScreen from '../screens/TabOneScreen';
import TabTwoScreen from '../screens/TabTwoScreen';
import { RootStackParamList, RootTabParamList, RootTabScreenProps } from '../types';
import { AuthState } from '../auth-context/AuthState';
import LinkingConfiguration from './LinkingConfiguration';
import { LoginNavigator } from './login/LoginNavigator';
import { useTheming } from '../src/lib/native-unstyled';
import { useAsyncSetEffect } from '@trajano/react-hooks';

const PERSISTENCE_KEY = 'NAVIGATION_STATE_V1';
export default function Navigation({ colorScheme }: { colorScheme: ColorSchemeName }) {
  const auth = useAuth();
  const { reactNavigationTheme } = useTheming();
  const [authState, setAuthState] = React.useState(AuthState.INITIAL);
  const [ready, setReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState<NavigationState>();

  function authEventHandler(event: AuthEvent) {

    if (event.type == "Unauthenticated") {
      setAuthState(AuthState.UNAUTHENTICATED)
    } else if (event.type == "Authenticated") {
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

    setAuthState(auth.getAuthState());
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
    return <NavigationContainer
      linking={LinkingConfiguration}
      initialState={initialState}
      theme={reactNavigationTheme}
      onStateChange={(state) => { AsyncStorage.setItem(PERSISTENCE_KEY, JSON.stringify(state)) }}
    >
      <RootNavigator />
    </NavigationContainer>

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
const BottomTab = createBottomTabNavigator<RootTabParamList>();

function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="TabOne"
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme].tint,
      }}>
      <BottomTab.Screen
        name="TabOne"
        component={TabOneScreen}
        options={({ navigation }: RootTabScreenProps<'TabOne'>) => ({
          title: 'Tab One',
          tabBarIcon: ({ color }) => <TabBarIcon name="code" color={color} />,
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate('Modal')}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
              })}>
              <FontAwesome
                name="info-circle"
                size={25}
                color={Colors[colorScheme].text}
                style={{ marginRight: 15 }}
              />
            </Pressable>
          ),
        })}
      />
      <BottomTab.Screen
        name="TabTwo"
        component={TabTwoScreen}
        options={{
          title: 'Tab Two',
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
