import { DefaultTheme } from "@react-navigation/native";

import { ColorSchemeColors } from "../ColorSchemeColors";

export const defaultLightColorSchemeColors: ColorSchemeColors = {
  default: [DefaultTheme.colors.text, DefaultTheme.colors.background],
  input: {
    enabled: [DefaultTheme.colors.text, DefaultTheme.colors.card],
    disabled: [DefaultTheme.colors.border, "transparent"],
    default: [DefaultTheme.colors.text, DefaultTheme.colors.card],
    /**
     * Color for the placeholder text which can vary depending on field state.
     */
    placeholderText: {
      enabled: DefaultTheme.colors.notification,
      disabled: DefaultTheme.colors.notification,
      default: DefaultTheme.colors.notification,
    },
    border: {
      enabled: DefaultTheme.colors.text,
      disabled: DefaultTheme.colors.border,
      default: DefaultTheme.colors.border,
    },
    /**
     * Color for the selection highlight and cursor color. Applicable only on focused.
     */
    selection: DefaultTheme.colors.text,
    switch: {
      thumb: DefaultTheme.colors.card,
      true: DefaultTheme.colors.primary,
      false: DefaultTheme.colors.border,
    },
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
