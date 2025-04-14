import React, { createContext, useContext, useState, useEffect } from "react";

type ConsentType = "all" | "essential" | null;

interface CookieConsentContextType {
  consent: ConsentType;
  updateConsent: (consent: ConsentType) => void;
  hasConsent: (cookieType: "essential" | "analytics" | "marketing") => boolean;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentType>(null);

  useEffect(() => {
    // Carica il consenso dal localStorage all'avvio
    const savedConsent = localStorage.getItem("cookieConsent") as ConsentType;
    setConsent(savedConsent);

    // Verifica se è passato abbastanza tempo per richiedere nuovamente il consenso (es. 6 mesi)
    const timestamp = localStorage.getItem("cookieConsentTimestamp");
    if (timestamp) {
      const sixMonthsInMs = 6 * 30 * 24 * 60 * 60 * 1000; // circa 6 mesi in millisecondi
      const consentDate = parseInt(timestamp, 10);
      const now = Date.now();
      
      if (now - consentDate > sixMonthsInMs) {
        // Rimuovi il consenso se è passato troppo tempo
        localStorage.removeItem("cookieConsent");
        localStorage.removeItem("cookieConsentTimestamp");
        setConsent(null);
      }
    }
  }, []);

  const updateConsent = (newConsent: ConsentType) => {
    setConsent(newConsent);
    if (newConsent) {
      localStorage.setItem("cookieConsent", newConsent);
      localStorage.setItem("cookieConsentTimestamp", Date.now().toString());
    } else {
      localStorage.removeItem("cookieConsent");
      localStorage.removeItem("cookieConsentTimestamp");
    }
  };

  const hasConsent = (cookieType: "essential" | "analytics" | "marketing") => {
    if (cookieType === "essential") {
      // Cookie essenziali sono sempre consentiti
      return true;
    }
    
    // Per i cookie di analytics e marketing, è necessario il consenso "all"
    return consent === "all";
  };

  return (
    <CookieConsentContext.Provider value={{ consent, updateConsent, hasConsent }}>
      {children}
    </CookieConsentContext.Provider>
  );
};

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (context === undefined) {
    throw new Error("useCookieConsent deve essere utilizzato all'interno di un CookieConsentProvider");
  }
  return context;
}; 