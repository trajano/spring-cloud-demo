import { isEmpty, memoize, pick, omit } from 'lodash';
import * as RN from "react-native";
import { StyleProp } from "react-native";
import { ColorSchemeColors } from './Themes';
import { lookupColor } from '../../components/lookupColor';
import { StyleProps } from './StyleProps';

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
    ["elevation", "elevation"],
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
    "bold",
    "italic",
    ...stylePropKeyMapping.map(mapping => mapping[0]),
    ...colorStylePropKeyMapping.map(mapping => mapping[0])
];

/**
 * This is a mapping of Android elevation to React Native shadow values.
 * https://ethercreative.github.io/react-native-shadow-generator/
 */
const elevationToShadow = [
    {},
    {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.18,
        shadowRadius: 1.00,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,
    },
    {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.23,
        shadowRadius: 2.62,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.29,
        shadowRadius: 4.65,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.32,
        shadowRadius: 5.46,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.34,
        shadowRadius: 6.27,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.36,
        shadowRadius: 6.68,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.37,
        shadowRadius: 7.49,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 6,
        },
        shadowOpacity: 0.39,
        shadowRadius: 8.30,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.41,
        shadowRadius: 9.11,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 7,
        },
        shadowOpacity: 0.43,
        shadowRadius: 9.51,
    }, {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.44,
        shadowRadius: 10.32,
    }
]

/**
 * Given props of a component, extract the style related utility props and compute the stylesheet.  It memoizes the props 
 * @param props props
 * @param colorSchemeColors color scheme colors for color lookups
 * @returns style prop, may be undefined if empty.
 */
function doPropsToStyleSheet(props: Omit<StyleProps, "role" | "size">, colorSchemeColors: ColorSchemeColors): StyleProp<Record<string, unknown>> | undefined {
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

    /* Elevation specific */
    if (props.hasOwnProperty("elevation") && typeof (props as Record<string, unknown>)["elevation"] === "number" && (props as Record<string, unknown>)["elevation"] !== 0 && RN.Platform.OS !== "android") {
        const elevation = (props as Record<string, unknown>)["elevation"] as number;
        accumulatedStyle["shadowColor"] = "#000";
        accumulatedStyle["shadowOffset"] = elevationToShadow[elevation].shadowOffset
        accumulatedStyle["shadowOpacity"] = elevationToShadow[elevation].shadowOpacity
        accumulatedStyle["shadowRadius"] = elevationToShadow[elevation].shadowRadius
    }

    if (props.hasOwnProperty("bold") && typeof (props as Record<string, unknown>)["bold"] === "boolean" && (props as Record<string, unknown>)["bold"] === true) {
        accumulatedStyle["fontWeight"] = "bold";
    }

    if (props.hasOwnProperty("italic") && typeof (props as Record<string, unknown>)["italic"] === "boolean" && (props as Record<string, unknown>)["italic"] === true) {
        accumulatedStyle["fontStyle"] = "italic";
    }

    return isEmpty(accumulatedStyle) ? undefined : accumulatedStyle;
}

export const propsToStyleSheet = memoize(doPropsToStyleSheet, ((props, colorSchemeColors) => JSON.stringify([pick(props, stylePropKeys), colorSchemeColors])));
/**
 * Omits styled props.  This is only enabled on `__DEV__`
 * @param props 
 * @returns 
 */
export function withoutStyledProps<P extends {}>(props: P) {
    if (__DEV__) {
        return omit(props, stylePropKeys);
    }
    else {
        return props;
    }
}
