import Constants from 'expo-constants'
import { StatusBar } from 'react-native'
import {
  EventArg,
  useNavigation,
  useNavigationBuilder,
  useNavigationContainerRef,
  useNavigationState,
  useTheme as useNavigationTheme,
} from "@react-navigation/native";
import { StackHeaderProps } from "@react-navigation/stack";
import { BlurView } from "expo-blur";
import { ReactElement, useEffect, useCallback } from "react";
import { Animated, LayoutChangeEvent, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHeaderDxContext } from "./HeaderDxContext";
const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);
export function HeaderDx({
  navigation,
  route,
  options,
  layout,
  progress,
  back,
  styleInterpolator,
}: StackHeaderProps): ReactElement<StackHeaderProps> {
  const { top: safeAreaInsetTop } = useSafeAreaInsets();
  const navigationTheme = useNavigationTheme();
  const { forRoute, forRouteForHeader } = useHeaderDxContext();
  // // useNavigationTheme ().colors.card
  // // this will depend on whether the large header is shown or not
  // // progress?

  // // so how does the header know where the scroll view is?

  // useEffect(() => {
  //   function listener(ev: EventArg<"focus", boolean, undefined>) {
  //     // do something?
  //   }
  //   navigation.addListener("focus", listener);
  //   return () => navigation.removeListener("focus", listener);
  // }, [navigation])

  const title = options.title ?? route.name;
  const trans = options.headerTransparent;
  const blur = options.headerBackground;
  // const scrollPositionY = new Animated.Value(0);
  // const intensity = 1.5;
  // const paddingTop = Animated.add(scrollPositionY, safeAreaInsetTop);

  // return <Animated.View style={{ paddingTop, backgroundColor: navigationTheme.colors.card, height: 30, zIndex: -200 }}><Text style={{
  //   color: navigationTheme.colors.text, fontSize: 30
  // }}>{title}adfZZZZ</Text></Animated.View>

  const { positionY } = forRoute(route);
  const translateY = Animated.multiply(positionY, -1);
  // content is rendered first
  // starts with full screen layout
  // then header is layouted
  // then renders with layout less the tab area height (header height is still there)
  console.log({ "header": "rendering", layout, options, route })

  const onLayout = useCallback(({ nativeEvent }: LayoutChangeEvent) => {
    console.log({ "header": "layouted", nativeEvent })
    forRouteForHeader(route, layout)

  }, [])

  return (
    <View style={{ height: 96, borderWidth: 0, borderColor: "pink" }} onLayout={onLayout}>
      <Animated.View
        style={{
          position: "absolute",
          flex: 1,
          transform: [
            { translateY }
          ],
          paddingTop: safeAreaInsetTop,
          backgroundColor: "transparent",
          borderWidth: 0,
          borderColor: 'blue',
          height: 96 + safeAreaInsetTop,
          width: layout.width,
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingBottom: 7,
        }}
      >
        <Text
          style={{
            color: navigationTheme.colors.text,
            fontSize: 25,
            fontWeight: "bold"
          }}
        >
          {title}
        </Text>
      </Animated.View>
    </View>
  );
}

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
