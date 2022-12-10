import type { Locale } from "expo-localization";

export function getLocales(): Locale[] {
  return [
    {
      languageTag: "en-US",
      languageCode: "en",
      regionCode: "US",
      currencyCode: "USD",
      currencySymbol: "$",
      decimalSeparator: ".",
      digitGroupingSeparator: ",",
      textDirection: "ltr",
      measurementSystem: "us",
    },
  ];
}
