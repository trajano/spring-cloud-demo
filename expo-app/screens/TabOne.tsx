import { FontAwesome } from "@expo/vector-icons";
import { createStackNavigator } from "@react-navigation/stack";
import { useCallback } from "react";
import { Pressable } from "react-native";

import {
  MainDrawerTabOneParamList,
  MainDrawerTabOneScreenProps,
} from "../types";
import TabOneScreen from "./TabOneScreen";
const Stack = createStackNavigator<MainDrawerTabOneParamList>();
export function TabOne({
  navigation,
}: MainDrawerTabOneScreenProps<"TabOneScreen">): JSX.Element {
  const defaultHeaderRight = useCallback(
    () => (
      <Pressable
        onPress={() => navigation.navigate("Modal")}
        style={({ pressed }) => ({
          opacity: pressed ? 0.5 : 1,
        })}
      >
        <FontAwesome name="info-circle" size={25} style={{ marginRight: 15 }} />
      </Pressable>
    ),
    []
  );

  return (
    <Stack.Navigator
      defaultScreenOptions={{
        headerRight: defaultHeaderRight,
      }}
    >
      <Stack.Screen
        name="TabOneScreen"
        component={TabOneScreen}
        options={{
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
}
