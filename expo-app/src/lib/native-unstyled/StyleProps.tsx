import * as RN from "react-native";
import { StyleProp } from "react-native";
import { TextStyleProps } from './TextStyleProps';

/**
 * Style props combine both view and text style props.  Deprecated values are omitted.  Shadow props are also omitted in favor of elevation
 */
export type StyleProps = TextStyleProps & Omit<RN.ViewStyle, "testID" | "transformMatrix" | "rotation" | "scaleX" | "scaleY" | "translateX" | "translateY" | "shadowColor" | "shadowOffset" | "shadowOpacity" | "shadowRadius"> & {
    /**
     * If true, the existing `style` attribute will be extended.  If false then the stylings will not modify the existing style attribute.  Defaults to true.
     */
    extendStyle?: boolean;
    /**
     * Existing style.
     */
    style?: StyleProp<unknown>;

    /**
     * Background color alias.
     */
    bg?: string;

    /**
     * Elevation.  This replaces the shadow props and made to work the same way in both Android and iOS when applied as a prop.
     */
    elevation?: number;
};
