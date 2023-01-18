import { DarkTheme } from "@react-navigation/native";

import { ColorSchemeColors } from "../ColorSchemeColors";
export const defaultDarkColorSchemeColors: ColorSchemeColors = {
  default: [DarkTheme.colors.text, DarkTheme.colors.background],
  input: {
    enabled: [DarkTheme.colors.text, DarkTheme.colors.card],
    disabled: [DarkTheme.colors.border, "transparent"],
    default: [DarkTheme.colors.text, DarkTheme.colors.card],
    /** Color for the placeholder text which can vary depending on field state. */
    placeholderText: {
      enabled: DarkTheme.colors.border,
      disabled: DarkTheme.colors.border,
      default: DarkTheme.colors.border,
    },
    border: {
      enabled: DarkTheme.colors.text,
      disabled: DarkTheme.colors.border,
      default: DarkTheme.colors.border,
    },
    /**
     * Color for the selection highlight and cursor color. Applicable only on
     * focused.
     */
    selection: DarkTheme.colors.text,
    /** Color for the Switch thumb. */
    switch: {
      thumb: DarkTheme.colors.text,
      true: DarkTheme.colors.primary,
      false: DarkTheme.colors.border,
    },
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
