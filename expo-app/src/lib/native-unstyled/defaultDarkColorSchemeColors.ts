import { ColorSchemeColors } from "./Themes";
import { DarkTheme } from "@react-navigation/native";
export const defaultDarkColorSchemeColors: ColorSchemeColors = {
  default: ["#FFFFFF", "#101010"],
  layers: {
    primary: ["#F01030", "#101010"],
    secondary: ["#F03030", "#101010"],
    tertiary: ["#F03030", "#101010"],
    danger: ["#101010", "#FFAAAA"],
    warning: ["#101010", "#FFFFAA"],
  },
  aliases: {},
  navigation: {
    primary: DarkTheme.colors.primary,
    border: DarkTheme.colors.border,
    card: DarkTheme.colors.card,
    notification: DarkTheme.colors.notification,
  },
};
