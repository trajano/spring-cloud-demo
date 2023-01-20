import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Animated } from "react-native";

import { NativeStackParamList } from "./NativeStackNavigation";
import { OneViewContent } from "./OneViewContent";
import { useRefreshControl } from "../lib/native-unstyled";

export function NativeOneViewScreen({
  navigation,
  route,
}: NativeStackScreenProps<NativeStackParamList>) {
  const refreshControl = useRefreshControl(
    async () => new Promise((resolve) => setTimeout(resolve, 2000))
  );

  return (
    <Animated.ScrollView
      refreshControl={refreshControl}
      // contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{}}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: "yellow",
      }}
    >
      <OneViewContent route={route} />
    </Animated.ScrollView>
  );
}
