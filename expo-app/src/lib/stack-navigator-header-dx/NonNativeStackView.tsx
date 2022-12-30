import { ParamListBase, StackNavigationState } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { View, ViewProps } from "react-native";
export function NonNativeStackView({
  state,
  navigation,
  descriptors,
  ...rest
}: ViewProps & {
  state: StackNavigationState<ParamListBase>;
  navigation: StackNavigationProp<ParamListBase>;
  descriptors: Record<string, unknown>;
}) {
  return <View {...rest} />;
}
