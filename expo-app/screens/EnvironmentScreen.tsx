import { BASE_URL, TEXT_TEST } from "@env";
import { useFocusEffect } from "@react-navigation/native";
import { useDeepState } from "@trajano/react-hooks";
import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as Localization from "expo-localization";
import * as SystemUI from "expo-system-ui";
import omit from "lodash/omit";
import { ReactElement, useCallback } from "react";
import {
  PixelRatio,
  Platform,
  SectionList,
  SectionListData,
  SectionListProps,
  SectionListRenderItemInfo,
  useColorScheme,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlurView, Text, View } from "../src/lib/native-unstyled";

const isHermes = () => !!(global as any).HermesInternal;
const isRemoteDebug = () => !(global as any).nativeCallSyncHook;
function tokenReplacer(this: any, key: string, value: any): any {
  if ((key === "key" || key === "hash") && typeof value === "string") {
    return `…${value.slice(-5)}`;
  } else {
    return value;
  }
}
export function EnvironmentScreen(): ReactElement<
  SectionListProps<Record<string, unknown>>,
  any
> {
  const { manifest, manifest2, expoConfig, ...restOfConstants } = omit(
    Constants,
    "systemFonts"
  );
  const systemColorScheme = useColorScheme();
  const safeAreaInsets = useSafeAreaInsets();
  const windowDimensions = useWindowDimensions();

  const [sections, setSections] = useDeepState<SectionListData<any>[]>([
    {
      key: "@env",
      data: [
        {
          BASE_URL,
          TEXT_TEST,
          hermes: isHermes(),
          remoteDebug: isRemoteDebug(),
          systemColorScheme,
          safeAreaInsets,
          PixelRatio: PixelRatio.get(),
          PixelRatio_fontScale: PixelRatio.getFontScale(),
        },
        process.env,
        windowDimensions,
      ],
    },
    { key: "SystemUI.backgroundColor", data: [] },
    {
      key: "expo-constants",
      data: [restOfConstants as Record<string, unknown>],
    },
    {
      key: "expo-constants.expoConfig",
      data: [
        omit(
          expoConfig as unknown as Record<string, unknown>,
          "ios",
          "android",
          "web"
        ),
      ],
    },
    {
      key: `expo-constants.expoConfig.${Platform.OS}`,
      data: [(expoConfig as unknown as Record<string, unknown>)[Platform.OS]],
    },
    {
      key: manifest ? "expo-constants.manifest" : "expo-constants.manifest2",
      data: [
        manifest
          ? (manifest as Record<string, unknown>)
          : omit(manifest2 as Record<string, unknown>, "launchAsset", "assets"),
      ],
    },
    {
      key: "expo-constants.manifest2.launchAsset",
      data: [manifest2?.launchAsset],
    },
    {
      key: "expo-constants.manifest2.assets",
      data: manifest2?.assets ?? [],
    },
    {
      key: `expo-constants.manifest2.${Platform.OS}`,
      data: manifest2 ? [(manifest2 as unknown as Record<string, unknown>)[Platform.OS]] : [],
    },
    {
      key: "expo-file-system",
      data: [
        {
          cacheDirectory: FileSystem.cacheDirectory,
          documentDirectory: FileSystem.documentDirectory,
          bundleDirectory: FileSystem.bundleDirectory,
          bundledAssets: FileSystem.bundledAssets,
        },
      ],
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
  const computeSectionsWithPromises = useCallback(async (): Promise<
    SectionListData<any>[]
  > => {
    const replacements: Record<string, any> = {
      "expo-localization.Locales": await Promise.resolve(
        Localization.getLocales()
      ),
      "expo-localization.Calendars": await Promise.resolve(
        Localization.getCalendars()
      ),
      "SystemUI.backgroundColor": [
        {
          backgroundColor: await SystemUI.getBackgroundColorAsync(),
        },
      ],
    };
    return sections.map((section) =>
      section.key! in replacements
        ? { key: section.key!, data: replacements[section.key!] }
        : section
    );
  }, [sections]);
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

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setSections(await computeSectionsWithPromises());
      })();
    }, [computeSectionsWithPromises, setSections])
  );
  return (
    <SectionList<any>
      sections={sections}
      renderItem={renderItem}
      renderSectionHeader={renderSectionHeader}
    />
  );
}
