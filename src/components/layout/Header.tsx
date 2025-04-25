import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

export function Header() {
  const { t } = useTranslation();
  const { user } = useAuth();

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
        <nav className="hidden md:flex gap-6">
          <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
            {t("common.navigation.home")}
          </Link>
          <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
            {t("common.navigation.pricing")}
          </Link>
        </nav>

        {/* Azioni account */}
        <div className="flex items-center gap-4">
          {user ? (
            <Link to="/dashboard">
              <Button variant="outline" size="sm">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login" className="hidden sm:inline-flex">
                <Button variant="ghost" size="sm">
                  {t("common.navigation.login")}
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">
                  {t("common.navigation.register")}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
} 