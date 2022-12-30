import {
  useNavigation,
  useNavigationBuilder,
  useNavigationContainerRef,
  useNavigationState,
  useTheme as useNavigationTheme,
} from "@react-navigation/native";
import { StackHeaderProps } from "@react-navigation/stack";
import { BlurView } from "expo-blur";
import { ReactElement } from "react";
import { View } from "react-native";

export function HeaderDx({
  navigation,
  route,
  options,
  layout,
  progress,
  back,
  styleInterpolator,
}: StackHeaderProps): ReactElement<StackHeaderProps> {
  const x = {
    back: undefined,
    layout: { height: 603, width: 375 },
    options: {
      animationEnabled: true,
      cardOverlayEnabled: false,
      cardStyleInterpolator: ["Function forHorizontalIOS"],
      gestureDirection: "horizontal",
      gestureEnabled: true,
      header: ["Function LoggingHeader"],
      headerMode: "screen",
      headerShown: true,
      headerStyleInterpolator: ["Function forFade"],
      headerTransparent: false,
      keyboardHandlingEnabled: undefined,
      presentation: undefined,
      transitionSpec: {
        close: ["Object"],
        open: ["Object"],
      },
    },
    progress: { current: 1, next: 0, previous: undefined },
    route: {
      key: "TabOneScreen--6hl2DIr8BF719NvYtH1b",
      name: "TabOneScreen",
      params: undefined,
    },
    styleInterpolator: ["Function forNoAnimation"],
  };
  const y = {
    back: { title: "TabOneScreen" },
    layout: { height: 603, width: 375 },
    options: {
      animationEnabled: true,
      cardOverlayEnabled: false,
      cardStyleInterpolator: ["Function forHorizontalIOS"],
      gestureDirection: "horizontal",
      gestureEnabled: true,
      header: ["Function LoggingHeader"],
      headerMode: "screen",
      headerShown: true,
      headerStyleInterpolator: ["Function forFade"],
      headerTransparent: false,
      keyboardHandlingEnabled: undefined,
      presentation: undefined,
      title: "One View",
      transitionSpec: { close: ["Object"], open: ["Object"] },
    },
    progress: { current: 0, next: undefined, previous: 1 },
    route: {
      key: "OneView-Tvqcf7IDhd4ZXPyvyaD4v",
      name: "OneView",
      params: { height: 603, width: 375, x: 0, y: 0 },
      path: undefined,
    },
    styleInterpolator: ["Function forNoAnimation"], // if using screen
  };

  const z = {
    back: { title: "TabOneScreen" },
    layout: { height: 539, width: 375 }, // hmm why is this smaller? because it's header is not transparent.
    options: {
      animationEnabled: true,
      cardOverlayEnabled: false,
      cardStyleInterpolator: ["Function forHorizontalIOS"],
      gestureDirection: "horizontal",
      gestureEnabled: true,
      header: ["Function LoggingHeader"],
      headerMode: "float",
      headerShown: true,
      headerStyleInterpolator: ["Function forFade"],
      headerTransparent: false,
      keyboardHandlingEnabled: undefined,
      presentation: undefined,
      title: "One View",
      transitionSpec: {
        close: ["Object"],
        open: ["Object"],
      },
    },
    progress: { current: 0, next: undefined, previous: 1 },
    route: {
      key: "OneView-U0eGIu1BzaEWnvSDNog0C",
      name: "OneView",
      params: { height: 603, width: 375, x: 0, y: 0 },
      path: undefined,
    },
    styleInterpolator: ["Function forFade"], // if using float
  };

  // useNavigationTheme ().colors.card
  // this will depend on whether the large header is shown or not
  // progress?

  // so how does the header know where the scroll view is?

  const intensity = 0.5;
  return <BlurView intensity={intensity} />;
}
