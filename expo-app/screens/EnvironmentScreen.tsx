import { BASE_URL, TEXT_TEST } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import { useDeepState } from '@trajano/react-hooks';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Localization from 'expo-localization';
import { identity } from 'lodash';
import { ReactElement, useCallback } from 'react';
import { SectionList, SectionListData, SectionListProps, SectionListRenderItemInfo } from 'react-native';
import { BlurView, Text } from '../src/lib/native-unstyled';

const isHermes = () => !!((global as any)['HermesInternal']);
export function EnvironmentScreen(): ReactElement<SectionListProps<Record<string, unknown>>, any> {
    const { manifest, manifest2, systemFonts: _systemFonts, expoConfig, ...restOfConstants } = Constants;
    const [sections, setSections] = useDeepState<SectionListData<any>[]>([
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
            ].filter(identity)
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
            data: [],
        },
        {
            key: "expo-localization.Calendars",
            data: [],
        },
    ]);
    async function computeSectionsWithPromises(): Promise<SectionListData<any>[]> {
        const replacements: Record<string, any> = {
            "expo-localization.Locales":
                await Promise.resolve(Localization.getLocales()),
            "expo-localization.Calendars":
                await Promise.resolve(Localization.getCalendars()),
        };
        return sections.map(section => (section.key! in replacements) ? { key: section.key!, data: replacements[section.key!] } : section)
    }
    const renderSectionHeader = useCallback(({ section }: { section: SectionListData<any, any> }) => <BlurView padding={16}><Text bold>{section.key}</Text></BlurView>, []);
    const renderItem = useCallback(({ item }: SectionListRenderItemInfo<any>) => <Text>{JSON.stringify(item, null, 2)}</Text>, [])

    useFocusEffect(useCallback(() => {
        (async () => {
            setSections(await computeSectionsWithPromises())
        })()
    }, []));
    return <SectionList<any>
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
    />
}