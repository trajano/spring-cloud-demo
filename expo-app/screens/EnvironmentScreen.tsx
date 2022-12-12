import { BASE_URL, TEXT_TEST } from '@env';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Localization from 'expo-localization';
import { ReactElement } from 'react';
import { SectionList, SectionListData, SectionListProps, SectionListRenderItemInfo, Text as RNText } from 'react-native';
import { View } from '../src/components';
import { Text } from '../src/lib/native-unstyled';

const isHermes = () => !!((global as any)['HermesInternal']);
export function EnvironmentScreen(): ReactElement<SectionListProps<Record<string, unknown>>, any> {
    const { manifest, manifest2, systemFonts, expoConfig, ...restOfConstants } = Constants;
    const sections: SectionListData<any>[] = [
        { key: "@env", data: [{ BASE_URL, TEXT_TEST, isHermes }] },
        {
            key: "expo-constants", data: [
                restOfConstants as Record<string, unknown>
            ]
        },
        {
            key: "expo-constants.expoConfig", data: [expoConfig as unknown as Record<string, unknown>]
        },
        {
            key: "expo-constants.manifests", data: [
                manifest as Record<string, unknown>,
                manifest2 as Record<string, unknown>
            ]
        },
        {
            key: "expo-file-system",
            data: [{
                cacheDirectory: FileSystem.cacheDirectory,
                documentDirectory: FileSystem.documentDirectory,
            }]
        },
        {
            key: "expo-localization.Locales",
            data: Localization.getLocales(),
        },
        {
            key: "expo-localization.Calendars",
            data: Localization.getCalendars(),
        },
        {
            key: "System Fonts",
            data: systemFonts
                .filter(name => name.indexOf("-Bold") === -1)
                .filter(name => name.indexOf("_Bold") === -1)
                .filter(name => name.indexOf("_SemiBold") === -1)
                .filter(name => name.indexOf("_Medium") === -1)
                .filter(name => name.indexOf("-Italic") === -1)
                .filter(name => name.indexOf("-Black") === -1)
                .filter(name => name.indexOf("-Thin") === -1)
                .filter(name => name.indexOf("-Semibold") === -1)
                .filter(name => name.indexOf("-ExtraBold") === -1)
                .filter(name => name.indexOf("-SemiBold") === -1)
                .filter(name => name.indexOf("-Medium") === -1)
                .filter(name => name.indexOf("-Regular") === -1)
                .filter(name => name.indexOf("-Light") === -1)
                .filter(name => name.indexOf("-Ultralight") === -1)
                .filter(name => name.indexOf("-UltraBold") === -1),
            renderItem: ({ item }: SectionListRenderItemInfo<string>) => (<View>
                <RNText style={{ fontFamily: item, fontSize: 16, lineHeight: item === "Zapfino" ? undefined : 30 }}>{item}</RNText>
            </View>)
        },
    ];
    return <SectionList<any>
        sections={sections}
        renderItem={({ item }) => <Text>{JSON.stringify(item, null, 2)}</Text>}
        renderSectionHeader={({ section }) => <Text>{section.key}</Text>}
    />
}