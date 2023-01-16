/**
 * Type definitions for React Navigation.  The typings of react-native navigation does not
 * work correctly if `interface` was used instead of `type`.
 */
/* eslint @typescript-eslint/consistent-type-definitions: ["error", "type"] */
import { NavigatorScreenParams } from "@react-navigation/native";
import { LayoutRectangle } from "react-native";

export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  Modal: undefined;
  NotFound: undefined;
};

export type RootTabParamList = {
  MainDrawer: NavigatorScreenParams<MainDrawerParamList>;
  TabTwo: {};
  NetworkLogger: {};
};

export type MainDrawerParamList = {
  TabOne: NavigatorScreenParams<MainDrawerTabOneParamList>;
  JustScrollView: {};
  Environment: {};
  ExpoUpdate: {};
  AsyncStorage: {};
  SystemFonts: {};
  StackNavigatorScrollView: NavigatorScreenParams<MainDrawerStackNavigatorScrollViewParamList>;
};

export type MainDrawerTabOneParamList = {
  TabOneScreen: undefined;
  OneView: LayoutRectangle;
  OneViewTransparentHeader: LayoutRectangle;
  SystemFonts: undefined;
};

export type MainDrawerStackNavigatorScrollViewParamList = {
  StackNavigatorScrollViewScreen: {};
};
