import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'de', 'it', 'zh'],
  defaultLocale: 'en',
  // Force all users to use English by default
  localeDetection: false
});