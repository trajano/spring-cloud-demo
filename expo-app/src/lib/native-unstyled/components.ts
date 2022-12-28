/**
 * Exports React Native Core Components.
 * It excludes the following which should use Pressable: Button, TouchableHighlight, TouchableOpacity and TouchableWithoutFeedback.
 * https://reactnative.dev/docs/next/components-and-apis
 * @module
 */
import { BlurView as ExpoBlurView } from "expo-blur";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
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
import { withStyled, withStyledText } from "./withStyled";
import { withTextRole } from "./withTextRole";

export const ActivityIndicator = withStyled(withI18n(RNActivityIndicator));
export const FlatList = withStyled(withI18n(RNFlatList));
export const Image = withStyled(withI18n(RNImage));
export const Modal = withStyled(withI18n(RNModal));
export const Pressable = withStyled(RNPressable);
export const RefreshControl = withStyled(withI18n(RNRefreshControl));
export const ScrollView = withStyled(withI18n(RNScrollView));
export const SectionList = withStyled(withI18n(RNSectionList));

/**
 * Expo BlurView
 */
export const BlurView = withStyled(withI18n(ExpoBlurView));
/**
 * Expo LinearGradient
 */
export const LinearGradient = withStyled(withI18n(ExpoLinearGradient));

/**
 * TextInput
 */
export const TextInput = withStyledText(
  withI18n(
    withTextRole(
      withReplacedWithNativeFonts<TextInputProps, TextInputProps, RNTextInput>(
        RNTextInput
      )
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
export const Text = withStyledText(
  withI18n(
    withTextRole(
      withReplacedWithNativeFonts<TextProps, TextProps, RNText>(RNText)
    ),
    {
      _tIsChild: true,
    }
  )
);

export const View = withStyled(withI18n(RNView));
