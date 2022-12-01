import type { ExpoConfig } from "@expo/config";
export default ({ config, ...rest }: { config: ExpoConfig }) => {
  console.log(rest);
  return {
    ...config,
  };
};
