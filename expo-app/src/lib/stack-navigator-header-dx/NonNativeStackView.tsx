import { NavigationProp, ParamListBase } from "@react-navigation/native";
import { View, ViewProps } from "react-native";
export function NonNativeStackView({
  state,
  navigation,
  descriptors,
  ...rest
}: ViewProps & {
  state: ParamListBase;
  navigation: NavigationProp<ParamListBase>;
  descriptors: Record<string, unknown>;
}) {
  return <View {...rest} />;
}
