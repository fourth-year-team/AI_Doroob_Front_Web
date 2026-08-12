import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { en, type TranslationDict } from './en';
import { ar } from './ar';

export type Lang = 'en' | 'ar';

export type PathImpl<T, K extends keyof T> = K extends string
  ? T[K] extends Record<string, unknown>
    ? `${K}.${PathImpl<T[K], keyof T[K]>}`
    : K
  : never;

export type I18nKey = PathImpl<TranslationDict, keyof TranslationDict>;

const DICTS: Record<Lang, TranslationDict> = { en, ar };
const STORAGE_KEY = 'aegis.lang';

function resolve(dict: TranslationDict, path: string): string {
  let node: unknown = dict;
  for (const part of path.split('.')) {
    if (node && typeof node === 'object' && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof node === 'string' ? node : path;
}

interface I18nValue {
  lang: Lang;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: I18nKey | (string & {}), vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function initialLang(): Lang {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'ar') return stored;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const value = useMemo<I18nValue>(() => {
    const dict = DICTS[lang];
    const t = (key: I18nKey | (string & {}), vars?: Record<string, string | number>) => {
      let text = resolve(dict, key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    };
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      setLang: setLangState,
      toggleLang: () => setLangState((l) => (l === 'en' ? 'ar' : 'en')),
      t,
    };
  }, [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
