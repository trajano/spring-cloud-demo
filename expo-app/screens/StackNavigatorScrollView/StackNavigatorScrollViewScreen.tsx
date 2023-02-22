import { FontAwesome } from "@expo/vector-icons";
import { AuthState } from "@trajano/spring-docker-auth-context";
import { formatISO } from "date-fns";
import { Animated } from "react-native";

import { useApp } from "../../src/app-context";
import { LoggedAuthEvent } from "../../src/app-context/LoggedAuthEvent";
import { Text, View } from "../../src/lib/native-unstyled";

export function StackNavigatorScrollViewScreen() {
  const { lastAuthEvents } = useApp();
  return (
    <Animated.ScrollView contentInsetAdjustmentBehavior="automatic">
      {lastAuthEvents.map(
        ({ key, on, authState, type, reason }: LoggedAuthEvent) => (
          <View key={key}>
            <Text>{AuthState[authState]}</Text>
            <FontAwesome name="arrow-circle-right" />
            <Text fontWeight="bold">{type}</Text>{" "}
            <Text>{formatISO(on, { representation: "time" })}</Text>
            <Text>{reason}</Text>
          </View>
        )
      )}
    </Animated.ScrollView>
  );
}
