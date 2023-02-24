import * as RN from "react-native";

export type TextStyleProps = Omit<RN.TextStyle, "testID"> & {
  /** Foreground color. Alias for `color` */
  fg?: string;
  /**
   * A type scale is a selection of font styles that can be used across an app,
   * ensuring a flexible, yet consistent, style that accommodates a range of
   * purposes. They typically provide the font, size, weight, tracking and line
   * height.
   */
  typeScale?: string;
  /** Size associated with the role. */
  size?: string;

  /** Alias for fontWeight: "bold" */
  bold?: boolean;

  /** Alias for fontStyle: "italic" */
  italic?: boolean;
};
