/**
 * Learn more about deep linking with React Navigation
 * https://reactnavigation.org/docs/deep-linking
 * https://reactnavigation.org/docs/configuring-links
 */

import { LinkingOptions } from "@react-navigation/native";
import * as Linking from "expo-linking";

import { RootStackParamList } from "./paramLists";

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/")],
  config: {
    screens: {
      Root: {
        screens: {
          MainDrawer: {
            screens: {
              TabOne: {
                screens: {
                  TabOneScreen: "one",
                },
              },
            },
          },
          TabTwo: "two",
          NetworkLogger: "network-log",
        },
      },
      Modal: "modal",
      NotFound: "*",
    },
  },
};

export default linking;
