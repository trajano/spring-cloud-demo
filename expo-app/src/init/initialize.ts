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

global.Promise = require("promise");

require("promise/lib/rejection-tracking").enable({
  allRejections: true,
  onUnhandled: (id: number, error: unknown) => {
    if (typeof error === "object" && error instanceof Error) {
      // not bothering with the stack because it's useless.
      console.error({
        name: error.name,
        message: error.message,
        cause: error.cause,
      });
    } else {
      console.error(
        id,
        error,
        typeof error === "object",
        error instanceof Error
      );
    }
  },
});
