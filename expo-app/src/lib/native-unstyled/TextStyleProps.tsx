import * as RN from "react-native";

export type TextStyleProps = Omit<RN.TextStyle, "testID"> & {
  /** Foreground color. Alias for `color` */
  fg?: string;
  /**
   * Role. This is the role for the text. Though nothing is specified it could
   * be something like `headline`, `title`, `label`.
   */
  role?: string;
  /** Size associated with the role. */
  size?: string;

  /** Alias for fontWeight: "bold" */
  bold?: boolean;

  /** Alias for fontStyle: "italic" */
  italic?: boolean;
};
