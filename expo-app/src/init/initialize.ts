import { Platform, UIManager } from "react-native";
import "react-native-gesture-handler";
// global.Buffer = require("buffer").Buffer;
// import { polyfillWebCrypto } from "expo-standard-web-crypto";
// polyfillWebCrypto();
// const TextEncodingPolyfill = require("text-encoding");

// Object.assign(global, {
//   TextEncoder: TextEncodingPolyfill.TextEncoder,
//   TextDecoder: TextEncodingPolyfill.TextDecoder,
// });
import { startNetworkLogging } from "react-native-network-logger";

// This is needed for LayoutAnimation https://reactnative.dev/docs/layoutanimation
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

startNetworkLogging();
