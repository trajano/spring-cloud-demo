import { ParamListBase, StackNavigationState } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { View, ViewProps } from "react-native";
export function NonNativeStackView<T extends ParamListBase>({
  state,
  navigation,
  descriptors,
  ...rest
}: ViewProps & {
  state: StackNavigationState<T>;
  navigation: StackNavigationProp<T>;
  descriptors: Record<string, unknown>;
}) {
  return <View {...rest} />;
}
