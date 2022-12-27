import { ColorSchemeName, ViewProps } from "react-native";

export type LoadingComponentProps = ViewProps & {
  totalAssets: number;
  loadedAssets: number;
  /**
   * This function is called to allow the loading component to specify additional resources that it would know about.
   * For example, the loading component would be able to check the value of Auth context to determine if it is
   * in a stable state to remove the loading screen already.
   */
  additionalResourceUpdate: (loaded: number, total: number) => void;
};
