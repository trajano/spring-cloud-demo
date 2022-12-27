import { formatISO } from "date-fns";
import { Animated } from "react-native";

import { useApp } from "../../src/app-context";
import { Text, View } from "../../src/lib/native-unstyled";

export function StackNavigatorScrollViewScreen() {
  const { lastAuthEvents } = useApp();
  return (
    <Animated.ScrollView contentInsetAdjustmentBehavior="automatic">
      {lastAuthEvents.map((event) => {
        const { type, reason } = event;
        return (
          <View key={event.key}>
            <Text>
              <Text fontWeight="bold">{type}</Text>{" "}
              {formatISO(event.on, { representation: "time" })}
            </Text>
            <Text>{reason}</Text>
          </View>
        );
      })}
    </Animated.ScrollView>
  );
}
