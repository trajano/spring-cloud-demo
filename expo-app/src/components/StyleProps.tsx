import * as RN from "react-native";
import { StyleProp } from "react-native";
import { TextStyleProps } from './TextStyleProps';

/**
 * Style props combine both view and text style props.  Deprecated values are omitted
 */
export type StyleProps = TextStyleProps & Omit<RN.ViewStyle, "testID" | "transformMatrix" | "rotation" | "scaleX" | "scaleY" | "translateX" | "translateY"> & {
    /**
     * If true, the existing `style` attribute will be extended.  If false then the stylings will not modify the existing style attribute.  Defaults to true.
     */
    extendStyle?: boolean;
    /**
     * Existing style.
     */
    style?: StyleProp<unknown>;

    /**
     * Background color
     */
    bg?: string;
};
