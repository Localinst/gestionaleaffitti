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
  
  // Se non ci sono impostazioni, prova a rilevare la lingua dai parametri URL o dal browser
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  
  if (langParam && Object.keys(resources).includes(langParam)) {
    return langParam;
  }
  
  // Prova a rilevare la lingua del browser
  const browserLang = navigator.language;
  const supported = Object.keys(resources);
  
  // Controlla se la lingua del browser è supportata
  if (supported.includes(browserLang)) {
    return browserLang;
  }
  
  // Controlla se esiste una variante della lingua del browser
  const langPrefix = browserLang.split('-')[0];
  const match = supported.find(lang => lang.startsWith(langPrefix));
  if (match) {
    return match;
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
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage']
    }
  });

// Funzione per cambiare lingua dinamicamente
export const changeLanguage = (language: string) => {
  try {
    // Cambia la lingua in i18next
    i18n.changeLanguage(language);
    
    // Salva l'impostazione della lingua nelle userSettings di localStorage
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const settings = JSON.parse(savedSettings) as UserSettings;
      settings.language = language;
      localStorage.setItem("userSettings", JSON.stringify(settings));
    } else {
      // Se non esistono impostazioni, crea un nuovo oggetto con solo la lingua
      const newSettings: UserSettings = {
        language,
        theme: "system",
        fontSize: "medium",
        animationsEnabled: true,
        autoSave: true,
        confirmDialogs: true,
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        contractNotifications: true,
        tenantNotifications: true,
        systemNotifications: true
      };
      localStorage.setItem("userSettings", JSON.stringify(newSettings));
    }
    
    // Optional: aggiorna il parametro di query nell'URL (utile per le pagine pubbliche)
    // ma solo se non siamo in un'area autenticata
    if (!localStorage.getItem('authToken') && !window.location.pathname.startsWith('/dashboard')) {
      const url = new URL(window.location.href);
      url.searchParams.set('lang', language);
      window.history.replaceState({}, '', url.toString());
    }
  } catch (error) {
    console.error("Errore nel salvataggio della lingua:", error);
  }
};

// Mappa delle lingue supportate
export const supportedLanguages = {
  'it-IT': {
    code: 'it',
    name: 'Italiano',
    flagEmoji: '🇮🇹'
  },
  'en-US': {
    code: 'en',
    name: 'English (US)',
    flagEmoji: '🇺🇸'
  },
  'en-GB': {
    code: 'en-gb',
    name: 'English (UK)',
    flagEmoji: '🇬🇧'
  },
  'fr-FR': {
    code: 'fr',
    name: 'Français',
    flagEmoji: '🇫🇷'
  },
  'de-DE': {
    code: 'de',
    name: 'Deutsch',
    flagEmoji: '🇩🇪'
  },
  'es-ES': {
    code: 'es',
    name: 'Español',
    flagEmoji: '🇪🇸'
  }
};

// Funzione per ottenere la lingua corrente
export const getCurrentLanguage = () => {
  return i18n.language || loadLanguageFromSettings();
};

/**
 * Genera gli URL per le lingue alternative per una pagina specifica
 * @param currentPath Il percorso corrente della pagina
 * @param baseUrl L'URL base del sito
 * @param preferQueryParams Se true, genera URL con parametri di query, altrimenti con prefissi
 * @returns Un array di oggetti {locale, url} per tutti i tag hreflang
 */
export const getHreflangUrls = (
  currentPath: string, 
  baseUrl = 'https://tenoris360.com',
  preferQueryParams = false
): Array<{locale: string, url: string}> => {
  // Rimuovi eventuali parametri di query dal percorso corrente
  const pathWithoutQuery = currentPath.split('?')[0];
  
  // Determina se il percorso ha già un prefisso di lingua
  const langPrefixes = ['/en', '/fr', '/de', '/es', '/it', '/en-gb'];
  const currentPrefix = langPrefixes.find(prefix => 
    pathWithoutQuery === prefix || pathWithoutQuery.startsWith(`${prefix}/`)
  );
  
  // Percorso senza prefisso di lingua (se presente)
  const cleanPath = currentPrefix 
    ? (pathWithoutQuery === currentPrefix ? '/' : pathWithoutQuery.substring(currentPrefix.length)) 
    : pathWithoutQuery;
  
  // Se siamo in area dashboard o autenticata, usa i parametri di query
  // Altrimenti usa i prefissi per le pagine pubbliche (SEO)
  const isAuthenticatedArea = pathWithoutQuery.includes('/dashboard') || 
                            pathWithoutQuery.includes('/properties') || 
                            pathWithoutQuery.includes('/tenants') || 
                            pathWithoutQuery.includes('/settings') || 
                            pathWithoutQuery.includes('/profile') || 
                            (localStorage.getItem('authToken') && !pathWithoutQuery.includes('/blog') && !pathWithoutQuery.includes('/guide'));
  
  // Decidi quale approccio usare (preferisci i prefissi per le pagine pubbliche)
  const useQueryParams = preferQueryParams || isAuthenticatedArea;
  
  // Crea array di oggetti hreflang
  const hreflangUrls = Object.entries(supportedLanguages).map(([langKey, langData]) => {
    if (useQueryParams) {
      // Approccio con parametri di query (per aree autenticate)
      return {
        locale: langData.code,
        url: `${baseUrl}${cleanPath}?lang=${langKey}`
      };
    } else {
      // Approccio con prefissi (per pagine pubbliche - SEO)
      // Mappa speciale per URL specifici tradotti
      const urlMapping: Record<string, Record<string, string>> = {
        '/guide': {
          'en-US': '/en/guides',
          'en-GB': '/en-gb/guides',
          'fr-FR': '/fr/guides',
          'de-DE': '/de/anleitungen',
          'es-ES': '/es/guias',
          'it-IT': '/guide'
        },
        '/termini': {
          'en-US': '/en/terms',
          'en-GB': '/en-gb/terms',
          'fr-FR': '/fr/conditions',
          'de-DE': '/de/bedingungen',
          'es-ES': '/es/terminos',
          'it-IT': '/termini'
        },
        '/privacy': {
          'en-US': '/en/privacy',
          'en-GB': '/en-gb/privacy',
          'fr-FR': '/fr/confidentialite',
          'de-DE': '/de/datenschutz',
          'es-ES': '/es/privacidad',
          'it-IT': '/privacy'
        },
        '/rimborsi': {
          'en-US': '/en/refunds',
          'en-GB': '/en-gb/refunds',
          'fr-FR': '/fr/remboursements',
          'de-DE': '/de/ruckerstattungen',
          'es-ES': '/es/reembolsos',
          'it-IT': '/rimborsi'
        }
      };
      
      // Controllo se il percorso pulito corrisponde a una mappatura speciale
      if (urlMapping[cleanPath]?.[langKey]) {
        return {
          locale: langData.code,
          url: `${baseUrl}${urlMapping[cleanPath][langKey]}`
        };
      }
      
      // Per tutti gli altri percorsi, usa il formato standard con prefisso
      const prefixKey = langKey === 'en-GB' ? 'en-gb' : langData.code;
      const shouldPrefixItaly = langKey === 'it-IT' && cleanPath !== '/'; // Non prefissare la home page italiana
      
      return {
        locale: langData.code,
        url: `${baseUrl}${shouldPrefixItaly ? '/it' : ''}${prefixKey === 'it' ? '' : '/' + prefixKey}${cleanPath === '/' ? '' : cleanPath}`
      };
    }
  });
  
  // Aggiungi x-default (utilizzando la versione italiana)
  if (useQueryParams) {
    hreflangUrls.push({
      locale: 'x-default',
      url: `${baseUrl}${cleanPath}?lang=it-IT`
    });
  } else {
    hreflangUrls.push({
      locale: 'x-default',
      url: `${baseUrl}${cleanPath === '/' ? '' : cleanPath}`
    });
  }
  
  return hreflangUrls;
};

export default i18n; 