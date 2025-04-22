import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCookieConsent } from "@/context/CookieConsentContext";

// Definisco i tipi per gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

/**
 * Hook per integrare servizi di analytics rispettando le preferenze dell'utente sui cookie
 */
export const useAnalytics = () => {
  const location = useLocation();
  const { hasConsent } = useCookieConsent();

  // Funzione per inizializzare Google Analytics
  const initGoogleAnalytics = () => {
    if (!hasConsent("analytics")) return;

    // Inizializza Google Analytics
    window.dataLayer = window.dataLayer || [];
    // Implementazione semplificata che non usa la definizione locale di gtag
    window.gtag?.('js', new Date());
    window.gtag?.('config', 'G-ZNFK6CQ3LM');
    
    console.log("Google Analytics inizializzato");
  };

  // Track page views
  const trackPageView = (path: string) => {
    if (!hasConsent("analytics")) return;
    
    // Invia il pageview a Google Analytics
    window.gtag('config', 'G-ZNFK6CQ3LM', { 'page_path': path });
    
    console.log(`Pageview tracciato: ${path}`);
  };

  // Funzione per inizializzare altri servizi di analytics/marketing (Facebook Pixel, ecc.)
  const initMarketingTools = () => {
    if (!hasConsent("marketing")) return;
    
    // Qui verrebbe normalmente il codice per inizializzare Facebook Pixel o altri strumenti di marketing
    // Ad esempio:
    // !function(f,b,e,v,n,t,s) {...} // Facebook Pixel
    
    console.log("Strumenti di marketing inizializzati");
  };

  // Inizializza gli strumenti di analytics e marketing quando il componente viene montato
  useEffect(() => {
    initGoogleAnalytics();
    initMarketingTools();
  }, [hasConsent]);

  // Traccia i cambiamenti di pagina
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search, hasConsent]);

  // Esponi funzioni utili che potrebbero essere usate all'interno dell'app
  return {
    trackEvent: (eventName: string, eventParams?: Record<string, any>) => {
      if (!hasConsent("analytics")) return;
      
      // Invia l'evento a Google Analytics
      window.gtag('event', eventName, eventParams);
      
      console.log(`Evento tracciato: ${eventName}`, eventParams);
    }
  };
}; 