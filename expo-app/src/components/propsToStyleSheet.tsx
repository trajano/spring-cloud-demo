import * as RN from "react-native";
import { memo } from 'react';
import { StyleProp } from "react-native";
import { ColorSchemeColors } from '../lib/native-unstyled/Themes';
import { lookupColor } from './lookupColor';
import { StyleProps } from './StyleProps';
import memoize from 'lodash.memoize'
import pick from 'lodash.pick'
import eq from 'lodash.eq'

/**
 * Style prop keys.  Its a mapping from a prop key to the style prop.
 */
const stylePropKeyMapping: [string, string][] = [
    ["backfaceVisibility", "backfaceVisibility"],
    ["borderBottomEndRadius", "borderBottomEndRadius"],
    ["borderBottomLeftRadius", "borderBottomLeftRadius"],
    ["borderBottomRightRadius", "borderBottomRightRadius"],
    ["borderBottomStartRadius", "borderBottomStartRadius"],
    ["borderBottomWidth", "borderBottomWidth"],
    ["borderLeftWidth", "borderLeftWidth"],
    ["borderRadius", "borderRadius"],
    ["borderRightWidth", "borderRightWidth"],
    ["borderStyle", "borderStyle"],
    ["borderTopEndRadius", "borderTopEndRadius"],
    ["borderTopLeftRadius", "borderTopLeftRadius"],
    ["borderTopRightRadius", "borderTopRightRadius"],
    ["borderTopStartRadius", "borderTopStartRadius"],
    ["borderTopWidth", "borderTopWidth"],
    ["borderWidth", "borderWidth"],
    ["opacity", "opacity"],
    ["elevation", "elevation"],
    ["alignContent", "alignContent"],
    ["alignItems", "alignItems"],
    ["alignSelf", "alignSelf"],
    ["aspectRatio", "aspectRatio"],
    ["borderBottomWidth", "borderBottomWidth"],
    ["borderEndWidth", "borderEndWidth"],
    ["borderLeftWidth", "borderLeftWidth"],
    ["borderRightWidth", "borderRightWidth"],
    ["borderStartWidth", "borderStartWidth"],
    ["borderTopWidth", "borderTopWidth"],
    ["borderWidth", "borderWidth"],
    ["bottom", "bottom"],
    ["display", "display"],
    ["end", "end"],
    ["flex", "flex"],
    ["flexBasis", "flexBasis"],
    ["flexDirection", "flexDirection"],
    ["flexGrow", "flexGrow"],
    ["flexShrink", "flexShrink"],
    ["flexWrap", "flexWrap"],
    ["height", "height"],
    ["justifyContent", "justifyContent"],
    ["left", "left"],
    ["margin", "margin"],
    ["marginBottom", "marginBottom"],
    ["marginEnd", "marginEnd"],
    ["marginHorizontal", "marginHorizontal"],
    ["marginLeft", "marginLeft"],
    ["marginRight", "marginRight"],
    ["marginStart", "marginStart"],
    ["marginTop", "marginTop"],
    ["marginVertical", "marginVertical"],
    ["maxHeight", "maxHeight"],
    ["maxWidth", "maxWidth"],
    ["minHeight", "minHeight"],
    ["minWidth", "minWidth"],
    ["overflow", "overflow"],
    ["padding", "padding"],
    ["paddingBottom", "paddingBottom"],
    ["paddingEnd", "paddingEnd"],
    ["paddingHorizontal", "paddingHorizontal"],
    ["paddingLeft", "paddingLeft"],
    ["paddingRight", "paddingRight"],
    ["paddingStart", "paddingStart"],
    ["paddingTop", "paddingTop"],
    ["paddingVertical", "paddingVertical"],
    ["position", "position"],
    ["right", "right"],
    ["start", "start"],
    ["top", "top"],
    ["width", "width"],
    ["zIndex", "zIndex"],
    ["direction", "direction"],
    ["transform", "transform"],
    ["fontFamily", "fontFamily"],
    ["fontSize", "fontSize"],
    ["fontStyle", "fontStyle"],
    ["fontWeight", "fontWeight"],
    ["letterSpacing", "letterSpacing"],
    ["lineHeight", "lineHeight"],
    ["textAlign", "textAlign"],
    ["textDecorationLine", "textDecorationLine"],
    ["textDecorationStyle", "textDecorationStyle"],
    ["textShadowOffset", "textShadowOffset"],
    ["textShadowRadius", "textShadowRadius"],
    ["textTransform", "textTransform"]
];

/**
 * Color style prop keys.  Its a mapping from a prop key to the style prop.  These are specific for colors.
 */
const colorStylePropKeyMapping: [string, string][] = [
    ["backgroundColor", "backgroundColor"],
    ["borderBottomColor", "borderBottomColor"],
    ["borderColor", "borderColor"],
    ["borderEndColor", "borderEndColor"],
    ["borderLeftColor", "borderLeftColor"],
    ["borderRightColor", "borderRightColor"],
    ["borderStartColor", "borderStartColor"],
    ["borderTopColor", "borderTopColor"],
    ["color", "color"],
    ["textDecorationColor", "textDecorationColor"],
    ["textShadowColor", "textShadowColor"],
    ["bg", "backgroundColor"],
    ["fg", "color"]
];

/**
 * The prop keys used by styles.
 */
const stylePropKeys = [
    ...stylePropKeyMapping.map(mapping => mapping[0]),
    ...colorStylePropKeyMapping.map(mapping => mapping[0])
];

/**
 * Given props of a component, extract the style related utility props and compute the stylesheet.  It memoizes the props 
 * @param props props
 * @param colorSchemeColors color scheme colors for color lookups
 * @returns style prop
 */
function doPropsToStyleSheet(props: Omit<StyleProps, "role" | "size">, colorSchemeColors: ColorSchemeColors): StyleProp<Record<string, unknown>> {
    const accumulatedStyle: Record<string, unknown> = {};
    /**
     * Look up the prop value if present compute it as the style key
     * @param propKey prop key
     * @param styleKey style key
     */
    function add(propKey: string, styleKey: string) {
        if (props.hasOwnProperty(propKey) && (props as Record<string, unknown>)[propKey] !== null) {
            accumulatedStyle[styleKey] = (props as Record<string, unknown>)[propKey];
        }
    }
    /**
     * Look up the prop value if present compute the color as the style key
     * @param propKey prop key
     * @param styleKey style key
     */
    function addColor(propKey: string, styleKey: string) {
        if (props.hasOwnProperty(propKey) && (props as Record<string, unknown>)[propKey] !== null) {
            const evaluatedColor = lookupColor((props as Record<string, unknown>)[propKey] as RN.ColorValue, colorSchemeColors);
            accumulatedStyle[styleKey] = evaluatedColor;
        }
    }

    for (const stylePropKey of stylePropKeyMapping) {
        add(stylePropKey[0], stylePropKey[1])
    }
    for (const stylePropKey of colorStylePropKeyMapping) {
        addColor(stylePropKey[0], stylePropKey[1])
    }

    return accumulatedStyle;
}

export const propsToStyleSheet = memoize(doPropsToStyleSheet, ((props, colorSchemeColors) => JSON.stringify([pick(props, stylePropKeys), colorSchemeColors])));