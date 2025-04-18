import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          <DialogTitle>{t("cookies.title")}</DialogTitle>
          <DialogDescription>
            {t("cookies.description")}
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
                {t("cookies.categories.essential.title")}
              </label>
              <p className="text-sm text-muted-foreground">
                {t("cookies.categories.essential.description")}
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
                {t("cookies.categories.analytics.title")}
              </label>
              <p className="text-sm text-muted-foreground">
                {t("cookies.categories.analytics.description")}
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
                {t("cookies.categories.marketing.title")}
              </label>
              <p className="text-sm text-muted-foreground">
                {t("cookies.categories.marketing.description")}
              </p>
            </div>
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-4">
          {t("cookies.readMore")}{" "}
          <Link to="/cookie" className="text-primary hover:underline" onClick={() => setIsOpen(false)}>
            {t("cookies.cookiePolicy")}
          </Link>{" "}
          {t("cookies.and")}{" "}
          <Link to="/privacy" className="text-primary hover:underline" onClick={() => setIsOpen(false)}>
            {t("cookies.privacyPolicy")}
          </Link>
          .
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleReset}>
            {t("cookies.buttons.reset")}
          </Button>
          <Button onClick={handleSave}>
            {t("cookies.buttons.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CookieSettings; 