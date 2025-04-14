import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useCookieConsent } from "@/context/CookieConsentContext";

type CookieSettingsProps = {
  children: React.ReactNode;
  className?: string;
};

const CookieSettings = ({ children, className }: CookieSettingsProps) => {
  const { consent, updateConsent } = useCookieConsent();
  const [isOpen, setIsOpen] = useState(false);
  
  // Stato locale per le impostazioni dei cookie
  const [localSettings, setLocalSettings] = useState({
    essential: true, // sempre attivi
    analytics: consent === "all",
    marketing: consent === "all",
  });

  const handleSave = () => {
    // Se sono selezionati analytics o marketing, imposta il consenso su "all"
    if (localSettings.analytics || localSettings.marketing) {
      updateConsent("all");
    } else {
      // Altrimenti imposta su "essential"
      updateConsent("essential");
    }
    setIsOpen(false);
  };

  const handleReset = () => {
    // Reimposta le impostazioni in base al consenso attuale
    setLocalSettings({
      essential: true,
      analytics: consent === "all",
      marketing: consent === "all",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (open) {
        handleReset();
      }
    }}>
      <DialogTrigger asChild>
        <div className={className} onClick={() => setIsOpen(true)}>
          {children}
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Impostazioni Cookie</DialogTitle>
          <DialogDescription>
            Gestisci le tue preferenze sui cookie. I cookie essenziali sono necessari per il funzionamento del sito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="essential"
              checked={localSettings.essential}
              disabled
            />
            <div className="grid gap-1">
              <label
                htmlFor="essential"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cookie Essenziali
              </label>
              <p className="text-sm text-muted-foreground">
                Questi cookie sono necessari per il funzionamento del sito e non possono essere disattivati.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="analytics"
              checked={localSettings.analytics}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, analytics: checked as boolean })
              }
            />
            <div className="grid gap-1">
              <label
                htmlFor="analytics"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cookie Analitici
              </label>
              <p className="text-sm text-muted-foreground">
                Ci aiutano a capire come utilizzi il sito, per migliorare l'esperienza.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 pt-2">
            <Checkbox
              id="marketing"
              checked={localSettings.marketing}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, marketing: checked as boolean })
              }
            />
            <div className="grid gap-1">
              <label
                htmlFor="marketing"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Cookie di Marketing
              </label>
              <p className="text-sm text-muted-foreground">
                Utilizzati per mostrarti annunci pertinenti in base ai tuoi interessi.
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          Per maggiori informazioni, consulta la nostra{" "}
          <Link to="/cookie" className="text-primary hover:underline" onClick={() => setIsOpen(false)}>
            Cookie Policy
          </Link>{" "}
          e la{" "}
          <Link to="/privacy" className="text-primary hover:underline" onClick={() => setIsOpen(false)}>
            Privacy Policy
          </Link>
          .
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset}>
            Ripristina
          </Button>
          <Button onClick={handleSave}>
            Salva preferenze
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookieSettings; 