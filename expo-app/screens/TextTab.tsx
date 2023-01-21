import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabTwoScreen from "./TabTwoScreen";
const Stack = createNativeStackNavigator();
export function TextTab() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerLargeTitle: true,
      }}
    >
      <Stack.Screen
        name="Text"
        component={TabTwoScreen}
        options={{
          headerLargeTitle: true,
          headerTransparent: true,
          headerBlurEffect: "light",
        }}
      />
    </Stack.Navigator>
  );
}
