import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { changeLanguage } from '@/i18n';

// Mappatura dei prefissi di route alle lingue
const languagePrefixes = {
  '/en': 'en-US',
  '/en-gb': 'en-GB',
  '/fr': 'fr-FR',
  '/de': 'de-DE',
  '/es': 'es-ES',
  '/it': 'it-IT'
};

// Componente per gestire le lingue in modo ibrido: supporta sia prefissi di route che parametri di query
export function LanguageRouteHandler() {
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Prima controlla se esiste un parametro di query per la lingua
    const searchParams = new URLSearchParams(location.search);
    const langParam = searchParams.get('lang');
    
    if (langParam) {
      // Se abbiamo un parametro di query, usa quello per impostare la lingua
      changeLanguage(langParam);
      return;
    }
    
    // Altrimenti, verifica se il percorso ha un prefisso lingua
    const currentPath = location.pathname;
    const languagePrefix = Object.keys(languagePrefixes).find(prefix => 
      currentPath === prefix || currentPath.startsWith(`${prefix}/`)
    );
    
    if (languagePrefix) {
      // Imposta la lingua in base al prefisso trovato
      const langCode = languagePrefixes[languagePrefix as keyof typeof languagePrefixes];
      changeLanguage(langCode);
      
      // NON reindirizza - mantiene la compatibilità con le route prefissate
      // Questo è il cambiamento principale rispetto alla versione precedente
    }
  }, [location, navigate]);
  
  return null; // Questo componente non renderizza nulla
} 