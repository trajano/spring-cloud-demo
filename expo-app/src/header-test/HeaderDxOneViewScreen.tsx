import type { StackScreenProps } from "@react-navigation/stack";
import { createRef } from "react";
import {
  Animated,
  ScrollView as RNScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

import { HeaderDxStackParamList } from "./HeaderDxStackNavigation";
import { OneViewContent } from "./OneViewContent";
import { useRefreshControl } from "../lib/native-unstyled";
import { useHeaderDx } from "../lib/stack-navigator-header-dx/HeaderDxContext";

export function HeaderDxOneViewScreen({
  navigation,
  route,
}: StackScreenProps<HeaderDxStackParamList>) {
  const scrollViewRef = createRef<RNScrollView>();
  const refreshControl = useRefreshControl(
    async () => new Promise((resolve) => setTimeout(resolve, 2000))
  );

  const { width: windowWidth } = useWindowDimensions();

  const scrollViewProps = useHeaderDx(scrollViewRef, {
    refreshControl,
    contentContainerStyle: {},
    style: {
      flex: 1,
      borderWidth: 1,
      borderColor: "yellow",
    },
  });
  console.log({
    scrollViewProps,
    style: StyleSheet.flatten(scrollViewProps.style),
  });
  return (
    <Animated.ScrollView
      {...scrollViewProps}
      contentInsetAdjustmentBehavior="never"
      ref={scrollViewRef}
    >
      <OneViewContent route={route} />
    </Animated.ScrollView>
  );
}
