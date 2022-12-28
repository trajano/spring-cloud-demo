import { useAsyncSetEffect } from "@trajano/react-hooks";
import { getLocales } from "expo-localization";
import { Dict, I18n, I18nOptions, Scope, TranslateOptions } from "i18n-js";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useConfiguredLocale(
  inLocale: string | (() => Promise<string>) | undefined,
  defaultLocale: string,
  translations: Dict,
  i18nOptions?: I18nOptions
): [
  string,
  (v: string | null) => void,
  (scope: Scope, options?: TranslateOptions) => string
] {
  const systemLocale = useMemo(() => {
    const locales = getLocales();
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
  }, [translations]);
  const [locale, setLocale] = useState<string | null>(() => {
    if (typeof inLocale === "string") {
      return inLocale;
    } else {
      return null;
    }
  });
  useAsyncSetEffect(
    async () => {
      if (typeof inLocale === "function") {
        return await inLocale();
      } else {
        return locale;
      }
    },
    setLocale,
    [setLocale, inLocale]
  );

  const i18n = useMemo(
    () => new I18n(translations, i18nOptions),
    [translations, i18nOptions]
  );
  const t = useCallback(
    (scope: Scope, options?: TranslateOptions) => i18n.t(scope, options),
    [i18n]
  );

  const computedLocale = useMemo(
    () => (locale ? locale : systemLocale ?? defaultLocale),
    [locale, systemLocale, defaultLocale]
  );

  useEffect(() => {
    i18n.locale = computedLocale;
  }, [i18n, computedLocale]);
  return [computedLocale, setLocale, t];
}
