import type { StackScreenProps } from "@react-navigation/stack";
import { createRef } from "react";
import { useWindowDimensions, Animated, ScrollView as RNScrollView } from "react-native";

import { useRefreshControl } from "../lib/native-unstyled";
import { useHeaderDx } from "../lib/stack-navigator-header-dx/HeaderDxContext";
import { HeaderDxStackParamList } from "./HeaderDxStackNavigation";
import { OneViewContent } from "./OneViewContent";

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
    contentContainerStyle: {
      width: windowWidth,
    },
  });
  console.log({ scrollViewProps })
  return (
    <Animated.ScrollView
      {...scrollViewProps}
      ref={scrollViewRef}
      style={{
        flex: 1,
        borderWidth: 1,
        borderColor: "yellow",
      }}
    >
      <OneViewContent route={route} />
    </Animated.ScrollView>
  );
}
