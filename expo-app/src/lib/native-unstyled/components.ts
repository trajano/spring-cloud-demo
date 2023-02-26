/**
 * Exports React Native Core Components. It excludes the following which should
 * use Pressable: Button, TouchableHighlight, TouchableOpacity and
 * TouchableWithoutFeedback.
 * https://reactnative.dev/docs/next/components-and-apis
 *
 * @module
 */
import { BlurView as ExpoBlurView } from "expo-blur";
import { Image as EXImage } from "expo-image";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator as RNActivityIndicator,
  FlatList as RNFlatList,
  Modal as RNModal,
  Pressable as RNPressable,
  RefreshControl as RNRefreshControl,
  ScrollView as RNScrollView,
  SectionList as RNSectionList,
  Switch as RNSwitch,
  Text as RNText,
  TextInput as RNTextInput,
  TextInputProps,
  TextProps,
  View as RNView,
} from "react-native";

import {
  withI18n,
  withReplacedWithNativeFonts,
  withStyled,
  withStyledScrollView,
  withStyledSwitch,
  withStyledText,
  withStyledTextInput,
  withTextRole,
} from "./hoc";

export const ActivityIndicator = withStyled(withI18n(RNActivityIndicator));
export const FlatList = withStyledScrollView(withI18n(RNFlatList));
export const Image = withStyled(
  withI18n(EXImage, {
    displayName: "Image",
    localizedMap: {
      _a: "accessibilityLabel",
      _p: "placeholder",
      // _alt: "alt",
    },
  })
);
export const Modal = withStyled(withI18n(RNModal));
export const Pressable = withStyled(RNPressable);
export const RefreshControl = withStyled(withI18n(RNRefreshControl));
export const ScrollView = withStyledScrollView(withI18n(RNScrollView));
export const SectionList = withStyledScrollView(withI18n(RNSectionList));

/** Expo BlurView */
export const BlurView = withStyled(withI18n(ExpoBlurView));
/** Expo LinearGradient */
export const LinearGradient = withStyled(withI18n(ExpoLinearGradient));

/** Switch */
export const Switch = withStyledSwitch(withI18n(RNSwitch));

/** TextInput */
export const TextInput = withStyledTextInput(
  withI18n(
    withTextRole(
      withReplacedWithNativeFonts<TextInputProps, TextInputProps, RNTextInput>(
        RNTextInput,
        {
          displayName: "TextInput",
        }
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
 * This is a non-animated version of Text. Primarily used for Markdown to Text
 * components. This component type is not exposed outside as it is used
 * internally only.
 */
export const Text = withStyledText(
  withI18n(
    withTextRole(
      withReplacedWithNativeFonts<TextProps, TextProps, RNText>(RNText, {
        displayName: "Text",
      })
    ),
    {
      _tIsChild: true,
    }
  )
);

export const View = withStyled(
  withI18n(RNView, {
    displayName: "View",
  })
);
