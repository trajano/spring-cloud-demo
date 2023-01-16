import Constants from "expo-constants";
import { startNetworkLogging } from "react-native-network-logger";

const ignoredPatterns: RegExp[] = [];
if (__DEV__) {
  try {
    const launchHostUrlString = Constants.manifest2?.launchAsset.url;
    if (launchHostUrlString) {
      ignoredPatterns.push(/^\w+ ${launchHostUrlString}/, /^HEAD .*/);
    }
  } catch (e: unknown) {
    console.warn(e);
  }
}
startNetworkLogging({ ignoredPatterns });
