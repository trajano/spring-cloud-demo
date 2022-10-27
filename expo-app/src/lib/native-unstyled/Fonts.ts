import { TextStyle } from "react-native";

/**
 * These are the key look up properties that would be used to map.
 */
type NativeFontStyle = Pick<
  TextStyle,
  "fontFamily" | "fontWeight" | "fontStyle"
>;
export type FontConfig = {
  key: NativeFontStyle;
};

export type Fonts = {
  [family: string]: FontConfig;
};

/**
 * Implementation note.  In React Native, the styling is not sustained unlike standard HTML to handle that there needs to be a context created for nested text elements to track what is the current style.  Will do that later.
 */
