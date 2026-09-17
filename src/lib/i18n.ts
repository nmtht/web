/**
 * Field-level i18n helper.
 * Matches Sanity localeString / localeText shape and the prototype L().
 */

export type Locale = 'en' | 'ru';

export type LocaleString = { en?: string; ru?: string } | string;

let currentLang: Locale = 'en';

export function getLang(): Locale {
  return currentLang;
}

export function setLang(lang: Locale): void {
  currentLang = lang;
}

export function L(obj: LocaleString | null | undefined): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] || obj.en || '';
}
