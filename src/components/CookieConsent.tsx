import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useCookieConsent } from "@/context/CookieConsentContext";

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { consent, updateConsent } = useCookieConsent();
  
  useEffect(() => {
    // Mostra il banner se non c'è consenso
    if (consent === null) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [consent]);

  const acceptAll = () => {
    updateConsent("all");
    setIsVisible(false);
  };

  const acceptEssential = () => {
    updateConsent("essential");
    setIsVisible(false);
  };

  const close = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 bg-background border-t shadow-lg">
      <div className="container max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
          <div className="flex-grow">
            <h3 className="text-lg font-semibold mb-2">La tua privacy è importante</h3>
            <p className="text-sm text-muted-foreground mb-2">
              Utilizziamo i cookie per migliorare la tua esperienza di navigazione, personalizzare contenuti e 
              annunci, fornire funzionalità di social media e analizzare il nostro traffico.
            </p>
            <div className="text-sm text-muted-foreground">
              Leggi la nostra <Link to="/cookie" className="text-primary hover:underline">Cookie Policy</Link> e la{" "}
              <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link> per maggiori dettagli.
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 whitespace-nowrap">
            <Button variant="outline" size="sm" onClick={acceptEssential}>
              Solo essenziali
            </Button>
            <Button size="sm" onClick={acceptAll}>
              Accetta tutti
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 md:relative md:top-auto md:right-auto"
              onClick={close}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Chiudi</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent; 