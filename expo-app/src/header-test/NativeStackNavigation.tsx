import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { ParamListBase } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { MainTabParamList } from "./MainTabNavigation";
import { NativeOneViewScreen } from "./NativeOneViewScreen";

export interface NativeStackParamList extends ParamListBase {
  SampleScrollView: undefined;
  SmallHeader: undefined;
  TransparentHeader: undefined;
  TransparentSmallHeader: undefined;
}
const NativeStack = createNativeStackNavigator<NativeStackParamList>();

export function NativeStackNavigation({
  navigation,
  route,
}: BottomTabScreenProps<MainTabParamList>) {
  return (
    <NativeStack.Navigator screenOptions={{ headerLargeTitle: true }}>
      <NativeStack.Screen
        name="SampleScrollView"
        options={{
          title: "some very longish title goes here to see what happens",
        }}
        component={NativeOneViewScreen}
      />
      <NativeStack.Screen
        name="SmallHeader"
        options={{ headerLargeTitle: false }}
        component={NativeOneViewScreen}
      />
      <NativeStack.Screen
        name="TransparentHeader"
        options={{ headerTransparent: true }}
        component={NativeOneViewScreen}
      />
      <NativeStack.Screen
        name="TransparentSmallHeader"
        options={{
          headerTransparent: true,
          headerLargeTitle: false,
        }}
        component={NativeOneViewScreen}
      />
    </NativeStack.Navigator>
  );
}
