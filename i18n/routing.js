import { defineRouting } from 'next-intl/routing';
import { DEFAULT_LOCALE, LOCALES } from './config';

export const routing = defineRouting({
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed',
  // Everyone starts in Armenian at the plain address; visitors switch with the language menu.
  localeDetection: false,
});
