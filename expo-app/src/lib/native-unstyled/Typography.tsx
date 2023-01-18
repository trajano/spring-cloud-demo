import { TextStyle } from "react-native";

/** These are the styles that represent a specific typography. */
export interface Typography {
  fontFamily?: TextStyle["fontFamily"];
  fontWeight?: TextStyle["fontWeight"];
  fontSize?: TextStyle["fontSize"];
  fontStyle?: TextStyle["fontStyle"];
  letterSpacing?: TextStyle["letterSpacing"];
  lineHeight?: TextStyle["lineHeight"];
}
