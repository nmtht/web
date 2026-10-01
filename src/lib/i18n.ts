import type { LocaleString } from './graph-types';

export type Locale = 'en' | 'ru';

let currentLang: Locale = 'en';

export function getLang(): Locale {
  return currentLang;
}

export function setLang(lang: Locale): void {
  currentLang = lang;
}

export function L(obj: LocaleString): string {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[currentLang] || obj.en || obj.ru || '';
}

export const DEFAULT_UI = {
  hint: {
    en: 'click to expand. drag to move. scroll to zoom.',
    ru: 'нажмите, чтобы раскрыть. перетащите, чтобы передвинуть. прокрутите для масштаба.',
  },
  resetMap: { en: 'reset map', ru: 'сбросить карту' },
  seed: { en: "name what's next.", ru: 'а что потом?' },
  that: { en: 'THAT!', ru: 'это!' },
  think: { en: 'THINK', ru: 'мысль' },
  next: { en: 'NEXT', ru: 'после' },
  related: { en: 'Related', ru: 'Связанное' },
  practice: { en: 'Practice', ru: 'Практика' },
  founder: { en: 'Author', ru: 'Автор' },
  contact: { en: 'Contact', ru: 'Контакт' },
};
