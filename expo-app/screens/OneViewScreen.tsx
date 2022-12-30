import type { StackScreenProps } from "@react-navigation/stack";
import { LayoutRectangle } from "react-native";

import { Text, ScrollView, View } from "../src/lib/native-unstyled";
import type { MainDrawerTabOneParamList } from "../types";

export function OneViewScreen({
  navigation,
  route,
}: StackScreenProps<MainDrawerTabOneParamList>) {
  const rect: LayoutRectangle = route.params ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  };

  return (
    <ScrollView
      {...rect}
      height={rect.height}
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "center",
        height: rect.height,
      }}
      borderWidth={1}
      borderColor="yellow"
    >
      <Text>{JSON.stringify(rect, null, 2)}</Text>
    </ScrollView>
  );
}
