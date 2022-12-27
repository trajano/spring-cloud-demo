import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { View } from "../../src/lib/native-unstyled";
import LoginScreen from "./LoginScreen";
import { LoginStackParamList } from "./types";

const Stack = createNativeStackNavigator<LoginStackParamList>();
export function LoginNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Modal" component={View} />
    </Stack.Navigator>
  );
}
