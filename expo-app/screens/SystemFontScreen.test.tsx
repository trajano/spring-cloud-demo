import { hasNoVariantSuffix } from "./SystemFontsScreen";
it("FilterVariants", () => {

    const fonts = [
        "HelveticaNeue",
        "HelveticaNeue-CondensedBold",
        "HelveticaNeue-UltraLight",
        "HelveticaNeue-UltraLightItalic",
    ]
    expect(fonts.filter(hasNoVariantSuffix))
        .toStrictEqual([
            "HelveticaNeue"
        ])

});