import { Route, useRoute } from "@react-navigation/native";
import { StackHeaderProps } from "@react-navigation/stack";
import { useAsyncSetEffect, useDeepState } from "@trajano/react-hooks";
import Constants from "expo-constants";
import { DeviceType, getDeviceTypeAsync } from "expo-device";
import noop from "lodash/noop";
import {
  cloneElement,
  createContext,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControlProps,
  ScrollView,
  ScrollViewProps,
  StatusBar,
  ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface HeaderDxRouteState {
  positionY: Animated.Value;
  scrollView: ScrollView | null;
  finalPositionY: number;
  layout: StackHeaderProps["layout"];
}
/**
 * Keeps track of the position and the scroll view reference for each route.
 */
interface HeaderDxState {
  forRoute(route: Route<string>): HeaderDxRouteState;
  forRouteForHeader(
    route: Route<string>,
    layout: StackHeaderProps["layout"]
  ): HeaderDxRouteState;
  updateRoute(
    route: Route<string>,
    positionY: number,
    scrollViewRef: RefObject<ScrollView>
  ): HeaderDxRouteState;
  deviceType: DeviceType;
}
const HeaderDxContext = createContext<HeaderDxState>({
  forRoute: () => ({
    positionY: new Animated.Value(0),
    scrollView: null,
    finalPositionY: 0,
    layout: { width: 0, height: 0 },
  }),
  forRouteForHeader: () => ({
    positionY: new Animated.Value(0),
    scrollView: null,
    finalPositionY: 0,
    layout: { width: 0, height: 0 },
  }),
  updateRoute: () => ({
    positionY: new Animated.Value(0),
    scrollView: null,
    finalPositionY: 0,
    layout: { width: 0, height: 0 },
  }),
  deviceType: DeviceType.UNKNOWN,
});
export function HeaderDxProvider({
  children,
  initialRouteStates = {},
  onRouteUpdate = noop,
}: PropsWithChildren<{
  initialRouteStates?: Record<string, HeaderDxRouteState>;
  /**
   * triggered when the route data has been updated.  Can be used to save
   * @param routeKey
   * @param state
   * @returns
   */
  onRouteUpdate?: (routeKey: string, state: HeaderDxState) => void;
}>) {
  const [deviceType, setDeviceType] = useState(DeviceType.UNKNOWN);
  useAsyncSetEffect(getDeviceTypeAsync, setDeviceType, []);

  const [routes, setRoutes] =
    useDeepState<Record<string, HeaderDxRouteState>>(initialRouteStates);
  const updateRouteState = useCallback(
    (routeKey: string, next: Partial<HeaderDxRouteState>) => {
      setRoutes({
        ...routes,
        [routeKey]: { ...routes[routeKey], ...next },
      });
      return { ...routes[routeKey], ...next };
    },
    [routes, setRoutes]
  );
  const forRoute = useCallback(
    (route: Route<string>) =>
      routes[route.key] ?? {
        positionY: new Animated.Value(0),
        scrollView: null,
        finalPositionY: 0,
        layout: { width: 0, height: 0 },
      },
    [routes]
  );
  const forRouteForHeader = useCallback(
    (route: Route<string>, layout: StackHeaderProps["layout"]) => {
      if (!routes[route.key]) {
        return updateRouteState(route.key, {
          positionY: new Animated.Value(0),
          scrollView: null,
          finalPositionY: 0,
          layout,
        });
      } else {
        return updateRouteState(route.key, {
          layout,
        });
      }
    },
    [routes]
  );
  const updateRoute = useCallback(
    (
      route: Route<string>,
      finalPositionY: number,
      scrollViewRef: RefObject<ScrollView>
    ) => {
      console.log({ saving: finalPositionY });
      return updateRouteState(route.key, {
        finalPositionY,
        scrollView: scrollViewRef.current,
      });
    },
    [routes]
  );
  const contextValue = useMemo(
    () => ({
      forRoute,
      forRouteForHeader,
      updateRoute,
      deviceType,
    }),
    [forRoute, forRouteForHeader, updateRoute, deviceType]
  );
  return (
    <HeaderDxContext.Provider value={contextValue}>
      {children}
    </HeaderDxContext.Provider>
  );
}
interface HeaderScrollViewProps {
  /**
   * This will be fired to update the positions.
   */
  onScroll:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * This will be handling the "snap back"
   */
  onScrollEndDrag:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;
  containerPaddingTop: number;
  scrollIndicatorInsetTop: number;
}
interface AnimatedHeaderScrollViewProps {
  /**
   * This will be fired to update the positions.
   */
  onScroll:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;

  /**
   * This will be handling the "snap back"
   */
  onScrollEndDrag:
    | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
    | undefined;
  containerPaddingTop: Animated.Value;
  scrollIndicatorInsetTop: Animated.Value;
}

export function useHeaderDxContext() {
  return useContext(HeaderDxContext);
}

type HeaderDxScrollViewContentContainerStyle = Omit<
  Animated.AnimatedProps<ScrollViewProps>["contentContainerStyle"],
  "paddingTop" | "width" | "height"
>;
type HeaderDxScrollViewModifiableProps = Omit<
  Animated.AnimatedProps<ScrollViewProps>,
  "contentContainerStyle"
> & { contentContainerStyle?: HeaderDxScrollViewContentContainerStyle };

export function useHeaderDx(
  scrollViewRef: RefObject<ScrollView>,
  {
    refreshControl: inRefreshControl,
    contentContainerStyle: inContentContainerStyle = {},
    style: inStyle,
  }: HeaderDxScrollViewModifiableProps
): Pick<
  Animated.AnimatedProps<ScrollViewProps>,
  | "onScroll"
  | "onScrollEndDrag"
  | "scrollEventThrottle"
  | "refreshControl"
  | "contentContainerStyle"
  | "style"
> {
  const route = useRoute();
  const { forRoute, updateRoute } = useContext(HeaderDxContext);
  const { positionY, scrollView, finalPositionY, layout } = forRoute(route);
  const onScroll = useCallback(
    Animated.event(
      [
        {
          nativeEvent: {
            contentOffset: {
              y: positionY,
            },
          },
        },
      ],
      { useNativeDriver: true }
    ),
    [positionY]
  );
  const onScrollEndDrag = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      /*
       * updateRoute(route, event.nativeEvent.contentOffset.y, scrollViewRef);
       * snap back
       */
    },
    []
  );
  const { top: safeAreaInsetTop } = useSafeAreaInsets();
  const largeHeaderHeight = safeAreaInsetTop;
  const contentContainerStylePaddingTop = largeHeaderHeight;
  const contentContainerStyle = useMemo<
    Animated.AnimatedProps<ScrollViewProps>["contentContainerStyle"]
  >(
    () => [
      inContentContainerStyle,
      {
        paddingTop: contentContainerStylePaddingTop,
        width: layout.width ?? 0,
        height: layout.height ?? 0,
      },
    ],
    [inContentContainerStyle, contentContainerStylePaddingTop]
  );

  const refreshControl:
    | Animated.WithAnimatedObject<ReactElement<RefreshControlProps>>
    | undefined = inRefreshControl;
  /*
   * if (inRefreshControl) {
   *   refreshControl = cloneElement<
   *     Animated.WithAnimatedObject<ReactElement<RefreshControlProps>>
   *   >(inRefreshControl, {
   *     ...inRefreshControl.props,
   *     // progressViewOffset: -60,
   *     style: {
   *       position: "absolute",
   *       backgroundColor: "#101090",
   *     },
   *   });
   * }
   * useEffect(() => {
   *   // scrollView?.scrollTo({ y: finalPositionY, animated: false });
   * }, [finalPositionY, scrollView]);
   */
  console.log("hook rendering");
  return {
    onScroll,
    onScrollEndDrag,
    contentContainerStyle,
    style: [
      inStyle,
      {
        position: "absolute",
        /*
         * top: -150,
         * left: 0,
         * backgroundColor: "silver",
         */
        width: layout.width,
        // height: layout.height,
        transform: [
          {
            translateY: -50,
          },
        ],
      },
    ],
    scrollEventThrottle: 16,
    refreshControl,
  };
}

/*
 * on iPad header height is 50
 * https://github.com/software-mansion/react-native-screens/blob/86864da31a1d9c180f95239a02220cf07af7979a/src/native-stack/utils/getDefaultHeaderHeight.tsx#L25
 * https://www.learnui.design/blog/ios-font-size-guidelines.html
 */

/*
 * basically we have the following zones
 * refresh control area
 * status area
 * header area
 *   - collapsed or can be empty space when large header is on.
 *   - large header area (optional)
 * search area
 */

/*
 * Also because I can't pass additional props to the navigator creation https://react-navigation.canny.io/feature-requests/p/allow-passing-custom-stackoptions-to-createstacknavigator
 * The distinction between large and small header would have to be done through different classes.
 */
