import AsyncStorage from '@react-native-async-storage/async-storage';
import { KeyValuePair } from '@react-native-async-storage/async-storage/lib/typescript/types';
import { useFocusEffect } from '@react-navigation/native';
import { useDeepState } from '@trajano/react-hooks';
import { useCallback } from 'react';
import { SectionList, SectionListData, SectionListRenderItemInfo } from 'react-native';

import { Text, View } from '../src/lib/native-unstyled';

type AsyncStorageSection = { key: string, data: string[] }
type AsyncStorageSectionListData = SectionListData<string, AsyncStorageSection>
export function AuthStorageScreen() {

    async function storageToSections(): Promise<AsyncStorageSectionListData[]> {
        const keys = await AsyncStorage.getAllKeys();
        const kvps = await AsyncStorage.multiGet([...keys].sort((a, b) => a.localeCompare(b)));
        return kvps.reduce<AsyncStorageSectionListData[]>((prev, kvp: KeyValuePair) => [...prev, { key: kvp[0], data: [kvp[1]!] }], []);

    }

    const [sections, setSections] = useDeepState<AsyncStorageSectionListData[]>([]);

    useFocusEffect(useCallback(function update() {
        (async () => {
            setSections(await storageToSections());
        })();
    }, []))

    function renderItem({ item }: SectionListRenderItemInfo<string, AsyncStorageSection>) {
        try {
            const json = JSON.stringify(JSON.parse(item), null, 2);
            return <Text>{json}</Text>
        } catch (e) {
            // assume it is not parsable as JSON show the string as is
            return <Text>{item}</Text>
        }
    }

    return <SectionList<string, AsyncStorageSection>
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => <View backgroundColor="white"><Text bold>{section.key}</Text></View>}
    />
}
