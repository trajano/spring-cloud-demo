import { DefaultTheme } from "@react-navigation/native";

import { ColorSchemeColors } from "./Themes";
export const defaultLightColorSchemeColors: ColorSchemeColors = {
  default: ["#000000", "#EEEEEE"],
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
