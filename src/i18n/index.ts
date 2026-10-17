import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { env } from '../config/env';
import en from './resources/en.json';
import hi from './resources/hi.json';
import mr from './resources/mr.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources,
      lng: env.DEFAULT_LOCALE,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes values safely
      },
      react: {
        useSuspense: false,
      },
    });
}

export default i18n;
