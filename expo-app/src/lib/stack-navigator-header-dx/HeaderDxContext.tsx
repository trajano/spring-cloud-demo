import { Route, useRoute } from "@react-navigation/native";
import Constants from 'expo-constants'
import { StackHeaderProps } from "@react-navigation/stack";
import { useDeepState } from "@trajano/react-hooks";
import noop from "lodash/noop";
import {
  createContext,
  PropsWithChildren,
  RefObject,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  ScrollViewProps,
  StatusBar,
  ViewProps,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type HeaderDxRouteState = {
  positionY: Animated.Value;
  scrollView: ScrollView | null;
  finalPositionY: number;
  layout: StackHeaderProps['layout']
};
/**
 * Keeps track of the position and the scroll view reference for each route.
 */
type HeaderDxState = {
  forRoute(route: Route<string>): HeaderDxRouteState;
  forRouteForHeader(
    route: Route<string>,
    layout: StackHeaderProps['layout']
  ): HeaderDxRouteState;
  updateRoute(
    route: Route<string>,
    positionY: number,
    scrollViewRef: RefObject<ScrollView>
  ): HeaderDxRouteState;
};
const HeaderDxContext = createContext<HeaderDxState>({
  forRoute: () => ({
    positionY: new Animated.Value(0),
    scrollView: null,
    finalPositionY: 0,
    layout: { width: 0, height: 0 }
  }),
  forRouteForHeader: () => ({
    positionY: new Animated.Value(0),
    scrollView: null,
    finalPositionY: 0,
    layout: { width: 0, height: 0 }
  }),
  updateRoute: () => ({
    positionY: new Animated.Value(0),
    scrollView: null,
    finalPositionY: 0,
    layout: { width: 0, height: 0 }
  }),
});
export function HeaderDxProvider({
  children,
  initialRouteStates = {},
  onRouteUpdate = noop,
}: PropsWithChildren<{
  initialRouteStates?: { [routeKey: string]: HeaderDxRouteState };
  /**
   * triggered when the route data has been updated.  Can be used to save
   * @param routeKey
   * @param state
   * @returns
   */
  onRouteUpdate?: (routeKey: string, state: HeaderDxState) => void;
}>) {

  const [routes, setRoutes] = useDeepState<{ [routeKey: string]: HeaderDxRouteState }>(
    initialRouteStates
  );
  const updateRouteState = useCallback((routeKey: string, next: Partial<HeaderDxRouteState>) => {
    setRoutes({
      ...routes,
      [routeKey]: { ...routes[routeKey], ...next }
    })
    return { ...routes[routeKey], ...next };
  }, [routes, setRoutes])
  const forRoute = useCallback(
    (route: Route<string>) =>
      routes[route.key] ?? {
        positionY: new Animated.Value(0),
        scrollView: null,
        finalPositionY: 0,
        layout: { width: 0, height: 0 }
      },
    [routes]
  );
  const forRouteForHeader = useCallback(
    (route: Route<string>, layout: StackHeaderProps['layout']) => {
      if (!routes[route.key]) {
        return updateRouteState(route.key, {
          positionY: new Animated.Value(0),
          scrollView: null,
          finalPositionY: 0,
          layout
        })
      } else {
        return updateRouteState(route.key, {
          layout: layout
        })
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
        finalPositionY: finalPositionY,
        scrollView: scrollViewRef.current
      })
    },
    [routes]
  );
  const contextValue = useMemo(
    () => ({
      forRoute,
      forRouteForHeader,
      updateRoute,
    }),
    [forRoute, forRouteForHeader, updateRoute]
  );
  return (
    <HeaderDxContext.Provider value={contextValue}>
      {children}
    </HeaderDxContext.Provider>
  );
}
type HeaderScrollViewProps = {
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
};
type AnimatedHeaderScrollViewProps = {
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
};

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
> & { contentContainerStyle: HeaderDxScrollViewContentContainerStyle };

export function useHeaderDx(
  scrollViewRef: RefObject<ScrollView>,
  {
    refreshControl,
    contentContainerStyle: inContentContainerStyle = {},
  }: HeaderDxScrollViewModifiableProps
): Pick<
  Animated.AnimatedProps<ScrollViewProps>,
  | "onScroll"
  | "onScrollEndDrag"
  | "scrollEventThrottle"
  | "refreshControl"
  | "contentContainerStyle"
> {
  const route = useRoute();
  const { forRoute, updateRoute } = useContext(HeaderDxContext);
  const { positionY, scrollView, finalPositionY, layout } = forRoute(
    route,
  );
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
      //updateRoute(route, event.nativeEvent.contentOffset.y, scrollViewRef);
      // snap back
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
        // width: layout?.width ?? 0,
        // height: layout?.height ?? 0
      }
    ],
    [inContentContainerStyle, contentContainerStylePaddingTop]
  );

  // useEffect(() => {
  //   // scrollView?.scrollTo({ y: finalPositionY, animated: false });
  // }, [finalPositionY, scrollView]);
  console.log("hook rendering")
  return {
    onScroll,
    onScrollEndDrag,
    contentContainerStyle,
    scrollEventThrottle: 16,
    refreshControl,
  };
}
