import Constants from "expo-constants";
import { ReactElement, memo, useCallback } from "react";
import {
  SectionList,
  SectionListData,
  SectionListProps,
  SectionListRenderItemInfo,
} from "react-native";

import { BlurView, Text, View } from "../src/lib/native-unstyled";

const specimenText =
  "The quick brown fox jumped over the two lazy dogs. 13-8 0 96?";
interface FontSectionData {
  fontFamily: string;
  specimen: string;
}
const variantSuffixes = [
  "Black",
  "Bold",
  "Condensed",
  "CondensedBold",
  "DemiBold",
  "ExtraBold",
  "Heavy",
  "HeavyItalic",
  "Italic",
  "Light",
  "Medium",
  "Oblique",
  "Regular",
  "Semibold",
  "SemiBold",
  "Thin",
  "UltraBold",
  "Ultralight",
  "UltralightItalic",
  "W3",
  "W4",
  "W6",
  "W7",
];
const SectionHeader = memo(({ fontFamily }: { fontFamily: string }) => (
  <BlurView padding={16} justifyContent="center">
    <Text fontFamily={fontFamily} fontSize={20}>
      {fontFamily}
    </Text>
  </BlurView>
));
const SpecimenView = memo(
  ({ fontFamily, specimen }: { fontFamily: string; specimen: string }) => (
    <View flex={1} padding={16} backgroundColor="#f0f0e0">
      <Text fontFamily={fontFamily} color="black">
        {specimen}
      </Text>
    </View>
  )
);

/**
 *
 * @testonly
 */
export function hasNoVariantSuffix(fontFamily: string): boolean {
  return (
    variantSuffixes
      .flatMap((suffix) => [`_${suffix}`, `-${suffix}`])
      .findIndex((suffix) =>
        fontFamily.toLowerCase().includes(suffix.toLowerCase())
      ) === -1
  );
}

export function SystemFontsScreen(): ReactElement<
  SectionListProps<string>,
  any
> {
  function fontSpecimens(fontFamily: string): FontSectionData[] {
    return [
      { fontFamily, specimen: specimenText },
      ...variantSuffixes
        .flatMap((suffix) => [
          `${fontFamily}_${suffix}`,
          `${fontFamily}-${suffix}`,
        ])
        .filter(
          (f) =>
            Constants.systemFonts.findIndex(
              (ff) => ff.toLowerCase() === f.toLowerCase()
            ) !== -1
        )
        .map((f) => ({
          key: f,
          fontFamily: f,
          specimen: `${specimenText} ${f}`,
        })),
    ];
  }
  const sections: SectionListData<FontSectionData>[] = Constants.systemFonts
    .filter((name) => hasNoVariantSuffix(name))
    .map((fontName) => ({
      key: fontName,
      data: fontSpecimens(fontName),
    }));

  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<any, any> }) => (
      <SectionHeader fontFamily={section.key} />
    ),
    []
  );
  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<FontSectionData>) => (
      <SpecimenView fontFamily={item.fontFamily} specimen={item.specimen} />
    ),
    []
  );

  return (
    <SectionList<FontSectionData>
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
    />
  );
}
