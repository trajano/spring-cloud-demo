import { Platform, UIManager } from "react-native";


// This is needed for LayoutAnimation https://reactnative.dev/docs/layoutanimation
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}
