import { useState, useEffect } from "react";

/**
 * Hook per verificare se una media query CSS corrisponde
 * @param query - La media query CSS da verificare (es. "(max-width: 768px)")
 * @returns boolean che indica se la media query corrisponde
 */
export function useMediaQuery(query: string): boolean {
  // Verifica se window è disponibile (per SSR)
  const getMatches = (): boolean => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  // Stato per memorizzare il risultato della media query
  const [matches, setMatches] = useState<boolean>(getMatches());

  // Effetto per aggiornare lo stato quando la media query cambia
  useEffect(() => {
    // Funzione per aggiornare lo stato
    const handleChange = () => {
      setMatches(getMatches());
    };

    // Crea un oggetto MediaQueryList
    const mediaQuery = window.matchMedia(query);
    
    // Gestisci il cambiamento iniziale
    handleChange();

    // Aggiungi un listener per i cambiamenti
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      // Fallback per browser più vecchi
      mediaQuery.addListener(handleChange);
    }

    // Cleanup: rimuovi il listener quando il componente viene smontato
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        // Fallback per browser più vecchi
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [query]);

  return matches;
} 