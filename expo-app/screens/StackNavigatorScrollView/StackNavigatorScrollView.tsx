import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { StackNavigatorScrollViewScreen } from "./StackNavigatorScrollViewScreen";
const Stack = createNativeStackNavigator();

export function StackNavigatorScrollView() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerLargeTitle: true,
        headerTransparent: true,
      }}
    >
      <Stack.Screen
        name="StackNavigatorScrollViewScreen"
        component={StackNavigatorScrollViewScreen}
        options={{ title: "Recent Auth Events" }}
      />
    </Stack.Navigator>
  );
}
