import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { changeLanguage } from "@/i18n";

// Definizione dei tipi
export type ThemePreference = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large";

// Interfaccia delle impostazioni utente
export interface UserSettings {
  // Impostazioni generali
  language: string;
  autoSave: boolean;
  confirmDialogs: boolean;
  
  // Notifiche
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  contractNotifications: boolean;
  tenantNotifications: boolean;
  systemNotifications: boolean;
  
  // Aspetto
  theme: ThemePreference;
  fontSize: FontSize;
  animationsEnabled: boolean;
}

// Impostazioni predefinite
const defaultSettings: UserSettings = {
  // Impostazioni generali
  language: "it-IT",
  autoSave: true,
  confirmDialogs: true,
  
  // Notifiche
  notificationsEnabled: true,
  emailNotifications: true,
  pushNotifications: true,
  contractNotifications: true,
  tenantNotifications: true,
  systemNotifications: true,
  
  // Aspetto
  theme: "system",
  fontSize: "medium",
  animationsEnabled: true,
};

// Interfaccia del contesto
interface SettingsContextType {
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;
  resetSettings: () => void;
  updateLanguageFromUrl: (langCode: string) => void;
}

// Creazione del contesto
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Provider del contesto
interface SettingsProviderProps {
  children: ReactNode;
}

// Funzione per determinare la lingua iniziale
function getInitialLanguage(): string {
  // Prima controlla se esiste window.initialLanguage (impostato nei file HTML prerendered)
  if (typeof window !== 'undefined' && (window as any).initialLanguage) {
    const initialLang = (window as any).initialLanguage;
    console.log(`Using initialLanguage from window: ${initialLang}`);
    return initialLang;
  }

  // Controlla i prefissi di lingua nell'URL
  const path = window.location.pathname;
  console.log("Getting initial language from path:", path);
  
  const langPrefixes = {
    '/en': 'en-US',
    '/en-gb': 'en-GB', 
    '/fr': 'fr-FR',
    '/de': 'de-DE',
    '/es': 'es-ES'
  };
  
  // Verifica i prefissi di lingua nell'URL in modo più preciso
  for (const [prefix, lang] of Object.entries(langPrefixes)) {
    // Controlla se il path è esattamente il prefisso o inizia con il prefisso seguito da /
    if (path === prefix || path.startsWith(`${prefix}/`)) {
      console.log(`Found language prefix ${prefix} in URL, setting language to ${lang}`);
      return lang;
    }
  }
  
  console.log("No language prefix found in URL, trying localStorage");
  
  // Se non c'è un prefisso nell'URL, prova a leggere da localStorage
  try {
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      if (parsedSettings.language) {
        console.log(`Using language from localStorage: ${parsedSettings.language}`);
        return parsedSettings.language;
      }
    }
  } catch (error) {
    console.error("Errore nel leggere le impostazioni:", error);
  }
  
  // Altrimenti ritorna il valore predefinito
  console.log(`Using default language: ${defaultSettings.language}`);
  return defaultSettings.language;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  // Carica le impostazioni dal localStorage o utilizza quelle predefinite
  const [settings, setSettings] = useState<UserSettings>(() => {
    const initialLanguage = getInitialLanguage();
    const savedSettings = localStorage.getItem("userSettings");
    
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Sovrascrivi la lingua con quella rilevata dall'URL, se presente
      return { ...parsedSettings, language: initialLanguage };
    }
    
    return { ...defaultSettings, language: initialLanguage };
  });

  // Aggiorna le impostazioni
  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      localStorage.setItem("userSettings", JSON.stringify(newSettings));
      
      // Se la lingua è cambiata, aggiorna i18n
      if (updates.language && updates.language !== prev.language) {
        changeLanguage(updates.language);
      }
      
      return newSettings;
    });
  };

  // Funzione specifica per aggiornare la lingua dall'URL
  const updateLanguageFromUrl = (langCode: string) => {
    setSettings((prev) => {
      if (langCode !== prev.language) {
        const newSettings = { ...prev, language: langCode };
        localStorage.setItem("userSettings", JSON.stringify(newSettings));
        changeLanguage(langCode);
        return newSettings;
      }
      return prev;
    });
  };

  // Ripristina le impostazioni predefinite
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.setItem("userSettings", JSON.stringify(defaultSettings));
    
    // Ripristina anche la lingua predefinita
    changeLanguage(defaultSettings.language);
  };

  // Imposta la lingua all'avvio
  useEffect(() => {
    changeLanguage(settings.language);
  }, []);

  // Applica il tema quando cambia
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  // Applica dimensione del font quando cambia
  useEffect(() => {
    document.documentElement.classList.remove("text-sm", "text-base", "text-lg");
    switch (settings.fontSize) {
      case "small":
        document.documentElement.classList.add("text-sm");
        break;
      case "medium":
        document.documentElement.classList.add("text-base");
        break;
      case "large":
        document.documentElement.classList.add("text-lg");
        break;
    }
  }, [settings.fontSize]);

  // Applica le animazioni quando l'impostazione cambia
  useEffect(() => {
    if (!settings.animationsEnabled) {
      document.documentElement.classList.add("reduce-motion");
    } else {
      document.documentElement.classList.remove("reduce-motion");
    }
  }, [settings.animationsEnabled]);

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      resetSettings,
      updateLanguageFromUrl 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

// Hook personalizzato per utilizzare il contesto
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings deve essere utilizzato all'interno di un SettingsProvider");
  }
  return context;
};

// Funzione per applicare il tema
function applyTheme(theme: ThemePreference) {
  const root = document.documentElement;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  const themeToApply = theme === "system" ? systemTheme : theme;

  if (themeToApply === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // Ascolta i cambiamenti del tema di sistema se è impostato su "system"
  if (theme === "system") {
    const themeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    themeMediaQuery.addEventListener("change", handleThemeChange);
    return () => {
      themeMediaQuery.removeEventListener("change", handleThemeChange);
    };
  }
} 