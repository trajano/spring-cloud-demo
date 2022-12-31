import { useCallback } from "react";
import { Alert as RNAlert, AlertButton, AlertOptions } from "react-native";

import { useTheming } from "./ThemeContext";

export function useAlert(): RNAlert {
  const { colorScheme } = useTheming();
  const alert = useCallback(
    (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      options?: AlertOptions
    ): void => {
      const newOptions = {
        userInterfaceStyle: options?.userInterfaceStyle ?? colorScheme,
        ...options,
      };
      RNAlert.alert(title, message, buttons, newOptions);
    },
    [colorScheme]
  );
  return { alert, prompt: RNAlert.prompt };
}
