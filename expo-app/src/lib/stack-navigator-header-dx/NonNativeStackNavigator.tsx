import {
  DefaultNavigatorOptions,
  EventMapBase,
  NavigationState,
  ParamListBase,
  StackRouter,
  useNavigationBuilder,
} from "@react-navigation/native";

import { NonNativeStackView } from "./NonNativeStackView";

type NonNativeStackNavigatorProps = DefaultNavigatorOptions<
  ParamListBase,
  NavigationState,
  object,
  EventMapBase
>;
export function NonNativeStackNavigator({
  id,
  initialRouteName,
  children,
  screenListeners,
  screenOptions,
  defaultScreenOptions: _defaultScreenOptions,
  ...rest
}: NonNativeStackNavigatorProps) {
  const { state, descriptors, navigation } = useNavigationBuilder(StackRouter, {
    id,
    initialRouteName,
    children,
    screenListeners,
    screenOptions,
  });
  return (
    <NonNativeStackView
      {...rest}
      state={state}
      descriptors={descriptors}
      navigation={navigation}
    />
  );
}
