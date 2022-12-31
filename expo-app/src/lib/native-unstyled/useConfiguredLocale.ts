import { getLocales, Locale } from "expo-localization";
import { Dict, I18n, I18nOptions, Scope, TranslateOptions } from "i18n-js";
import { useCallback, useMemo, useReducer } from "react";

function computeSystemLocale(locales: Locale[], translations: Dict) {
  if (typeof locales === "object" && Array.isArray(locales)) {
    // find by full language tag first
    const languageTag = locales
      .filter((p) => p.languageTag in translations)
      .map((p) => p.languageTag)[0];

    // then language code
    const languageCode = locales
      .filter((p) => p.languageCode in translations)
      .map((p) => p.languageCode)[0];
    return languageTag || languageCode;
  } else {
    return undefined;
  }
}
export function useConfiguredLocale(
  inLocale: string | null | undefined,
  defaultLocale: string,
  translations: Dict,
  onLocaleChange: (nextLocale: string | null) => void,
  i18nOptions?: I18nOptions
): [
  string,
  (v: string | null) => void,
  (scope: Scope, options?: TranslateOptions) => string
] {
  const systemLocale = useMemo(() => {
    const locales = getLocales();
    return computeSystemLocale(locales, translations);
  }, [translations]);

  const i18n = useMemo(
    () => new I18n(translations, i18nOptions),
    [translations, i18nOptions]
  );

  const [locale, setLocale] = useReducer(
    (prev: string, next: string | null): string => {
      let nextLocale = systemLocale ?? defaultLocale;
      if (typeof next === "string") {
        nextLocale = next;
      }
      i18n.locale = nextLocale;

      return prev === nextLocale ? prev : nextLocale;
    },
    inLocale,
    (loc) => {
      let nextLocale = systemLocale ?? defaultLocale;
      if (typeof loc === "string") {
        nextLocale = loc;
      }
      i18n.locale = nextLocale;
      return nextLocale;
    }
  );

  const t = useCallback(
    (scope: Scope, options?: TranslateOptions) => {
      // this conditional allows for the short form.
      if (Array.isArray(scope)) {
        return i18n.t(
          scope.filter((p) => p.length > 0),
          options
        );
      } else {
        return i18n.t(scope, options);
      }
    },
    [i18n, locale]
  );

  const setLocaleWithNotification = useCallback(
    (nextLocale: string | null) => {
      setLocale(nextLocale);
      onLocaleChange(nextLocale);
    },
    [onLocaleChange, setLocale]
  );

  return [locale, setLocaleWithNotification, t];
}
