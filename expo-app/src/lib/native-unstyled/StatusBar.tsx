import { StatusBar as ExpoStatusBar, StatusBarProps } from "expo-status-bar";
import type { ReactElement } from "react";

import { useTheming } from "./ThemeContext";
/**
 * This wraps the existing React Native StatusBar so that it is aware of the current color scheme of the app.
 */
export function StatusBar(props: StatusBarProps): ReactElement<any, any> {
  const { colorScheme } = useTheming();
  return (
    <ExpoStatusBar
      style={colorScheme === "dark" ? "light" : "dark"}
      {...props}
    />
  );
}
