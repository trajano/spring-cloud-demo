import Constants from 'expo-constants';
import { ReactElement, useCallback } from 'react';
import { SectionList, SectionListData, SectionListProps, SectionListRenderItemInfo } from 'react-native';
import { BlurView, Text, View } from '../src/lib/native-unstyled';

const isHermes = () => !!((global as any)['HermesInternal']);

const specimen = "The quick brown fox jumped over the two lazy dogs. 13-8 0 96?"
type FontSectionData = { fontFamily: string, specimen: string };
const variantSuffixes = [
    "Black",
    "Bold",
    "DemiBold",
    "ExtraBold",
    "Heavy",
    "HeavyItalic",
    "Italic",
    "Light",
    "Medium",
    "Regular",
    "Semibold",
    "SemiBold",
    "Thin",
    "UltraBold",
    "Ultralight",
    "UltralightItalic",
]

function hasNoVariantSuffix(fontFamily: string): boolean {
    return variantSuffixes
        .flatMap((suffix) => ["_" + suffix, "-" + suffix])
        .findIndex(suffix => fontFamily.indexOf(suffix) >= 0) === -1

}

export function SystemFontsScreen(): ReactElement<SectionListProps<string>, any> {
    function fontSpecimens(fontFamily: string): FontSectionData[] {
        return [{ fontFamily, specimen },
        ...variantSuffixes
            .flatMap((suffix) => [fontFamily + "_" + suffix, fontFamily + "-" + suffix])
            .filter(f => Constants.systemFonts.findIndex((ff) => ff.toLowerCase() === f.toLowerCase()) !== -1)
            .map(f => ({ fontFamily: f, specimen: specimen + " " + f }))
        ]
    }
    const sections: SectionListData<FontSectionData>[] = Constants.systemFonts
        .filter(name => hasNoVariantSuffix(name))
        .map(fontName => ({
            key: fontName, data: fontSpecimens(fontName)
        }));

    const renderSectionHeader = useCallback(({ section }: { section: SectionListData<any, any> }) => <BlurView
        padding={16} justifyContent="center"><Text fontFamily={section.key} fontSize={20}>{section.key}</Text></BlurView>, [sections]);
    const renderItem = useCallback(({ item, section, index }: SectionListRenderItemInfo<FontSectionData>) => <View
        flex={1} padding={16} backgroundColor="#f0f0e0"><Text fontFamily={item.fontFamily}>{item.specimen}</Text></View>, [sections])

    return <SectionList<FontSectionData>
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
    />
}
