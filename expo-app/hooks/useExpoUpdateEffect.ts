import { useEffect } from "react";
import {
  UpdateEventType,
  UpdateEvent,
  addListener,
  reloadAsync,
} from "expo-updates";
import { Alert } from "react-native";

/**
 * This subscribes to Expo Update notifications and alerts the user when there's a new update.
 * This is not available on "development mode"
 */
export function useExpoUpdateEffect() {
  // TODO usei18n
  async function checkForUpdate(event: UpdateEvent) {
    if (event.type === UpdateEventType.UPDATE_AVAILABLE) {
      Alert.alert(
        "Update available",
        "An update has been downloaded and ready for use.",
        [
          {
            text: "Later",
            style: "cancel",
          },
          {
            text: "Reload",
            onPress: async () => {
              await reloadAsync();
            },
          },
        ]
      );
    }
  }

  useEffect(() => {
    if (!__DEV__) {
      const sub = addListener(checkForUpdate);
      return () => sub.remove();
    }
  }, []);
}
