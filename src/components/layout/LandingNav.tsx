import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { getCurrentLanguage } from "@/i18n";
import { LinkWithQuery } from "@/components/LinkWithQuery";

export function LandingNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const currentLang = getCurrentLanguage();
  
  // Funzione per aggiungere il parametro di lingua all'URL
  const getUrlWithLang = (baseUrl: string) => {
    return `${baseUrl}?lang=${currentLang}`;
  };
  
  return (
    <nav className="w-full py-4 px-3 md:px-8 flex items-center justify-between bg-background border-b">
      <div className="flex items-center gap-2 min-w-0 max-w-[50%]">
        <img src="/simbolologo.png" alt="Tenoris360 Logo" className="h-7 w-auto" />
        <h1 className="text-base md:text-xl font-bold tracking-tight truncate">Tenoris360</h1>
      </div>
      
      <nav className="hidden md:flex items-center gap-6 absolute left-1/2 transform -translate-x-1/2">
        <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">
          {t("landing.nav.features")}
        </a>
        <LinkWithQuery to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
          {t("landing.nav.pricing")}
        </LinkWithQuery>
        <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
          {t("landing.nav.testimonials")}
        </a>
      </nav>
      
      <div className="flex items-center gap-1 sm:gap-4">
        <LanguageSwitcher />
        
        <LinkWithQuery to="/login">
          <Button variant="ghost" size="sm" className="px-2 sm:px-4">{t("landing.nav.login")}</Button>
        </LinkWithQuery>
        <LinkWithQuery to="/register">
          <Button size="sm" className="px-2 sm:px-4">{t("landing.nav.register")}</Button>
        </LinkWithQuery>
        <LinkWithQuery to="/pricing" className="hidden sm:block">
          <Button variant="outline" size="sm">{t("landing.nav.freeService")}</Button>
        </LinkWithQuery>
      </div>
    </nav>
  );
} 