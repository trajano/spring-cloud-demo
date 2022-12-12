import type { ExpoConfig } from "@expo/config";
export default ({ config }: { config: ExpoConfig }): ExpoConfig => {
  return {
    ...config,
    name: process.env.APP_NAME ?? config.name,
    icon: process.env.APP_ICON ?? config.icon,
    jsEngine: process.env.JS_ENGINE as ExpoConfig["jsEngine"],
    ios: {
      ...config.ios,
      bundleIdentifier: process.env.BUNDLE_ID ?? config.ios?.bundleIdentifier,
    },
    android: {
      ...config.android,
      package: process.env.BUNDLE_ID ?? config.android?.package,
    },
  };
};
