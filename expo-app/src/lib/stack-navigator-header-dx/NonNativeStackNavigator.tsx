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
import { StackNavigationProp } from "@react-navigation/stack";

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
    const { state, descriptors, navigation } = useNavigationBuilder<StackNavigationState<ParamListBase>, DefaultRouterOptions, Record<string, () => void>, {}, Record<string, any>>(StackRouter, {
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
            navigation={navigation as any}
        />
    );
}
