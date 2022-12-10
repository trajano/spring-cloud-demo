import { BASE_URL, TEXT_TEST } from '@env';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as Localization from 'expo-localization';
import { ReactElement } from 'react';
import { SectionList, SectionListProps } from 'react-native';
import { Text } from '../src/lib/native-unstyled/hoc';
export function EnvironmentScreen(): ReactElement<SectionListProps<Record<string, unknown>>, any> {
    const { manifest, manifest2, expoConfig, ...restOfConstants } = Constants;
    const sections = [
        { key: "@env", data: [{ BASE_URL, TEXT_TEST }] },
        {
            key: "expo-constants", data: [
                restOfConstants as Record<string, unknown>
            ]
        },
        {
            key: "expo-constants.expoConfig", data: [expoConfig]
        },
        {
            key: "expo-constants.manifests", data: [manifest, manifest2]
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
    ];
    return <SectionList<Record<string, unknown>>
        sections={sections}
        renderItem={({ item }) => <Text>{JSON.stringify(item, null, 2)}</Text>}
        renderSectionHeader={({ section }) => <Text>{section.key}</Text>}
    />
}