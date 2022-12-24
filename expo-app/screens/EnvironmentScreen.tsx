import { BASE_URL, TEXT_TEST } from '@env';
import { useFocusEffect } from '@react-navigation/native';
import { useDeepState } from '@trajano/react-hooks';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Localization from 'expo-localization';
import omit from 'lodash/omit';
import identity from 'lodash/identity';
import { ReactElement, useCallback } from 'react';
import { Platform, SectionList, SectionListData, SectionListProps, SectionListRenderItemInfo } from 'react-native';
import { BlurView, Text, View } from '../src/lib/native-unstyled';
import * as SystemUI from 'expo-system-ui';

const isHermes = () => !!((global as any)['HermesInternal']);
const isRemoteDebug = () => !((global as any)['nativeCallSyncHook']);
export function EnvironmentScreen(): ReactElement<SectionListProps<Record<string, unknown>>, any> {
    const { manifest, manifest2, systemFonts: _systemFonts, expoConfig, ...restOfConstants } = Constants;
    const [sections, setSections] = useDeepState<SectionListData<any>[]>([
        { key: "@env", data: [{ BASE_URL, TEXT_TEST, hermes: isHermes(), remoteDebug: isRemoteDebug() }] },
        { key: "SystemUI.backgroundColor", data: [] },
        {
            key: "expo-constants", data: [
                restOfConstants as Record<string, unknown>
            ]
        },
        {
            key: "expo-constants.expoConfig", data: [
                omit(expoConfig as unknown as Record<string, unknown>, "ios", "android", "web")
            ]
        },
        {
            key: "expo-constants.expoConfig." + Platform.OS, data: [
                (expoConfig as unknown as Record<string, unknown>)[Platform.OS]
            ]
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
            "SystemUI.backgroundColor": [{
                backgroundColor: await SystemUI.getBackgroundColorAsync()
            }]
        };
        return sections.map(section => (section.key! in replacements) ? { key: section.key!, data: replacements[section.key!] } : section)
    }
    const renderSectionHeader = useCallback(({ section }: { section: SectionListData<any, any> }) => <BlurView intensity={90} padding={16}><Text bold>{section.key}</Text></BlurView>, [sections]);
    const renderItem = useCallback(({ item }: SectionListRenderItemInfo<any>) => <View padding={16} backgroundColor="black"><Text color="silver">{JSON.stringify(item, null, 2)}</Text></View>, [sections])

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