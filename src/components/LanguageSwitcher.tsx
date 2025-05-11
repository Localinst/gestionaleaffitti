import { useTranslation } from "react-i18next";
import { supportedLanguages, changeLanguage, getCurrentLanguage } from "@/i18n";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Ottieni il codice della lingua corrente
  const currentLanguageCode = i18n.language.substring(0, 2).toUpperCase();
  
  // Funzione per cambiare lingua
  const handleLanguageChange = (langKey: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;
    const searchParams = new URLSearchParams(currentSearch);
    
    // Verifica se siamo in una route con prefisso di lingua
    const langPrefixes = ['/en', '/fr', '/de', '/es', '/it', '/en-gb'];
    const currentPrefix = langPrefixes.find(prefix => 
      currentPath === prefix || currentPath.startsWith(`${prefix}/`)
    );
    
    // Cambia la lingua e salva l'impostazione
    changeLanguage(langKey);
    
    // Se siamo in un'area autenticata (dashboard), usa solo il parametro di query
    if (currentPath.includes('/dashboard') || localStorage.getItem('authToken')) {
      // Aggiorna il parametro di query dell'URL corrente
      searchParams.set('lang', langKey);
      navigate({
        pathname: currentPath,
        search: searchParams.toString()
      }, { replace: true });
    }
    // Se siamo in un percorso con prefisso linguistico, mantieni la stessa logica
    else if (currentPrefix) {
      // Determina il nuovo prefisso in base alla lingua selezionata
      const langCode = langKey.substring(0, 2).toLowerCase();
      const newPrefix = langKey === 'en-GB' ? '/en-gb' : `/${langCode}`;
      
      // Estrai il percorso senza il prefisso della lingua
      const pathWithoutPrefix = currentPrefix === currentPath 
        ? '/' 
        : currentPath.substring(currentPrefix.length);
      
      // Navigazione alla stessa pagina ma con prefisso di lingua diverso
      navigate(`${newPrefix}${pathWithoutPrefix}${currentSearch}`, { replace: true });
    }
    // Altrimenti, l'URL non ha prefisso di lingua, imposta il parametro di query
    else {
      searchParams.set('lang', langKey);
      navigate({
        pathname: currentPath,
        search: searchParams.toString()
      }, { replace: true });
    }
  };
  
  return (
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
              onClick={() => handleLanguageChange(langKey)}
            >
              <span className="mr-2">{langData.flagEmoji}</span>
              {langData.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 