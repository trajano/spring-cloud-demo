import { FontAwesome } from "@expo/vector-icons";
import { CompositeScreenProps } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  createStackNavigator,
  Header,
  StackHeaderProps,
  StackScreenProps,
} from "@react-navigation/stack";
import { useCallback } from "react";
import {
  Pressable,
  PressableStateCallbackType,
  StyleProp,
  ViewStyle,
} from "react-native";

import { OneViewScreen, OneViewTransparentHeader } from "./OneViewScreen";
import { SystemFontsScreen } from "./SystemFontsScreen";
import TabOneScreen from "./TabOneScreen";
import {
  MainDrawerParamList,
  MainDrawerTabOneParamList,
  RootStackParamList,
} from "../navigation/paramLists";
import { HeaderDx } from "../src/lib/stack-navigator-header-dx/HeaderDx";
import { HeaderDxProvider } from "../src/lib/stack-navigator-header-dx/HeaderDxContext";
const Stack = createStackNavigator<MainDrawerTabOneParamList>();

function LoggingHeader({
  navigation,
  route,
  options,
  layout,
  progress,
  back,
  styleInterpolator,
}: StackHeaderProps): JSX.Element {
  console.log({
    route,
    options,
    layout, // will adjust to the height of the view?
    progress,
    back,
    styleInterpolator,
  });
  return (
    <Header
      navigation={navigation}
      route={route}
      options={options}
      layout={layout}
      progress={progress}
      back={back}
      styleInterpolator={styleInterpolator}
    />
  );
}
function pressedStyle({
  pressed,
}: PressableStateCallbackType): StyleProp<ViewStyle> {
  return { opacity: pressed ? 0.5 : 1 };
}
export function TabOneNavigator({
  navigation,
}: CompositeScreenProps<
  StackScreenProps<MainDrawerParamList, "TabOne">,
  NativeStackScreenProps<RootStackParamList>
>): JSX.Element {
  const navigateToModal = useCallback(
    () => navigation.navigate("Modal"),
    [navigation]
  );
  const defaultHeaderRight = useCallback(
    () => (
      <Pressable onPress={navigateToModal} style={pressedStyle}>
        <FontAwesome name="info-circle" size={25} style={{ marginRight: 15 }} />
      </Pressable>
    ),
    [navigateToModal]
  );

  return (
    <HeaderDxProvider>
      <Stack.Navigator
        defaultScreenOptions={{
          headerRight: defaultHeaderRight,
          headerMode: "float",
        }}
      >
        <Stack.Screen
          name="TabOneScreen"
          component={TabOneScreen}
          options={{
            // header: LoggingHeader,
            headerShown: true,
            headerTransparent: false,
            headerMode: "float",
          }}
        />
        <Stack.Screen
          name="SystemFonts"
          component={SystemFontsScreen}
          options={{
            // header: LoggingHeader,
            title: "System Fonts",
            headerShown: true,
            headerMode: "float",
          }}
        />
        <Stack.Screen
          name="OneView"
          component={OneViewScreen}
          options={{
            header: HeaderDx,
            title: "One View",
            headerShown: true,
            headerTransparent: false,
            headerMode: "float",
          }}
        />
        <Stack.Screen
          name="OneViewTransparentHeader"
          component={OneViewTransparentHeader}
          options={{
            header: LoggingHeader,
            title: "One View Transparent Header",
            headerShown: true,
            headerTransparent: true,
            headerMode: "float",
          }}
        />
      </Stack.Navigator>
    </HeaderDxProvider>
  );
}
