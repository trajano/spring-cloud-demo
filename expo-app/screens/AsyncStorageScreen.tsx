import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyValuePair } from "@react-native-async-storage/async-storage/lib/typescript/types";
import { useFocusEffect } from "@react-navigation/native";
import { useDeepState } from "@trajano/react-hooks";
import { useCallback } from "react";
import {
  SectionList,
  SectionListData,
  SectionListRenderItemInfo,
} from "react-native";

import { BlurView, Text, useRefreshControl } from "../src/lib/native-unstyled";

type AsyncStorageSection = { key: string; data: string[] };
type AsyncStorageSectionListData = SectionListData<string, AsyncStorageSection>;
function tokenReplacer(this: any, key: string, value: any): any {
  if (
    (key === "access_token" || key === "refresh_token") &&
    typeof value === "string"
  ) {
    return "…" + value.slice(-5);
  } else {
    return value;
  }
}
export function AsyncStorageScreen() {
  async function storageToSections(): Promise<AsyncStorageSectionListData[]> {
    const keys = await AsyncStorage.getAllKeys();
    const kvps = await AsyncStorage.multiGet(
      [...keys].sort((a, b) => a.localeCompare(b))
    );
    return kvps.reduce<AsyncStorageSectionListData[]>(
      (prev, kvp: KeyValuePair) => [...prev, { key: kvp[0], data: [kvp[1]!] }],
      []
    );
  }

  const [sections, setSections] = useDeepState<AsyncStorageSectionListData[]>(
    []
  );
  const refreshControl = useRefreshControl(async () => {
    setSections(await storageToSections());
  });
  useFocusEffect(
    useCallback(function update() {
      (async () => {
        setSections(await storageToSections());
      })();
    }, [])
  );

  const renderItem = useCallback(function renderItem({
    item,
  }: SectionListRenderItemInfo<string, AsyncStorageSection>) {
    try {
      const json = JSON.stringify(JSON.parse(item), tokenReplacer, 2);
      return <Text>{json}</Text>;
    } catch (_e: unknown) {
      // assume it is not parsable as JSON show the string as is
      return <Text>{item}</Text>;
    }
  },
  []);

  const renderSectionHeader = useCallback(
    ({
      section,
    }: {
      section: SectionListData<string, AsyncStorageSection>;
    }) => (
      <BlurView padding={16}>
        <Text bold>{section.key}</Text>
      </BlurView>
    ),
    []
  );

  return (
    <SectionList<string, AsyncStorageSection>
      refreshControl={refreshControl}
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
    />
  );
}
