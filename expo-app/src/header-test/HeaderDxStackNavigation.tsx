import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ParamListBase } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";

import { HeaderDxOneViewScreen } from "./HeaderDxOneViewScreen";
import { MainTabParamList } from "./MainTabNavigation";
import { HeaderDxLarge } from "../lib/stack-navigator-header-dx";
import { HeaderDx } from "../lib/stack-navigator-header-dx/HeaderDx";
import { HeaderDxProvider } from "../lib/stack-navigator-header-dx/HeaderDxContext";

export interface HeaderDxStackParamList extends ParamListBase {
  SampleScrollView: undefined;
  SmallHeader: undefined;
  TransparentHeader: undefined;
  TransparentSmallHeader: undefined;
}

const HeaderDxStack = createStackNavigator<HeaderDxStackParamList>();

export function HeaderDxStackNavigation({
  navigation,
  route,
}: BottomTabScreenProps<MainTabParamList>) {
  return (
    <HeaderDxProvider>
      <HeaderDxStack.Navigator screenOptions={{ header: HeaderDxLarge }}>
        <HeaderDxStack.Screen
          name="SampleScrollView"
          options={{ title: "Apps" }}
          component={HeaderDxOneViewScreen}
        />
        <HeaderDxStack.Screen
          name="SmallHeader"
          options={{ header: HeaderDx }}
          component={HeaderDxOneViewScreen}
        />
        <HeaderDxStack.Screen
          name="TransparentHeader"
          options={{ headerTransparent: true }}
          component={HeaderDxOneViewScreen}
        />
        <HeaderDxStack.Screen
          name="TransparentSmallHeader"
          options={{
            header: HeaderDx,
            headerTransparent: true,
          }}
          component={HeaderDxOneViewScreen}
        />
      </HeaderDxStack.Navigator>
    </HeaderDxProvider>
  );
}
