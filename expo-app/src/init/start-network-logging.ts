import Constants from "expo-constants";
import { startNetworkLogging } from "react-native-network-logger";

let ignoredHosts: string[] = [];
if (__DEV__) {
  try {
    const launchHostUrlString = Constants.manifest2?.launchAsset?.url;
    if (launchHostUrlString) {
      const r =
        /^(([^:/?#]+):)?(\/\/([^/?#]*))?([^?#]*)(\?([^#]*))?(#(.*))?/.exec(
          launchHostUrlString
        );
      if (r && r[4] && r[4].split(":")[0]) {
        ignoredHosts = [r[4].split(":")[0]];
      }
    }
  } catch (e: unknown) {
    console.warn(e);
  }
}
startNetworkLogging({ ignoredHosts });
