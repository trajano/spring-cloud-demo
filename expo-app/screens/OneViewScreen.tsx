import { useHeaderHeight } from "@react-navigation/elements";
import type { StackScreenProps } from "@react-navigation/stack";
import { createRef, useCallback, useState } from "react";
import {
  Animated,
  Button,
  LayoutRectangle,
  ScrollView as RNScrollView,
} from "react-native";

import type { MainDrawerTabOneParamList } from "../navigation/paramLists";
import { Text, useRefreshControl } from "../src/lib/native-unstyled";
import { useHeaderDx } from "../src/lib/stack-navigator-header-dx/HeaderDxContext";

export function OneViewTransparentHeader({
  navigation,
  route,
}: StackScreenProps<MainDrawerTabOneParamList, "OneViewTransparentHeader">) {
  const headerHeight = useHeaderHeight();
  const rect: LayoutRectangle = route.params ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  };
  const [fill, setFill] = useState("");
  const scrollViewRef = createRef<RNScrollView>();
  const refreshControl = useRefreshControl(
    async () => new Promise((resolve) => setTimeout(resolve, 2000))
  );
  const scrollViewProps = useHeaderDx(scrollViewRef, {
    refreshControl,
  });
  const toggleFill = useCallback(() => {
    if (fill.length === 0) {
      setFill(`
 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla hendrerit justo risus, vel dapibus metus tincidunt sed. Integer tellus nibh, gravida ut vulputate rhoncus, lobortis sit amet erat. Proin vel vulputate ex, non cursus sapien. Vivamus gravida sollicitudin congue. Vestibulum scelerisque tincidunt suscipit. Sed aliquet mattis nunc, vel vehicula massa tristique ut. In quis sem sed nulla faucibus ornare in vitae felis.

Etiam odio orci, blandit a semper sit amet, placerat at dui. Integer iaculis, felis ac facilisis iaculis, tortor orci feugiat elit, ac volutpat metus dui ut est. Duis consequat velit ut ligula hendrerit, luctus fringilla nisi cursus. Etiam interdum dui quis eleifend ultrices. Donec consectetur, nunc in laoreet aliquam, felis lacus euismod libero, ac accumsan risus mi ac justo. Etiam eget augue nisi. Donec nec laoreet nisi, nec fringilla ante. Pellentesque vel condimentum odio. Vivamus vulputate metus a eros euismod placerat. Mauris eget mattis magna. Donec eget nisi magna. Duis congue, ipsum a ullamcorper dapibus, dui leo tincidunt enim, ac vestibulum dolor diam et urna. Fusce eleifend rhoncus blandit. Cras faucibus, mauris vel laoreet egestas, dolor urna ultrices velit, et auctor arcu elit quis tortor. Sed ut massa in mi dictum consectetur.

Etiam fringilla consequat risus quis suscipit. Aenean id augue dolor. Pellentesque elementum purus vel facilisis mollis. Nunc tempus porttitor nisl convallis tempus. Nullam quis bibendum arcu. Integer elementum rutrum leo, a fermentum eros dignissim et. Nulla in lobortis metus. Aliquam erat volutpat. Sed odio dolor, sodales id porttitor nec, condimentum ut neque.

Etiam odio orci, blandit a semper sit amet, placerat at dui. Integer iaculis, felis ac facilisis iaculis, tortor orci feugiat elit, ac volutpat metus dui ut est. Duis consequat velit ut ligula hendrerit, luctus fringilla nisi cursus. Etiam interdum dui quis eleifend ultrices. Donec consectetur, nunc in laoreet aliquam, felis lacus euismod libero, ac accumsan risus mi ac justo. Etiam eget augue nisi. Donec nec laoreet nisi, nec fringilla ante. Pellentesque vel condimentum odio. Vivamus vulputate metus a eros euismod placerat. Mauris eget mattis magna. Donec eget nisi magna. Duis congue, ipsum a ullamcorper dapibus, dui leo tincidunt enim, ac vestibulum dolor diam et urna. Fusce eleifend rhoncus blandit. Cras faucibus, mauris vel laoreet egestas, dolor urna ultrices velit, et auctor arcu elit quis tortor. Sed ut massa in mi dictum consectetur.

Etiam fringilla consequat risus quis suscipit. Aenean id augue dolor. Pellentesque elementum purus vel facilisis mollis. Nunc tempus porttitor nisl convallis tempus. Nullam quis bibendum arcu. Integer elementum rutrum leo, a fermentum eros dignissim et. Nulla in lobortis metus. Aliquam erat volutpat. Sed odio dolor, sodales id porttitor nec, condimentum ut neque.

Donec blandit, elit ut finibus semper, metus neque egestas leo, a cursus est turpis non enim. Ut at hendrerit dui, eu consequat mauris. Nam suscipit dolor nibh, eget rutrum felis varius nec. Nulla eu viverra lorem. Nulla non diam ac lacus congue vestibulum. Fusce vestibulum enim id quam dapibus lacinia. Cras efficitur consequat gravida. Aliquam vitae odio tristique, viverra neque sit amet, scelerisque neque. Pellentesque placerat semper pharetra.

Maecenas rhoncus sem leo, vel consectetur tortor rhoncus non. Donec ex sapien, mollis ullamcorper mattis tincidunt, lacinia pretium felis. Nam ut tincidunt metus, vel bibendum metus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut vel suscipit arcu. Cras lobortis eros quis metus dapibus sagittis. Pellentesque id tristique quam, at fringilla lectus. Donec elementum id libero eu porttitor. Aenean venenatis quis est eget hendrerit. Nunc iaculis dolor risus, vitae ullamcorper felis convallis sed. Etiam augue orci, tempus in commodo eu, consectetur quis massa. Vestibulum rhoncus in felis at placerat. Sed facilisis eros vitae ullamcorper semper. Donec pretium rhoncus massa. Sed in vulputate nisi. Etiam elementum lorem id fringilla pellentesque.

Donec blandit, elit ut finibus semper, metus neque egestas leo, a cursus est turpis non enim. Ut at hendrerit dui, eu consequat mauris. Nam suscipit dolor nibh, eget rutrum felis varius nec. Nulla eu viverra lorem. Nulla non diam ac lacus congue vestibulum. Fusce vestibulum enim id quam dapibus lacinia. Cras efficitur consequat gravida. Aliquam vitae odio tristique, viverra neque sit amet, scelerisque neque. Pellentesque placerat semper pharetra.

Maecenas rhoncus sem leo, vel consectetur tortor rhoncus non. Donec ex sapien, mollis ullamcorper mattis tincidunt, lacinia pretium felis. Nam ut tincidunt metus, vel bibendum metus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut vel suscipit arcu. Cras lobortis eros quis metus dapibus sagittis. Pellentesque id tristique quam, at fringilla lectus. Donec elementum id libero eu porttitor. Aenean venenatis quis est eget hendrerit. Nunc iaculis dolor risus, vitae ullamcorper felis convallis sed. Etiam augue orci, tempus in commodo eu, consectetur quis massa. Vestibulum rhoncus in felis at placerat. Sed facilisis eros vitae ullamcorper semper. Donec pretium rhoncus massa. Sed in vulputate nisi. Etiam elementum lorem id fringilla pellentesque.`);
    } else {
      setFill("");
    }
  }, [fill, setFill]);
  return (
    <Animated.ScrollView
      {...rect}
      {...scrollViewProps}
      ref={scrollViewRef}
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "center",
      }}
      style={{
        height: rect.height,
        borderWidth: 1,
        borderColor: "yellow",
      }}
    >
      <Text>{JSON.stringify(rect, null, 2)}</Text>
      <Text>{headerHeight}</Text>
      <Button title="fill" onPress={toggleFill} />
      <Text>{fill}</Text>
    </Animated.ScrollView>
  );
}
export function OneViewScreen({
  navigation,
  route,
}: StackScreenProps<MainDrawerTabOneParamList, "OneView">) {
  const headerHeight = useHeaderHeight();
  const rect: LayoutRectangle = route.params ?? {
    x: 0,
    y: 0,
    width: 1,
    height: 1,
  };
  const [fill, setFill] = useState("");
  const scrollViewRef = createRef<RNScrollView>();
  const refreshControl = useRefreshControl(
    async () => new Promise((resolve) => setTimeout(resolve, 2000))
  );
  const scrollViewProps = useHeaderDx(scrollViewRef, {
    refreshControl,
  });
  const toggleFill = useCallback(() => {
    if (fill.length === 0) {
      setFill(`
 Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla hendrerit justo risus, vel dapibus metus tincidunt sed. Integer tellus nibh, gravida ut vulputate rhoncus, lobortis sit amet erat. Proin vel vulputate ex, non cursus sapien. Vivamus gravida sollicitudin congue. Vestibulum scelerisque tincidunt suscipit. Sed aliquet mattis nunc, vel vehicula massa tristique ut. In quis sem sed nulla faucibus ornare in vitae felis.

Etiam odio orci, blandit a semper sit amet, placerat at dui. Integer iaculis, felis ac facilisis iaculis, tortor orci feugiat elit, ac volutpat metus dui ut est. Duis consequat velit ut ligula hendrerit, luctus fringilla nisi cursus. Etiam interdum dui quis eleifend ultrices. Donec consectetur, nunc in laoreet aliquam, felis lacus euismod libero, ac accumsan risus mi ac justo. Etiam eget augue nisi. Donec nec laoreet nisi, nec fringilla ante. Pellentesque vel condimentum odio. Vivamus vulputate metus a eros euismod placerat. Mauris eget mattis magna. Donec eget nisi magna. Duis congue, ipsum a ullamcorper dapibus, dui leo tincidunt enim, ac vestibulum dolor diam et urna. Fusce eleifend rhoncus blandit. Cras faucibus, mauris vel laoreet egestas, dolor urna ultrices velit, et auctor arcu elit quis tortor. Sed ut massa in mi dictum consectetur.

Etiam fringilla consequat risus quis suscipit. Aenean id augue dolor. Pellentesque elementum purus vel facilisis mollis. Nunc tempus porttitor nisl convallis tempus. Nullam quis bibendum arcu. Integer elementum rutrum leo, a fermentum eros dignissim et. Nulla in lobortis metus. Aliquam erat volutpat. Sed odio dolor, sodales id porttitor nec, condimentum ut neque.

Etiam odio orci, blandit a semper sit amet, placerat at dui. Integer iaculis, felis ac facilisis iaculis, tortor orci feugiat elit, ac volutpat metus dui ut est. Duis consequat velit ut ligula hendrerit, luctus fringilla nisi cursus. Etiam interdum dui quis eleifend ultrices. Donec consectetur, nunc in laoreet aliquam, felis lacus euismod libero, ac accumsan risus mi ac justo. Etiam eget augue nisi. Donec nec laoreet nisi, nec fringilla ante. Pellentesque vel condimentum odio. Vivamus vulputate metus a eros euismod placerat. Mauris eget mattis magna. Donec eget nisi magna. Duis congue, ipsum a ullamcorper dapibus, dui leo tincidunt enim, ac vestibulum dolor diam et urna. Fusce eleifend rhoncus blandit. Cras faucibus, mauris vel laoreet egestas, dolor urna ultrices velit, et auctor arcu elit quis tortor. Sed ut massa in mi dictum consectetur.

Etiam fringilla consequat risus quis suscipit. Aenean id augue dolor. Pellentesque elementum purus vel facilisis mollis. Nunc tempus porttitor nisl convallis tempus. Nullam quis bibendum arcu. Integer elementum rutrum leo, a fermentum eros dignissim et. Nulla in lobortis metus. Aliquam erat volutpat. Sed odio dolor, sodales id porttitor nec, condimentum ut neque.

Donec blandit, elit ut finibus semper, metus neque egestas leo, a cursus est turpis non enim. Ut at hendrerit dui, eu consequat mauris. Nam suscipit dolor nibh, eget rutrum felis varius nec. Nulla eu viverra lorem. Nulla non diam ac lacus congue vestibulum. Fusce vestibulum enim id quam dapibus lacinia. Cras efficitur consequat gravida. Aliquam vitae odio tristique, viverra neque sit amet, scelerisque neque. Pellentesque placerat semper pharetra.

Maecenas rhoncus sem leo, vel consectetur tortor rhoncus non. Donec ex sapien, mollis ullamcorper mattis tincidunt, lacinia pretium felis. Nam ut tincidunt metus, vel bibendum metus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut vel suscipit arcu. Cras lobortis eros quis metus dapibus sagittis. Pellentesque id tristique quam, at fringilla lectus. Donec elementum id libero eu porttitor. Aenean venenatis quis est eget hendrerit. Nunc iaculis dolor risus, vitae ullamcorper felis convallis sed. Etiam augue orci, tempus in commodo eu, consectetur quis massa. Vestibulum rhoncus in felis at placerat. Sed facilisis eros vitae ullamcorper semper. Donec pretium rhoncus massa. Sed in vulputate nisi. Etiam elementum lorem id fringilla pellentesque.

Donec blandit, elit ut finibus semper, metus neque egestas leo, a cursus est turpis non enim. Ut at hendrerit dui, eu consequat mauris. Nam suscipit dolor nibh, eget rutrum felis varius nec. Nulla eu viverra lorem. Nulla non diam ac lacus congue vestibulum. Fusce vestibulum enim id quam dapibus lacinia. Cras efficitur consequat gravida. Aliquam vitae odio tristique, viverra neque sit amet, scelerisque neque. Pellentesque placerat semper pharetra.

Maecenas rhoncus sem leo, vel consectetur tortor rhoncus non. Donec ex sapien, mollis ullamcorper mattis tincidunt, lacinia pretium felis. Nam ut tincidunt metus, vel bibendum metus. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Ut vel suscipit arcu. Cras lobortis eros quis metus dapibus sagittis. Pellentesque id tristique quam, at fringilla lectus. Donec elementum id libero eu porttitor. Aenean venenatis quis est eget hendrerit. Nunc iaculis dolor risus, vitae ullamcorper felis convallis sed. Etiam augue orci, tempus in commodo eu, consectetur quis massa. Vestibulum rhoncus in felis at placerat. Sed facilisis eros vitae ullamcorper semper. Donec pretium rhoncus massa. Sed in vulputate nisi. Etiam elementum lorem id fringilla pellentesque.`);
    } else {
      setFill("");
    }
  }, [fill, setFill]);
  return (
    <Animated.ScrollView
      {...rect}
      {...scrollViewProps}
      ref={scrollViewRef}
      contentContainerStyle={{
        alignItems: "center",
        justifyContent: "center",
      }}
      style={{
        height: rect.height,
        borderWidth: 1,
        borderColor: "yellow",
      }}
    >
      <Text>{JSON.stringify(rect, null, 2)}</Text>
      <Text>{headerHeight}</Text>
      <Button title="fill" onPress={toggleFill} />
      <Text>{fill}</Text>
    </Animated.ScrollView>
  );
}
