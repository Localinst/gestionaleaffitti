import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentLanguage, changeLanguage } from '@/i18n';
import { useSettings } from '@/context/SettingsContext';

// Mappatura dei prefissi di route alle lingue
const languagePrefixes = {
  '/en': 'en-US',
  '/en-gb': 'en-GB',
  '/fr': 'fr-FR',
  '/de': 'de-DE',
  '/es': 'es-ES',
  '/it': 'it-IT'
};

// Mappatura inversa per ottenere il prefisso dalla lingua
const prefixFromLanguage = {
  'en-US': '/en',
  'en-GB': '/en-gb',
  'fr-FR': '/fr',
  'de-DE': '/de',
  'es-ES': '/es',
  'it-IT': '/'  // L'italiano è la lingua predefinita, quindi il percorso è la radice
};

// Componente per gestire le lingue in modo ibrido: supporta sia prefissi di route che parametri di query
export function LanguageRouteHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  const { updateLanguageFromUrl } = useSettings();
  const initialRenderDone = useRef(false);
  
  useEffect(() => {
    const currentLang = getCurrentLanguage();
    const currentPath = location.pathname;
    
    console.log(`LanguageRouteHandler - Current path: ${currentPath}, Current language: ${currentLang}`);
    
    // Prima controlla se esiste un parametro di query per la lingua
    const searchParams = new URLSearchParams(location.search);
    const langParam = searchParams.get('lang');
    
    if (langParam) {
      console.log(`Found lang query parameter: ${langParam}`);
      // Se abbiamo un parametro di query, usa quello per impostare la lingua
      updateLanguageFromUrl(langParam);
      return;
    }
    
    // Verifica se il percorso ha un prefisso lingua
    let foundPrefix = false;
    let matchedLangCode = '';
    
    // Controlla ciascun prefisso di lingua
    for (const [prefix, langCode] of Object.entries(languagePrefixes)) {
      if (currentPath === prefix || currentPath.startsWith(`${prefix}/`)) {
        foundPrefix = true;
        matchedLangCode = langCode;
        console.log(`Found matching language prefix: ${prefix} -> ${langCode}`);
        break;
      }
    }
    
    // Controlla anche window.initialLanguage che viene impostato nel file HTML prerendered
    const initialLanguage = (window as any).initialLanguage;
    if (initialLanguage && !matchedLangCode) {
      console.log(`Found initialLanguage in window: ${initialLanguage}`);
      matchedLangCode = initialLanguage;
      foundPrefix = true;
    }
    
    if (foundPrefix && matchedLangCode) {
      // Forza il cambio di lingua basato sul prefisso URL o initialLanguage, 
      // indipendentemente dalle impostazioni salvate
      console.log(`Setting language to ${matchedLangCode} based on URL prefix or initialLanguage`);
      
      // Forza il cambio di lingua, anche se è già la stessa
      // Questo è importante perché potrebbe esserci un mismatch tra i18n e le impostazioni salvate
      updateLanguageFromUrl(matchedLangCode);
      
      // Salva nelle impostazioni per persistenza
      // Questa chiamata diretta è cruciale per assicurarsi che la lingua venga cambiata immediatamente
      changeLanguage(matchedLangCode);
      
      // Pulisci localStorage per assicurarsi che non interferisca
      try {
        const savedSettings = localStorage.getItem("userSettings");
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          settings.language = matchedLangCode;
          localStorage.setItem("userSettings", JSON.stringify(settings));
        }
      } catch (error) {
        console.error("Errore nell'aggiornamento delle impostazioni:", error);
      }
    } else {
      console.log(`No matching language prefix found in path: ${currentPath}`);
      
      // Se siamo alla prima renderizzazione e non c'è un prefisso di lingua,
      // potremmo voler mantenere la lingua predefinita o quella salvata
      if (!initialRenderDone.current) {
        console.log(`Initial render - keeping saved language: ${currentLang}`);
        initialRenderDone.current = true;
      }
    }
  }, [location, updateLanguageFromUrl]);
  
  return null; // Questo componente non renderizza nulla
} 