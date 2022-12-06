import type { ExpoConfig } from "@expo/config";
export default ({ config }: { config: ExpoConfig }) => {
  return {
    ...config,
    name: process.env.APP_NAME ?? config.name,
    ios: {
      bundleIdentifier: process.env.BUNDLE_ID ?? config.ios?.bundleIdentifier,
    },
    android: {
      package: process.env.BUNDLE_ID ?? config.android?.package,
    },
  };
};
