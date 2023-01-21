import {
  DefaultNavigatorOptions,
  DefaultRouterOptions,
  EventMapBase,
  NavigationState,
  ParamListBase,
  StackNavigationState,
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
  screenOptions: _defaultScreenOptions,
  ...rest
}: NonNativeStackNavigatorProps) {
  const { state, descriptors, navigation } = useNavigationBuilder<
    StackNavigationState<ParamListBase>,
    DefaultRouterOptions,
    Record<string, () => void>,
    object,
    Record<string, any>
  >(StackRouter, {
    id,
    initialRouteName,
    children,
    screenListeners,
    screenOptions: _defaultScreenOptions,
  });
  return (
    <NonNativeStackView
      {...rest}
      state={state}
      descriptors={descriptors}
      navigation={navigation as any}
    />
  );
}
