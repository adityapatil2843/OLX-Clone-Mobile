import { create } from 'zustand';
import { Locale, ThemeMode } from '../types/common';
import i18n from '../i18n';

interface AppState {
  locale: Locale;
  themeMode: ThemeMode;
  selectedCity: string;
  setLocale: (locale: Locale) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setSelectedCity: (city: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  locale: 'en',
  themeMode: 'system',
  selectedCity: 'All India',
  setLocale: (locale: Locale) => {
    i18n.changeLanguage(locale);
    set({ locale });
  },
  setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
  setSelectedCity: (selectedCity: string) => set({ selectedCity }),
}));
