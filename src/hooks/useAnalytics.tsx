import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useCookieConsent } from "@/context/CookieConsentContext";
import * as api from "@/services/api";

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
  const trackPageView = (path: string = location.pathname + location.search) => {
    // Traccia in Google Analytics se c'è il consenso
    if (hasConsent("analytics")) {
      window.gtag?.('config', 'G-ZNFK6CQ3LM', { 'page_path': path });
      console.log(`Pageview tracciato in GA: ${path}`);
    }

    // Traccia per l'analytics locale e server
    trackLocalPageView(path);
  };

  // Funzione per inizializzare altri servizi di analytics/marketing (Facebook Pixel, ecc.)
  const initMarketingTools = () => {
    if (!hasConsent("marketing")) return;
    
    // Qui verrebbe normalmente il codice per inizializzare Facebook Pixel o altri strumenti di marketing
    // Ad esempio:
    // !function(f,b,e,v,n,t,s) {...} // Facebook Pixel
    
    console.log("Strumenti di marketing inizializzati");
  };

  /**
   * Traccia una visualizzazione di pagina nel sistema di analytics locale e sul server
   */
  const trackLocalPageView = async (path: string) => {
    try {
      // Ottieni sessionId dal localStorage o creane uno nuovo
      let sessionId = localStorage.getItem("sessionId");
      if (!sessionId) {
        sessionId = `session_${Date.now()}`;
        localStorage.setItem("sessionId", sessionId);
      }
      
      // Ottieni l'ID utente se l'utente è loggato
      const currentUserString = localStorage.getItem("currentUser");
      let userId = null;
      
      if (currentUserString) {
        try {
          const currentUser = JSON.parse(currentUserString);
          userId = currentUser.id;
        } catch (e) {
          console.warn("Errore nel parsing dell'utente corrente:", e);
        }
      }
      
      // Crea i dati per il tracking
      const trackingData = {
        sessionId,
        userId,
        path,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        deviceType: getDeviceType(),
        browser: detectBrowser(navigator.userAgent),
        operatingSystem: detectOS(navigator.userAgent),
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        country: 'IT', // Per semplicità, usiamo IT fisso (in produzione servirebbe un servizio di geoIP)
        timestamp: Date.now()
      };
      
      // Salva i dati anche nel localStorage per la dashboard locale
      saveToLocalStorage(trackingData);
      
      // Invia i dati al server
      await api.trackPageView(trackingData);
      
    } catch (error) {
      console.error("Errore nel tracciamento della pagina:", error);
    }
  };
  
  /**
   * Salva i dati di analytics nel localStorage (per la visualizzazione offline)
   */
  const saveToLocalStorage = (data: any) => {
    try {
      // Recupera le visualizzazioni esistenti o inizializza un array vuoto
      const existingViewsString = localStorage.getItem("page_views");
      let pageViews = [];
      
      if (existingViewsString) {
        try {
          pageViews = JSON.parse(existingViewsString);
        } catch (e) {
          console.warn("Errore nel parsing delle visualizzazioni:", e);
          pageViews = [];
        }
      }
      
      // Crea una nuova visualizzazione
      const newView = {
        path: data.path,
        timestamp: data.timestamp,
        userId: data.userId,
        sessionId: data.sessionId,
        referrer: data.referrer,
        userAgent: data.userAgent,
        device: data.deviceType,
        browser: data.browser
      };
      
      // Aggiungi la visualizzazione all'array e salva
      pageViews.push(newView);
      
      // Limita a 1000 visualizzazioni per non occupare troppo spazio
      if (pageViews.length > 1000) {
        pageViews = pageViews.slice(-1000);
      }
      
      localStorage.setItem("page_views", JSON.stringify(pageViews));
      
      // Aggiorna la sessione corrente
      updateCurrentSession(data.path);
      
    } catch (error) {
      console.error("Errore nel salvataggio locale:", error);
    }
  };
  
  /**
   * Aggiorna i dati della sessione corrente
   */
  const updateCurrentSession = (path: string) => {
    try {
      // Controlla se c'è una sessione esistente nel localStorage
      const sessionId = localStorage.getItem("sessionId") || `session_${Date.now()}`;
      const sessionsString = localStorage.getItem("user_sessions");
      let sessions = [];
      
      if (sessionsString) {
        try {
          sessions = JSON.parse(sessionsString);
        } catch (e) {
          console.warn("Errore nel parsing delle sessioni:", e);
          sessions = [];
        }
      }
      
      // Ottieni l'ID utente se l'utente è loggato
      const currentUserString = localStorage.getItem("currentUser");
      let userId = null;
      
      if (currentUserString) {
        try {
          const currentUser = JSON.parse(currentUserString);
          userId = currentUser.id;
        } catch (e) {
          console.warn("Errore nel parsing dell'utente corrente:", e);
        }
      }
      
      // Trova la sessione corrente o crea una nuova sessione
      let currentSession = sessions.find(s => s.sessionId === sessionId);
      const now = Date.now();
      
      if (!currentSession) {
        // Crea una nuova sessione
        currentSession = {
          sessionId,
          userId,
          startTime: now,
          lastActivity: now,
          pages: [path],
          pageViews: 1,
          duration: 0,
          device: getDeviceType(),
          browser: detectBrowser(navigator.userAgent),
          userAgent: navigator.userAgent,
          referrer: document.referrer,
          country: 'IT', // Potrebbe essere ottenuto tramite un servizio di geolocalizzazione IP
          timestamp: now
        };
        
        sessions.push(currentSession);
      } else {
        // Aggiorna la sessione esistente
        currentSession.lastActivity = now;
        currentSession.duration = (now - currentSession.startTime) / 1000; // durata in secondi
        
        // Aggiorna la lista delle pagine visitate se la pagina non è già presente
        if (!currentSession.pages.includes(path)) {
          currentSession.pages.push(path);
        }
        
        // Incrementa il contatore delle visualizzazioni di pagina
        currentSession.pageViews = (currentSession.pageViews || 0) + 1;
      }
      
      // Salva le sessioni aggiornate
      localStorage.setItem("user_sessions", JSON.stringify(sessions));
      
    } catch (error) {
      console.error("Errore nell'aggiornamento della sessione:", error);
    }
  };
  
  /**
   * Determina il tipo di dispositivo in base allo user agent
   */
  const getDeviceType = (): string => {
    const ua = navigator.userAgent;
    
    if (/iPad|tablet|Kindle/i.test(ua)) {
      return "tablet";
    } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
      return "mobile";
    }
    
    return "desktop";
  };
  
  /**
   * Rileva il browser in base allo user agent
   */
  const detectBrowser = (userAgent: string): string => {
    userAgent = userAgent.toLowerCase();
    
    if (userAgent.indexOf("edge") > -1 || userAgent.indexOf("edg/") > -1) {
      return "Edge";
    } else if (userAgent.indexOf("chrome") > -1 && userAgent.indexOf("safari") > -1) {
      return "Chrome";
    } else if (userAgent.indexOf("firefox") > -1) {
      return "Firefox";
    } else if (userAgent.indexOf("safari") > -1 && userAgent.indexOf("chrome") === -1) {
      return "Safari";
    } else if (userAgent.indexOf("opera") > -1 || userAgent.indexOf("opr/") > -1) {
      return "Opera";
    } else if (userAgent.indexOf("msie") > -1 || userAgent.indexOf("trident") > -1) {
      return "Internet Explorer";
    } else {
      return "Altro";
    }
  };
  
  /**
   * Rileva il sistema operativo in base allo user agent
   */
  const detectOS = (userAgent: string): string => {
    userAgent = userAgent.toLowerCase();
    
    if (userAgent.indexOf("win") > -1) {
      return "Windows";
    } else if (userAgent.indexOf("mac") > -1) {
      return "MacOS";
    } else if (userAgent.indexOf("linux") > -1) {
      return "Linux";
    } else if (userAgent.indexOf("android") > -1) {
      return "Android";
    } else if (userAgent.indexOf("ios") > -1 || userAgent.indexOf("iphone") > -1 || userAgent.indexOf("ipad") > -1) {
      return "iOS";
    } else {
      return "Altro";
    }
  };
  
  /**
   * Traccia una conversione (registrazione, acquisto, download, ecc.)
   */
  const trackConversion = async (conversionType: string, value: number = 0, details: any = null) => {
    try {
      // Ottieni sessionId e userId
      const sessionId = localStorage.getItem("sessionId") || `session_${Date.now()}`;
      let userId = null;
      
      const currentUserString = localStorage.getItem("currentUser");
      if (currentUserString) {
        try {
          const currentUser = JSON.parse(currentUserString);
          userId = currentUser.id;
        } catch (e) {}
      }
      
      const conversionData = {
        sessionId,
        userId,
        conversionType,
        value,
        path: location.pathname,
        details,
        timestamp: Date.now()
      };
      
      // Invia al server
      await api.trackConversion(conversionData);
      
      // Traccia anche in Google Analytics se c'è il consenso
      if (hasConsent("analytics")) {
        window.gtag('event', conversionType, {
          value: value,
          event_category: 'conversions',
          event_label: details?.label || ''
        });
      }
      
    } catch (error) {
      console.error('Errore nel tracciamento della conversione:', error);
    }
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
    },
    
    // Esporta la funzione di tracciamento conversioni
    trackConversion
  };
}; 