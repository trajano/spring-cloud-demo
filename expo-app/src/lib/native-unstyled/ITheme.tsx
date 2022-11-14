import { Theme as ReactNavigationTheme } from "@react-navigation/native";
import { ColorSchemeName, TextStyle } from 'react-native';
import { ColorSchemeColors } from "./Themes";

/**
 * Theme will still include non-color stuff like fonts etc.  But only the color scheme is selectable.
 */
export interface ITheme {
    colorScheme: NonNullable<ColorSchemeName>;
    colors: ColorSchemeColors;
    reactNavigationTheme: ReactNavigationTheme;
    setColorScheme(colorScheme: NonNullable<ColorSchemeName>): void;
    /**
     * This obtains the font style for a given font.
     * @param font font name or alias
     */
    fontStyle(font?: string): TextStyle;
}
