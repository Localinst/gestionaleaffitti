import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supportedLanguages, changeLanguage } from "@/i18n";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";

export function LandingNav() {
  const { i18n, t } = useTranslation();
  
  // Ottieni le prime due lettere della lingua corrente
  const currentLanguageCode = i18n.language.substring(0, 2).toUpperCase();
  
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
        <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
          {t("landing.nav.pricing")}
        </Link>
        <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">
          {t("landing.nav.testimonials")}
        </a>
      </nav>
      
      <div className="flex items-center gap-1 sm:gap-4">
        <div className="flex items-center">
          <span className="text-sm font-medium mr-1">{currentLanguageCode}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Globe className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {Object.entries(supportedLanguages).map(([langKey, langData]) => (
                <DropdownMenuItem 
                  key={langKey}
                  className={i18n.language === langKey ? "bg-muted" : ""}
                  onClick={() => changeLanguage(langKey)}
                >
                  {langData.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <Link to="/login">
          <Button variant="ghost" size="sm" className="px-2 sm:px-4">{t("landing.nav.login")}</Button>
        </Link>
        <Link to="/register">
          <Button size="sm" className="px-2 sm:px-4">{t("landing.nav.register")}</Button>
        </Link>
        <Link to="/pricing" className="hidden sm:block">
          <Button variant="outline" size="sm">{t("landing.nav.freeService")}</Button>
        </Link>
      </div>
    </nav>
  );
} 