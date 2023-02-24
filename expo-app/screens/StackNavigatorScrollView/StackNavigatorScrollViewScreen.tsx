import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/core";
import { AuthState } from "@trajano/spring-docker-auth-context";
import { format } from "date-fns";
import { useCallback } from "react";
import { Animated } from "react-native";

import { useAppLog } from "../../src/lib/app-log";
import { LoggedAuthEvent } from "../../src/lib/app-log/LoggedAuthEvent";
import { Text, useRefreshControl, View } from "../../src/lib/native-unstyled";

export function StackNavigatorScrollViewScreen() {
  const { loggedEvents, clearLog, updateLog } = useAppLog();
  const refreshControl = useRefreshControl(() => {
    clearLog();
  });

  useFocusEffect(
    useCallback(() => {
      updateLog();
    }, [updateLog])
  );
  return (
    <Animated.ScrollView
      refreshControl={refreshControl}
      contentInsetAdjustmentBehavior="automatic"
    >
      {loggedEvents.map(
        ({ on, authState, type, reason }: LoggedAuthEvent, index) => (
          <View
            key={`.${index}` /* NOSONAR */}
            borderBottomColor="silver"
            borderBottomWidth={1}
            paddingTop={index === 0 ? 0 : 16}
            paddingBottom={16}
          >
            <View flexDirection="row" alignContent="center">
              <Text fontSize={16}>{format(on, "HH:mm:ss")}</Text>
              <Text fontSize={16}>{authState ? AuthState[authState] : ""}</Text>
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
