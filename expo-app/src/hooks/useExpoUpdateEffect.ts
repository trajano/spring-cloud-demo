import {
  addListener,
  reloadAsync,
  UpdateEvent,
  UpdateEventType,
} from "expo-updates";
import { useCallback, useEffect } from "react";

import { useAlert } from "../lib/native-unstyled";

/**
 * This subscribes to Expo Update notifications and alerts the user when there's a new update.
 * This is not available on "development mode"
 */
export function useExpoUpdateEffect() {
  const { alert } = useAlert();
  const checkForUpdate = useCallback(
    async (event: UpdateEvent) => {
      if (event.type === UpdateEventType.UPDATE_AVAILABLE) {
        alert(
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
    },
    [alert]
  );

  useEffect(() => {
    const sub = addListener(checkForUpdate);
    return () => sub.remove();
  }, [checkForUpdate]);
}
