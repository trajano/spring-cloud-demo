import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Animated } from "react-native";

import { useRefreshControl } from "../lib/native-unstyled";
import { NativeStackParamList } from "./NativeStackNavigation";
import { OneViewContent } from "./OneViewContent";

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
