// Shared by server, client and middleware. Armenian is the default and has no URL prefix;
// other languages live under /en/… and /ru/….
export const LOCALES = ['en', 'hy', 'ru'];
export const DEFAULT_LOCALE = 'hy';
// Content is written in English in the admin; other languages are translations with English as the fallback.
export const CONTENT_LOCALE = 'en';
export const LOCALE_NAMES = { en: 'English', hy: 'Հայերեն', ru: 'Русский' };
export const LOCALE_SHORT = { en: 'EN', hy: 'AM', ru: 'RU' };

// Prefixes an internal path with the locale ("/c/all" → "/ru/c/all"); Armenian stays as-is.
export const localePath = (path, locale) => (locale === DEFAULT_LOCALE ? path : `/${locale}${path === '/' ? '' : path}`);
