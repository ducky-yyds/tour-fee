import React, { createContext, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';
import { getLocale, setLocale, subscribeLocale, translate } from './localization.mjs';

const LocaleContext = createContext(null);
export const TranslationScope = createContext(true);
export function LocaleProvider({ children }) {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, () => 'zh');
  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'zh-CN';
    document.documentElement.dataset.locale = locale;
    document.title = locale === 'en' ? 'Wayfarer · Travel & living costs' : '途算 · 旅行与旅居预算';
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: text => translate(text, locale) }), [locale]);
  return React.createElement(LocaleContext.Provider, { value }, children);
}
export function useLocale() {
  return useContext(LocaleContext) || { locale: getLocale(), setLocale, t: translate };
}
export function LanguageSwitch() {
  const { locale, setLocale } = useLocale();
  return <div className="language-switch" role="group" aria-label="Language / 界面语言" translate="no">
    <button type="button" lang="zh-CN" aria-pressed={locale === 'zh'} onClick={() => setLocale('zh')}>中文</button>
    <button type="button" lang="en" aria-pressed={locale === 'en'} onClick={() => setLocale('en')}>EN</button>
  </div>;
}
