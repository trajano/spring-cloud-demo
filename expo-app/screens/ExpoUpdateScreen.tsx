import { useFocusEffect } from "@react-navigation/native";
import { useDeepState } from "@trajano/react-hooks";
import {
  channel,
  checkForUpdateAsync,
  createdAt,
  isEmbeddedLaunch,
  isEmergencyLaunch,
  manifest as updateManifest,
  readLogEntriesAsync,
  releaseChannel,
  runtimeVersion,
  updateId,
} from "expo-updates";
import omit from "lodash/omit";
import { ReactElement, useCallback } from "react";
import {
  SectionList,
  SectionListData,
  SectionListProps,
  SectionListRenderItemInfo,
} from "react-native";

import {
  BlurView,
  Text,
  useRefreshControl,
  View,
} from "../src/lib/native-unstyled";

function tokenReplacer(this: any, key: string, value: any): any {
  if ((key === "key" || key === "hash") && typeof value === "string") {
    return `…${value.slice(-5)}`;
  } else if (key === "stacktrace" && Array.isArray(value)) {
    return undefined;
  } else {
    return value;
  }
}
export function ExpoUpdateScreen(): ReactElement<
  SectionListProps<Record<string, unknown>>,
  any
> {
  const [sections, setSections] = useDeepState<SectionListData<any>[]>([
    {
      key: "expo-update",
      data: [
        {
          channel,
          createdAt,
          isEmbeddedLaunch,
          isEmergencyLaunch,
          manifest: omit(updateManifest, "assets"),
          releaseChannel,
          runtimeVersion,
          updateId,
        },
      ],
    },
    {
      key: "expo-update.manifest.assets",
      data: updateManifest?.assets ?? [],
    },
    {
      key: "expo-update.logEntries",
      data: [],
    },
  ]);
  const computeSectionsWithPromises = useCallback(async (): Promise<
    SectionListData<any>[]
  > => {
    const replacements: Record<string, any> = {
      "expo-update.logEntries": await readLogEntriesAsync(),
    };
    return sections.map((section) =>
      section.key! in replacements
        ? { key: section.key!, data: replacements[section.key!] }
        : section
    );
  },[sections])
  const renderSectionHeader = useCallback(
    ({ section }: { section: SectionListData<any, any> }) => (
      <BlurView intensity={90} padding={16}>
        <Text bold>{section.key}</Text>
      </BlurView>
    ),
    []
  );
  const renderItem = useCallback(
    ({ item }: SectionListRenderItemInfo<any>) => (
      <View padding={16} backgroundColor="black">
        <Text color="silver">{JSON.stringify(item, tokenReplacer, 2)}</Text>
      </View>
    ),
    []
  );
  const refreshControl = useRefreshControl(async () => {
    await checkForUpdateAsync();
  });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setSections(await computeSectionsWithPromises());
      })();
    }, [computeSectionsWithPromises, setSections])
  );
  return (
    <SectionList<any>
      refreshControl={refreshControl}
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
    />
  );
}
