import { Link } from "react-router-dom";
import CookieSettings from "./CookieSettings";

const Footer = () => {
  return (
    <footer className="bg-muted py-12">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src="/simbolologo.png" alt="Tenoris360 Logo" className="h-5 w-auto" />
              <span className="font-bold">Tenoris360</span>
            </div>
            <p className="text-muted-foreground text-sm">
              La soluzione completa per la gestione degli affitti e delle proprietà immobiliari.
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Link Rapidi</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  Piani e Prezzi
                </Link>
              </li>
              <li>
                <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  Funzionalità
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Risorse</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/blog" className="text-muted-foreground hover:text-foreground transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/guide" className="text-muted-foreground hover:text-foreground transition-colors">
                  Guide
                </Link>
              </li>
              <li>
                <Link to="/supporto" className="text-muted-foreground hover:text-foreground transition-colors">
                  Supporto
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Legale</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/termini" className="text-muted-foreground hover:text-foreground transition-colors">
                  Termini di Servizio
                </Link>
              </li>
              <li>
                <Link to="/cookie" className="text-muted-foreground hover:text-foreground transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <CookieSettings className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  Impostazioni Cookie
                </CookieSettings>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Tenoris360. Tutti i diritti riservati.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 