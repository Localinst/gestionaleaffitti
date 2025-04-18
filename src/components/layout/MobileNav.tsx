import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Building2, 
  Users, 
  FileText, 
  Receipt,
  Menu,
  X,
  Info,
  HelpCircle,
  Bell,
  UserCircle,
  CalendarClock,
  Settings
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sidebar } from "./Sidebar";
import { useTranslation } from "react-i18next";

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick?: () => void;
}

function NavItem({ to, icon, label, active, onClick }: NavItemProps) {
  return (
    <Link 
      to={to}
      className={cn(
        "flex flex-col items-center justify-center p-2 text-xs transition-colors",
        active 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={onClick}
    >
      {icon}
      <span className="mt-1">{label}</span>
    </Link>
  );
}

function TopNavItem({ to, icon, label, onClick }: { to: string, icon: React.ReactNode, label: string, onClick?: () => void }) {
  return (
    <Link 
      to={to}
      className="flex items-center gap-1 text-sm px-2 py-1 rounded-md transition-colors hover:bg-muted"
      onClick={onClick}
    >
      {icon}
      <span className="hidden xs:inline">{label}</span>
    </Link>
  );
}

export function MobileNav() {
  const { t } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") {
      return true;
    }
    
    if (path !== "/dashboard" && location.pathname.startsWith(path)) {
      return true;
    }
    
    return false;
  };
  
  // Chiudi il menu quando cambia la route
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  
  return (
    <>
      {/* Navbar superiore professionale su mobile e desktop */}
      <div className="fixed top-0 left-0 right-0 z-20 border-b bg-background/95 backdrop-blur-sm h-14">
        <div className="flex items-center justify-between h-full px-2 md:px-6 mx-auto max-w-7xl">
          {/* Parte sinistra con logo e menu */}
          <div className="flex items-center gap-2">
            {/* Menu toggle - solo su mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="md:hidden h-9 w-9"
            >
              <Menu size={20} />
            </Button>
            
            {/* Logo e nome app */}
            <Link to="/dashboard" className="flex items-center gap-2">
              <img src="/simbolologo.png" alt="Tenoris360 Logo" className="h-8 w-auto" />
              <span className="hidden xs:block text-base font-semibold">Tenoris360</span>
            </Link>
          </div>
          
          {/* Links centrali */}
          <div className="hidden sm:flex items-center gap-2">
            <TopNavItem 
              to="/dashboard" 
              icon={<Home size={16} />} 
              label="Home" 
            />
            <TopNavItem 
              to="/info" 
              icon={<Info size={16} />} 
              label="Info" 
            />
            <TopNavItem 
              to="/supporto" 
              icon={<HelpCircle size={16} />} 
              label="Supporto" 
            />
          </div>
          
          {/* Parte destra con notifiche e profilo */}
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9"
              asChild
            >
              <Link to="/notifications">
                <Bell size={18} />
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="h-9 w-9"
              asChild
            >
              <Link to="/profile">
                <UserCircle size={18} />
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Aggiunge spazio per la navbar superiore */}
      <div className="h-1" />
      
      {/* Sidebar mobile che appare da sinistra */}
      {isMenuOpen && (
        <>
          <div 
            className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={toggleMenu}
          />
          <div className="md:hidden fixed inset-y-0 left-0 z-50 w-64 bg-card border-r shadow-lg transform transition-transform duration-200 ease-in-out">
            <Sidebar forceOpen={true} onClose={toggleMenu} />
          </div>
        </>
      )}
      
      {/* Barra di navigazione mobile fissa in basso */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t h-16 z-30">
        <div className="grid grid-cols-5 h-full">
          <NavItem 
            to="/dashboard" 
            icon={<Home size={20} />} 
            label={t("common.navigation.dashboard")} 
            active={isActive("/dashboard")}
          />
          <NavItem 
            to="/properties" 
            icon={<Building2 size={20} />} 
            label={t("common.navigation.properties")} 
            active={isActive("/properties")}
          />
          <NavItem 
            to="/tenants" 
            icon={<Users size={20} />} 
            label={t("common.navigation.tenants")} 
            active={isActive("/tenants")}
          />
          <NavItem 
            to="/contracts" 
            icon={<FileText size={20} />} 
            label={t("common.navigation.contracts")} 
            active={isActive("/contracts")}
          />
          <NavItem 
            to="/transactions" 
            icon={<Receipt size={20} />} 
            label={t("common.navigation.payments")} 
            active={isActive("/transactions")}
          />
        </div>
      </nav>
      
      {/* Margine inferiore per compensare la barra fissa */}
      <div className="md:hidden h-16" />
    </>
  );
} 