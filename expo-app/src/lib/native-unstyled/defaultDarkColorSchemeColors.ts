import { DarkTheme } from "@react-navigation/native";

import { ColorSchemeColors } from "./Themes";
export const defaultDarkColorSchemeColors: ColorSchemeColors = {
  default: ["#FFFFFF", "#101010"],
  textInput: {
    focused: ["#000000", "#EEEEEE"],
    disabled: ["#7f7f7f", "#CCCCCC"],
    default: ["#000000", "#EEEEEE"],
    /**
     * Color for the placeholder text which can vary depending on field state.
     */
    placeholderText: {
      focused: "#7f7f7f",
      disabled: "#7f7f7f",
      default: "#7f7f7f",
    },
    border: {
      focused: "#000000",
      disabled: "#CCCCCC",
      default: "#EEEEEE",
    },
    /**
     * Color for the selection highlight and cursor color. Applicable only on focused.
     */
    selection: "black",
  },
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
