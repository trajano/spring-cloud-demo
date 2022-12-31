import { useCallback, useMemo, useState } from "react";
import { ColorSchemeName, useColorScheme } from "react-native";

export function useConfiguredColorSchemes(
  inColorScheme: ColorSchemeName,
  defaultColorScheme: NonNullable<ColorSchemeName>,
  onColorSchemeChange: (nextColorScheme: ColorSchemeName) => void
): [NonNullable<ColorSchemeName>, (v: ColorSchemeName | null) => void] {
  const systemColorScheme = useColorScheme();
  const [colorScheme, setColorScheme] = useState<ColorSchemeName | null>(() => {
    if (typeof inColorScheme === "string") {
      return inColorScheme;
    } else {
      return null;
    }
  });
  const setColorSchemeWithNotification = useCallback(
    (nextColorScheme: ColorSchemeName) => {
      setColorScheme(nextColorScheme);
      onColorSchemeChange(nextColorScheme);
    },
    [onColorSchemeChange, setColorScheme]
  );

  const computedColorScheme = useMemo(
    () => (colorScheme ? colorScheme : systemColorScheme ?? defaultColorScheme),
    [colorScheme, systemColorScheme, defaultColorScheme]
  );
  return [computedColorScheme, setColorSchemeWithNotification];
}
