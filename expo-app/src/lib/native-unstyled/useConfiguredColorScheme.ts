import { useAsyncSetEffect } from "@trajano/react-hooks";
import { useMemo, useState } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

export function useConfiguredColorSchemes(
  inColorScheme:
    | NonNullable<ColorSchemeName>
    | (() => Promise<NonNullable<ColorSchemeName>>)
    | undefined,
  defaultColorScheme: NonNullable<ColorSchemeName>
): [NonNullable<ColorSchemeName>, (v: ColorSchemeName | null) => void] {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorSchemeName | null>(() => {
    if (typeof inColorScheme === "string") {
      return inColorScheme;
    } else {
      return null;
    }
  });
  useAsyncSetEffect(
    async () => {
      if (typeof inColorScheme === "function") {
        return await inColorScheme();
      } else {
        return colorScheme;
      }
    },
    setColorScheme,
    [setColorScheme, inColorScheme]
  );

  const computedColorScheme = useMemo(
    () => (colorScheme ? colorScheme : systemColorScheme ?? defaultColorScheme),
    [colorScheme, systemColorScheme, defaultColorScheme]
  );
  return [computedColorScheme, setColorScheme];
}
