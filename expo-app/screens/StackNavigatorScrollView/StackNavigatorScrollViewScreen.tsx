import { FontAwesome } from "@expo/vector-icons";
import { AuthState } from "@trajano/spring-docker-auth-context";
import { format } from "date-fns";
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
          <View key={key} borderBottomColor="silver" borderBottomWidth={1}>
            <View flexDirection="row">
              <Text fontSize={16}>{format(on, "HH:mm:ss")}</Text>
              <Text fontSize={16}>{AuthState[authState]}</Text>
              <FontAwesome name="arrow-circle-right" color="#ffffff" />
              <Text fontSize={16}>{type}</Text>
            </View>
            <Text>{reason}</Text>
          </View>
        )
      )}
    </Animated.ScrollView>
  );
}
