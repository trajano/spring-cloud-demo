import { FontAwesome } from "@expo/vector-icons";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable } from "react-native";

import { MainDrawerTabOneParamList } from "../../types";
import TabOneScreen from "../TabOneScreen";
const Stack = createNativeStackNavigator<MainDrawerTabOneParamList>();
export function TabOne({ navigation }: any) {
  return (
    <Stack.Navigator
      defaultScreenOptions={{
        headerLargeTitle: true,
        headerShown: true,
        headerTransparent: true,
        headerRight: () => (
          <Pressable
            onPress={() => navigation.navigate("Modal")}
            style={({ pressed }) => ({
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <FontAwesome
              name="info-circle"
              size={25}
              style={{ marginRight: 15 }}
            />
          </Pressable>
        ),
      }}
    >
      <Stack.Screen
        name="TabOneScreen"
        component={TabOneScreen}
        options={{
          headerLargeTitle: true,
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: "light",
          headerRight: () => (
            <Pressable
              onPress={() => navigation.navigate("Modal")}
              style={({ pressed }) => ({
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <FontAwesome
                name="info-circle"
                size={25}
                style={{ marginRight: 15 }}
              />
            </Pressable>
          ),
        }}
      />
    </Stack.Navigator>
  );
}
