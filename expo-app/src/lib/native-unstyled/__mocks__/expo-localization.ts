import { Calendar, CalendarIdentifier, Locale } from "expo-localization";

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
export function getCalendars(): Calendar[] {
  return [
    {
      calendar: CalendarIdentifier.GREGORIAN,
      timeZone: "Europe/Warsaw",
      uses24hourClock: true,
      firstWeekday: 1,
    },
  ];
}
