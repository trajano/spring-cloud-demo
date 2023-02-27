import { act, renderHook } from "@testing-library/react-native";
import {
  getLocales,
  getCalendars,
  CalendarIdentifier,
} from "expo-localization";
import noop from "lodash/noop";

import { useConfiguredLocale } from "./useConfiguredLocale";

jest.mock("expo-localization");
afterEach(() => jest.restoreAllMocks());
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

it("translate switching", async () => {
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
  await act(() => setLocale("ja"));
  expect(t("switchToDarkColorScheme")).toBe(
    translations.ja.switchToDarkColorScheme
  );
});

it("use system locale", async () => {
  jest.mocked(getLocales).mockReturnValue([
    {
      languageTag: "ja-JP",
      languageCode: "ja",
      textDirection: "ltr",
      digitGroupingSeparator: ".",
      decimalSeparator: ",",
      measurementSystem: "metric",
      currencyCode: "JPY",
      currencySymbol: "¥",
      regionCode: "JP",
    },
  ]);
  jest.mocked(getCalendars).mockReturnValue([
    {
      calendar: CalendarIdentifier.GREGORIAN,
      timeZone: "Europe/Warsaw",
      uses24hourClock: true,
      firstWeekday: 1,
    },
  ]);

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

  expect(getLocales()[0].languageCode).toBe("ja");

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
  await act(() => Promise.resolve());
  const [locale, setLocale, t] = result.current;
  expect(locale).toBe("ja");
  expect(setLocale).toBeTruthy();
  expect(t("switchToDarkColorScheme")).toBe(
    translations.ja.switchToDarkColorScheme
  );
});
