import { Link } from "react-router-dom";
import { Menu, X, Search } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const Navbar = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2">
            <img src="/simbolologo.png" alt="Tenoris360 Logo" className="h-8 w-auto" />
            <span className="text-xl font-bold tracking-tight">Tenoris360</span>
          </Link>
        </div>

        {/* Menu Desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            to="/"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("common.navigation.home")}
          </Link>
          <Link
            to="/pricing"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("common.navigation.pricing")}
          </Link>
          <Link
            to="/blog"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("common.navigation.blog")}
          </Link>
          <Link
            to="/guide"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("common.navigation.guides")}
          </Link>
          <Link
            to="/supporto"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {t("common.navigation.support")}
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {/* Search toggle */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>

          {/* Authentication buttons */}
          <div className="hidden md:flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                {t("common.navigation.login")}
              </Button>
            </Link>
            <Link to="/register">
              <Button size="sm">{t("common.navigation.register")}</Button>
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-muted-foreground hover:text-foreground transition-colors"
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {isSearchOpen && (
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-3">
          <div className="container px-4 md:px-6">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={t("search.placeholder")}
                className="w-full pl-8 bg-background"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-b bg-background">
          <nav className="container flex flex-col gap-4 px-4 py-6">
            <Link
              to="/"
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("common.navigation.home")}
            </Link>
            <Link
              to="/pricing"
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("common.navigation.pricing")}
            </Link>
            <Link
              to="/blog"
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("common.navigation.blog")}
            </Link>
            <Link
              to="/guide"
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("common.navigation.guides")}
            </Link>
            <Link
              to="/supporto"
              className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {t("common.navigation.support")}
            </Link>

            <div className="flex items-center gap-2 pt-4 border-t">
              <Link to="/login" className="w-full" onClick={() => setIsMenuOpen(false)}>
                <Button variant="outline" className="w-full">
                  {t("common.navigation.login")}
                </Button>
              </Link>
              <Link to="/register" className="w-full" onClick={() => setIsMenuOpen(false)}>
                <Button className="w-full">{t("common.navigation.register")}</Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Navbar; 