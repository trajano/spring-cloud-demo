import { DefaultTheme } from "@react-navigation/native";

import { ColorSchemeColors } from "./Themes";
export const defaultLightColorSchemeColors: ColorSchemeColors = {
  default: ["#000000", "#EEEEEE"],
  layers: {
    primary: ["#101030", "#EEEEEE"],
    secondary: ["#103030", "#EEEEEE"],
    tertiary: ["#103030", "#EEEEEE"],
    danger: ["#101010", "#FFAAAA"],
    warning: ["#101010", "#FFFFAA"],
  },
  aliases: {},
  navigation: {
    primary: DefaultTheme.colors.primary,
    border: DefaultTheme.colors.border,
    card: DefaultTheme.colors.card,
    notification: DefaultTheme.colors.notification,
  },
};
