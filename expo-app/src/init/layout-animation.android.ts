import { Platform, UIManager } from "react-native";

// This is needed for LayoutAnimation https://reactnative.dev/docs/layoutanimation
if (Platform.OS === "android") {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
