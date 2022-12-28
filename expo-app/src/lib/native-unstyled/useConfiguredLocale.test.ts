import { renderHook } from "@testing-library/react-hooks";
import { locale } from "expo-localization";
import type { Dispatch, SetStateAction } from "react";
import { useConfiguredLocale } from "./useConfiguredLocale";

it("translate", () => {
  const translations = {
    "en-CA": {
      switchToDarkColorScheme: "Switch to Dark Colour Scheme",
      switchToLightColorScheme: "Switch to Light Colour Scheme",
    },
    "en-US": {
      switchToDarkColorScheme: "Switch to Dark Color Scheme",
      switchToLightColorScheme: "Switch to Light Color Scheme",
    },
    en: {
      switchToDarkColorScheme: "Switch to Dark Colour Scheme",
      switchToLightColorScheme: "Switch to Light Colour Scheme",
    },
  };
  const { result } = renderHook(
    ({ inLocale, defaultLocale }) =>
      useConfiguredLocale(inLocale, defaultLocale, translations),
    {
      initialProps: {
        inLocale: undefined,
        defaultLocale: "en-US",
      },
    }
  );
  const [locale, setLocale, t] = result.current;
  expect(locale).toBe("en-US");
  expect(setLocale).toBeTruthy();
  expect(t("switchToDarkColorScheme")).toBe("Switch to Dark Color Scheme");
});

it("translate to just en", () => {
  const translations = {
    en: {
      switchToDarkColorScheme: "Switch to Dark Colour Scheme",
      switchToLightColorScheme: "Switch to Light Colour Scheme",
    },
  };
  const { result } = renderHook(
    ({ inLocale, defaultLocale }) =>
      useConfiguredLocale(inLocale, defaultLocale, translations),
    {
      initialProps: {
        inLocale: undefined,
        defaultLocale: "en",
      },
    }
  );
  const [locale, setLocale, t] = result.current;
  expect(locale).toBe("en");
  expect(setLocale).toBeTruthy();
  expect(t("switchToDarkColorScheme")).toBe("Switch to Dark Colour Scheme");
});
