/**
 * This library provides i18n and themeing logic for React Native.
 * It is called unstyled as there are actually no components that
 * are styled to look nice.  They are left as close to the default
 * as possible.
 *
 * What it provides are wrappers to the React Native core components
 * that give extra props for i18n, themeing and utility.
 */
export type {
  ColorSchemeColors as Theme,
  ColorSchemes as Themes,
} from "./Themes";
export { defaultColorSchemeColors as defaultColorSchemes } from "./defaultColorSchemes";
export type { LoadingComponentProps } from "../app-loading/LoadingComponentProps";
export { ThemeProvider, useColors, useTheming } from "./ThemeContext";
export { useFonts } from "./Fonts";
export * from "./components";
export { StatusBar } from "./StatusBar";
export type { StyleProps } from "./StyleProps";
export { useRefreshControl } from "./useRefreshControl";
