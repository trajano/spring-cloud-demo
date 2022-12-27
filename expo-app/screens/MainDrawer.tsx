import { createDrawerNavigator } from "@react-navigation/drawer";
import { ComponentType, useMemo } from "react";
import { useWindowDimensions } from "react-native";

import { MainDrawerParamList } from "../types";
import { AsyncStorageScreen } from "./AsyncStorageScreen";
import { EnvironmentScreen } from "./EnvironmentScreen";
import { ExpoUpdateScreen } from "./ExpoUpdateScreen";
import { JustScrollView } from "./JustScrollView";
import { StackNavigatorScrollView } from "./StackNavigatorScrollView";
import { SystemFontsScreen } from "./SystemFontsScreen";
import { TabOne } from "./TabOne";
const Drawer = createDrawerNavigator<MainDrawerParamList>();
export function DrawerNavigator() {
  const { width, height } = useWindowDimensions();
  const defaultStatus = useMemo(
    () => (width > height ? "open" : "closed"),
    [width, height]
  );
  const drawerType = useMemo(
    () => (width > height ? "permanent" : undefined),
    [width, height]
  );
  // hack TabOne as ComponentType for now.
  return (
    <Drawer.Navigator
      screenOptions={{ headerShown: false, drawerType }}
      defaultStatus={defaultStatus}
    >
      <Drawer.Screen
        name="TabOne"
        component={TabOne as ComponentType}
        options={{ headerShown: false }}
      />
      <Drawer.Screen
        name="JustScrollView"
        component={JustScrollView}
        options={{ headerShown: true, title: "Access token" }}
      />
      <Drawer.Screen
        name="StackNavigatorScrollView"
        component={StackNavigatorScrollView}
        options={{
          title: "Auth Event Log",
          headerShown: false,
        }}
      />
      <Drawer.Screen
        name="Environment"
        component={EnvironmentScreen}
        options={{
          title: "Environment",
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="ExpoUpdate"
        component={ExpoUpdateScreen}
        options={{
          title: "Expo Update",
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="AsyncStorage"
        component={AsyncStorageScreen}
        options={{
          title: "Async Storage",
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="SystemFonts"
        component={SystemFontsScreen}
        options={{
          title: "System Fonts",
          headerShown: true,
        }}
      />
    </Drawer.Navigator>
  );
}
