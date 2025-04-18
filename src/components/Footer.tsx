import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import CookieSettings from "./CookieSettings";

const Footer = () => {
  const { t } = useTranslation();
  
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
              {t("footer.companyDescription")}
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-4">{t("footer.quickLinks")}</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("common.navigation.home")}
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("common.navigation.pricing")}
                </Link>
              </li>
              <li>
                <Link to="/#features" className="text-muted-foreground hover:text-foreground transition-colors">
                  {t("common.navigation.features")}
                </Link>
              </li>
            </ul>
          </div>
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
                <CookieSettings className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                  {t("footer.cookieSettings")}
                </CookieSettings>
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