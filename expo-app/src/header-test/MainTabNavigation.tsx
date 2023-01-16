import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { ParamListBase } from "@react-navigation/native";

import { HeaderDxStackNavigation } from "./HeaderDxStackNavigation";
import { NativeStackNavigation } from "./NativeStackNavigation";

export interface MainTabParamList extends ParamListBase {
  HeaderDxStack: undefined;
  NativeStack: undefined;
}

const MainTab = createBottomTabNavigator<MainTabParamList>();
export function MainTabNavigation() {
  return (
    <MainTab.Navigator screenOptions={{ headerShown: false }}>
      <MainTab.Screen
        name="HeaderDxStack"
        component={HeaderDxStackNavigation}
      />
      <MainTab.Screen name="NativeStack" component={NativeStackNavigation} />
    </MainTab.Navigator>
  );
}
