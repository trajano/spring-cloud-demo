import { act, renderHook } from "@testing-library/react-hooks";
import noop from "lodash/noop";

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
      useConfiguredLocale(inLocale, defaultLocale, translations, noop),
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
  expect(t).toBeTruthy();
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
      useConfiguredLocale(inLocale, defaultLocale, translations, noop),
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

it("translate switching", () => {
  const translations = {
    en: {
      switchToDarkColorScheme: "Switch to Dark Colour Scheme",
      switchToLightColorScheme: "Switch to Light Colour Scheme",
    },
    ja: {
      switchToDarkColorScheme: "ダークモード",
      switchToLightColorScheme: "ライトモード",
    },
  };
  const { result } = renderHook(
    ({ inLocale, defaultLocale }) =>
      useConfiguredLocale(inLocale, defaultLocale, translations, noop),
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
  expect(t("switchToDarkColorScheme")).toBe(
    translations.en.switchToDarkColorScheme
  );
  act(() => setLocale("ja"));
  expect(t("switchToDarkColorScheme")).toBe(
    translations.ja.switchToDarkColorScheme
  );
});
