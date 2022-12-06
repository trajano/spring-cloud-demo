import { createContext, useContext, useMemo, useEffect, useCallback, PropsWithChildren } from 'react';
import { Dict, I18n, I18nOptions, Scope, TranslateOptions } from "i18n-js";
import { Locale, getLocales } from 'expo-localization';
interface II18n {
    t(scope: Scope, options?: TranslateOptions): string;
    setLocale(locale: string): void
}
const I18nContext = createContext<II18n>({
    t: () => "",
    setLocale: () => { };
});
type I18nProviderProps = PropsWithChildren<{
    translations: Dict;
    i18nOptions?: I18nOptions;
    defaultLocale?: string;
    setLocale(nextLocale: string): void;
}>
function preferredLanguage(translations: Dict, preferredLocales: Locale[], defaultLanguage: string): string {
    const availableTranslations = Object.keys(translations);
    const preferredLocaleLanguageTags = preferredLocales.flatMap((preferredLocale) => [preferredLocale.languageTag, preferredLocale.languageCode]);
    return preferredLocaleLanguageTags
        .find((language) => availableTranslations.indexOf(language) !== -1) ?? defaultLanguage;
}

export function I18nProvider({ children, defaultLocale, translations, i18nOptions: translateOptions }: I18nProviderProps) {
    const i18n = useMemo(() => new I18n(translations, translateOptions), [translations, translateOptions]);
    const t = useCallback((scope: Scope, options?: TranslateOptions) => i18n.t(scope, options), [i18n]);
    useEffect(
        () => {
            if (defaultLocale) {
                i18n.locale = defaultLocale;
            } else {
                i18n.locale = preferredLanguage(translations, getLocales(), i18n.defaultLocale);
            }
        },
        [translations]);
    const setLocale = useCallback((nextLocale: string) => { i18n.locale = nextLocale }, [i18n])
    return <I18nContext.Provider value={{ t, setLocale }}>{children}</I18nContext.Provider>
}
export function useI18n() {
    return useContext(I18nContext);
}