/**
 * Exports React Native Core Components.
 * It excludes the following which should use Pressable: Button, TouchableHighlight, TouchableOpacity and TouchableWithoutFeedback.
 * https://reactnative.dev/docs/next/components-and-apis
 * @module
 */
import {
  ActivityIndicator as RNActivityIndicator,
  FlatList as RNFlatList,
  Image as RNImage,
  Modal as RNModal,
  Pressable as RNPressable,
  RefreshControl as RNRefreshControl,
  ScrollView as RNScrollView,
  SectionList as RNSectionList,
  TextInputProps,
  TextInput as RNTextInput,
  TextProps,
  Text as RNText,
  View as RNView,
} from "react-native";
import { withI18n } from "./withI18n";
import { withReplacedWithNativeFonts } from "./withReplacedWithNativeFonts";
import { withStyled } from "./withStyled";

export const ActivityIndicator = withStyled(RNActivityIndicator);
export const FlatList = withStyled(RNFlatList);
export const Image = withStyled(RNImage);
export const Modal = withStyled(RNModal);
export const Pressable = withStyled(RNPressable);
export const RefreshControl = withStyled(RNRefreshControl);
export const ScrollView = withStyled(RNScrollView);
export const SectionList = withStyled(RNSectionList);

/**
 * TextInput
 */
export const TextInput = withStyled(
  withI18n(
    withReplacedWithNativeFonts<TextInputProps, TextInputProps, RNTextInput>(
      RNTextInput
    ),
    {
      localizedMap: {
        _a: "accessibilityLabel",
        _p: "placeholder",
        _rkl: "returnKeyLabel",
      },
    }
  )
);

/**
 * This is a non-animated version of Text.  Primarily used for Markdown to Text components.
 * This component type is not exposed outside as it is used internally only.
 */
export const Text = withStyled(
  withI18n(withReplacedWithNativeFonts<TextProps, TextProps, RNText>(RNText), {
    _tIsChild: true,
  })
);

export const View = withStyled(RNView);
