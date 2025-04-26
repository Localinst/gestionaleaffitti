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
import { useState } from "react";

const Footer = () => {
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
    <footer className="bg-muted py-12">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Colonna 1: Info azienda */}
         
          
        
          
          {/* Colonna 3: Risorse */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.resources")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("common.navigation.blog")}
                </Link>
              </li>
              <li>
                <Link to="/guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("common.navigation.guides")}
                </Link>
              </li>
              <li>
                <Link to="/supporto" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("common.navigation.support")}
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Colonna 4: Link Legali - tutti insieme */}
          <div>
            <h3 className="font-semibold mb-4">{t("footer.legal")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("cookies.privacyPolicy")}
                </Link>
              </li>
              <li>
                <Link to="/termini" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.termsOfService")}
                </Link>
              </li>
              <li>
                <Link to="/cookie" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("cookies.cookiePolicy")}
                </Link>
              </li>
              <li>
                <Link to="/rimborsi" className="text-muted-foreground hover:text-foreground transition-colors">
                  Politica di Rimborso
                </Link>
              </li>
              <li>
                <Dialog open={isOpen} onOpenChange={(open) => {
                  setIsOpen(open);
                  if (open) {
                    handleReset();
                  }
                }}>
                  <DialogTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors text-sm text-left">
                      Impostazioni Cookie
                    </button>
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
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tenoris360. {t("footer.allRightsReserved")}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 