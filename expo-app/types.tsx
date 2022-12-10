/**
 * Learn more about using TypeScript with React Navigation:
 * https://reactnavigation.org/docs/typescript/
 */

import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { DrawerScreenProps } from '@react-navigation/drawer';
import { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList { }
  }
}

export type RootStackParamList = {
  Root: NavigatorScreenParams<RootTabParamList> | undefined;
  Modal: undefined;
  NotFound: undefined;
};

export type RootStackScreenProps<Screen extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  Screen
>;

export type MainDrawerScreenProps<Screen extends keyof MainDrawerParamList> =
  DrawerScreenProps<MainDrawerParamList, Screen>;
export type RootTabParamList = {
  MainDrawer: NavigatorScreenParams<MainDrawerParamList>;
  TabTwo: undefined;
  NetworkLogger: undefined;
};

/**
 * Composites are needed to access the modal dialogs which are at the root.
 */
export type MainDrawerTabOneScreenProps<Screen extends keyof MainDrawerTabOneParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<
      MainDrawerTabOneParamList,
      Screen
    >,
    NativeStackScreenProps<RootStackParamList>>

export type MainDrawerTabOneParamList = {
  TabOneScreen: undefined;
}
export type MainDrawerStackNavigatorScrollViewParamList = {
  StackNavigatorScrollViewScreen: undefined;
}
export type MainDrawerParamList = {
  TabOne: NavigatorScreenParams<MainDrawerTabOneParamList>;
  JustScrollView: undefined;
  Environment: undefined;
  StackNavigatorScrollView: NavigatorScreenParams<MainDrawerStackNavigatorScrollViewParamList>;
}

export type RootTabScreenProps<Screen extends keyof RootTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<RootTabParamList, Screen>,
  NativeStackScreenProps<RootStackParamList>
>;
