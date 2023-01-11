import { useHeaderHeight } from "@react-navigation/elements";
import {
  NavigationProp,
  ParamListBase,
  RouteProp,
  useNavigation,
} from "@react-navigation/native";
import Constants from "expo-constants";
import { memo, useCallback, useState } from "react";
import { Button } from "react-native";

import { Text, View } from "../lib/native-unstyled";
import { HeaderDxStackParamList } from "./HeaderDxStackNavigation";
import { NativeStackParamList } from "./NativeStackNavigation";

export const OneViewContent = memo(
  ({ route }: { route: RouteProp<ParamListBase> }) => {
    const navigation =
      useNavigation<
        NavigationProp<HeaderDxStackParamList | NativeStackParamList>
      >();
    const headerHeight = useHeaderHeight();
    const [fill, setFill] = useState("");
    const largeHeader = useCallback(() => {
      navigation.navigate("SampleScrollView");
    }, [navigation]);
    const smallHeader = useCallback(() => {
      navigation.navigate("SmallHeader");
    }, [navigation]);
    const transparentHeader = useCallback(() => {
      navigation.navigate("TransparentHeader");
    }, [navigation]);
    const transparentSmallHeader = useCallback(() => {
      navigation.navigate("TransparentSmallHeader");
    }, [navigation]);
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
      <View backgroundColor="black" padding={16}>
        <Text>
          {JSON.stringify(
            {
              ...route,
              headerHeight,
              statusBarCurrentHeight: Constants.statusBarHeight,
            },
            null,
            2
          )}
        </Text>
        <Button title="largeHeader" onPress={largeHeader} />
        <Button title="smallHeader" onPress={smallHeader} />
        <Button title="transparentHeader" onPress={transparentHeader} />
        <Button
          title="transparentSmallHeader"
          onPress={transparentSmallHeader}
        />
        <Button title="fill" onPress={toggleFill} />
        <Text>{fill}</Text>
      </View>
    );
  }
);
