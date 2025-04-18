import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { UserSettings } from '@/context/SettingsContext';

// Importazione delle traduzioni
import translationIT from './locales/it-IT.json';
import translationEN from './locales/en-US.json';
import translationGB from './locales/en-GB.json';
import translationFR from './locales/fr-FR.json';
import translationDE from './locales/de-DE.json';
import translationES from './locales/es-ES.json';

const resources = {
  'it-IT': {
    translation: translationIT
  },
  'en-US': {
    translation: translationEN
  },
  'en-GB': {
    translation: translationGB
  },
  'fr-FR': {
    translation: translationFR
  },
  'de-DE': {
    translation: translationDE
  },
  'es-ES': {
    translation: translationES
  }
};

// Funzione per caricare la lingua dalle impostazioni utente
export const loadLanguageFromSettings = (): string => {
  try {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings) as UserSettings;
      return settings.language || 'it-IT';
    }
  } catch (error) {
    console.error("Errore nel caricamento della lingua dalle impostazioni:", error);
  }
  return 'it-IT'; // Lingua predefinita
};

i18n
  // Rileva la lingua del browser
  .use(LanguageDetector)
  // Passa l'i18n a react-i18next
  .use(initReactI18next)
  // Inizializza i18next
  .init({
    resources,
    lng: loadLanguageFromSettings(),
    fallbackLng: 'it-IT',
    interpolation: {
      escapeValue: false // React è già protetto da XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    }
  });

// Funzione per cambiare lingua dinamicamente
export const changeLanguage = (language: string) => {
  i18n.changeLanguage(language);
};

export default i18n; 