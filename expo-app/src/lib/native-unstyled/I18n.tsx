import { Locale, getLocales } from "expo-localization";
import { Dict, I18n, I18nOptions, Scope, TranslateOptions } from "i18n-js";
import {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useEffect,
  useState,
  PropsWithChildren,
} from "react";
interface II18n {
  t(scope: Scope, options?: TranslateOptions): string;
  setLocale(locale: string): void;
}
const I18nContext = createContext<II18n>({
  t: () => "",
  setLocale: () => { },
});
type I18nProviderProps = PropsWithChildren<{
  /**
   * Translations, defaults to an empty dictionary.a
   */
  translations?: Dict;
  i18nOptions?: I18nOptions;
  /**
   * Locale to use.  If not present it will use the system if not available it will use the default.
   * If a function is provided it will use the value of the function as the intial locale, but uses 
   * defaultLocale while it is starting up.
   */
  locale?: string | (() => Promise<string>);
  /**
   * 
   */
  defaultLocale: string;
}>;

export function I18nProvider({
  children,
  locale: inLocale,
  defaultLocale,
  translations = {},
  i18nOptions: translateOptions,
}: I18nProviderProps) {
  const i18n = useMemo(
    () => new I18n(translations, translateOptions),
    [translations, translateOptions]
  );
  const t = useCallback(
    (scope: Scope, options?: TranslateOptions) => i18n.t(scope, options),
    [i18n]
  );
  const systemLocale = useMemo(() => {
    const locales = getLocales();
    if (typeof locales === "object" && Array.isArray(locales)) {
      return getLocales()
        .filter(p => p.languageTag in translations || p.languageCode in translations)
        .map(p => p.languageTag)[0]
    } else {
      return undefined;
    }
  },
    [translations]);

  const [locale, setLocale] = useState<string | null>(() => {
    if (typeof inLocale === "string") {
      return inLocale;
    } else {
      return null
    }
  });

  useEffect(() => {
    i18n.locale = locale ? locale : (systemLocale ?? defaultLocale);
  }, [i18n, locale, defaultLocale])

  const contextValue = useMemo(() => ({ t, setLocale }), [t, setLocale]);
  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}
export function useI18n() {
  return useContext(I18nContext);
}
