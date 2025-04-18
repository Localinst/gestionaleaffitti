import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  BarChart3, 
  Building2, 
  Users, 
  Receipt, 
  Menu, 
  X, 
  Home, 
  LogOut,
  LineChart,
  FileText,
  CalendarClock,
  Palmtree,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Upload,
  Settings,
  Info,
  FileQuestion
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTutorial } from '@/context/TutorialContext';
import { DEFAULT_TUTORIAL_STEPS } from '@/context/TutorialContext';
import { useTranslation } from "react-i18next";

interface SidebarProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ forceOpen, onClose }: SidebarProps = {}) {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({});
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, user } = useAuth();
  const { startTutorial } = useTutorial();
  
  // Funzione di logout
  const handleLogout = async () => {
    try {
      await logout();
      if (onClose) onClose();
      // Il reindirizzamento è gestito da AuthContext
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };
  
  // Close sidebar on route change on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  }, [location.pathname]);

  // Initially open sidebar on desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Automatically open submenus based on current path
  useEffect(() => {
    const newOpenSubmenus: Record<string, boolean> = {};
    
    routes.forEach(route => {
      if (route.submenu && location.pathname.startsWith(route.path)) {
        newOpenSubmenus[route.path] = true;
      }
    });
    
    setOpenSubmenus(newOpenSubmenus);
  }, [location.pathname]);

  // Applica forceOpen se presente
  useEffect(() => {
    if (forceOpen !== undefined) {
      setIsOpen(forceOpen);
    }
  }, [forceOpen]);
  
  const routes = [
    { path: "/dashboard", label: t("common.navigation.dashboard"), icon: BarChart3 },
    { path: "/properties", label: t("common.navigation.properties"), icon: Building2 },
    { path: "/tenants", label: t("common.navigation.tenants"), icon: Users },
    { path: "/transactions", label: t("common.navigation.payments"), icon: Receipt },
    { path: "/contracts", label: t("common.navigation.contracts"), icon: FileText },
    { path: "/activities", label: t("common.navigation.activities"), icon: CalendarClock },
    { 
      path: "/tourism", 
      label: t("common.navigation.tourism"), 
      icon: Palmtree,
      submenu: [
        { path: "/tourism/properties", label: t("common.navigation.tourismProperties") },
        { path: "/tourism/bookings", label: t("common.navigation.bookings") }
      ]
    },
    { path: "/reports", label: t("common.navigation.reports"), icon: LineChart },
    { path: "/import", label: t("common.navigation.import"), icon: Upload },
    { 
      path: "/info", 
      label: t("common.navigation.info"), 
      icon: Info,
      submenu: [
        { path: "/blog", label: t("common.navigation.blog") },
        { path: "/guide", label: t("common.navigation.guides") }
      ]
    },
    { 
      path: "/supporto", 
      label: t("common.navigation.support"), 
      icon: HelpCircle
    },
    { 
      path: "/settings", 
      label: t("common.navigation.settings"), 
      icon: Settings,
      submenu: [
        { path: "/profile", label: t("common.navigation.profile") },
        { path: "/settings", label: t("common.navigation.appSettings") },
        { path: "/notifications", label: t("common.navigation.notifications") }
      ]
    },
  ];
  
  const handleTutorialClick = () => {
    console.log('Click su guida interattiva rilevato');
    startTutorial();
    console.log('Tutorial avviato');
    if (onClose) onClose();
  };

  const handleNavLinkClick = () => {
    if (window.innerWidth < 768 && onClose) {
      onClose();
    }
  };
  
  return (
    <>      
      {/* Sidebar - utilizziamo CSS condizionale per dispositivi mobili o desktop */}
      <aside className={cn(
        "flex h-full w-full flex-col transition-transform duration-300",
        forceOpen !== undefined 
          ? "" // Non applicare classi di visualizzazione quando forceOpen è definito
          : "fixed inset-y-0 left-0 z-20 w-64 border-r bg-card md:translate-x-0 hidden md:flex",
        (isOpen || forceOpen) ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar header */}
        <div className="border-b p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <img 
                src="/simbolologo.png" 
                alt="tenoris360 Logo" 
                className="h-8 mr-2" 
              />
              <h2 className="text-xl font-semibold">tenoris360</h2>
            </div>
            {onClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="md:hidden h-8 w-8"
              >
                <X size={16} />
              </Button>
            )}
          </div>
          {user && (
            <p className="text-sm text-muted-foreground mt-1">
              Ciao, {user.name}
            </p>
          )}
        </div>
        
        {/* Nav links */}
        <nav className="flex-1 overflow-auto p-4">
          <ul className="space-y-2">
            {routes.map((route) => {
              const Icon = route.icon;
              const hasSubmenu = route.submenu && route.submenu.length > 0;
              const isActive = hasSubmenu 
                ? location.pathname.startsWith(route.path)
                : location.pathname === route.path;
              
              return (
                <li key={route.path}>
                  {hasSubmenu ? (
                    <div className="space-y-1">
                      <div
                        className={cn(
                          "flex items-center justify-between rounded-md px-3 py-2 cursor-pointer transition-colors",
                          isActive
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted"
                        )}
                        onClick={() => {
                          setOpenSubmenus(prev => ({
                            ...prev,
                            [route.path]: !prev[route.path]
                          }));
                        }}
                        data-tutorial={`menu-${route.path.substring(1)}`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5" />
                          <span>{route.label}</span>
                        </div>
                        {openSubmenus[route.path] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </div>
                      
                      {/* Sottomenu */}
                      {openSubmenus[route.path] && (
                        <ul className="pl-6 space-y-1">
                          {route.submenu.map((submenuItem) => (
                            <li key={submenuItem.path}>
                              <NavLink
                                to={submenuItem.path}
                                className={({ isActive }) => cn(
                                  "flex items-center gap-3 rounded-md px-3 py-2 transition-colors text-sm",
                                  isActive
                                    ? "bg-primary/10 font-medium"
                                    : "hover:bg-muted"
                                )}
                                onClick={handleNavLinkClick}
                                data-tutorial={`submenu-${submenuItem.path.substring(1)}`}
                              >
                                <span>{submenuItem.label}</span>
                              </NavLink>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <NavLink
                      to={route.path}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                      onClick={handleNavLinkClick}
                      data-tutorial={`menu-${route.path.substring(1)}`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{route.label}</span>
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Sidebar footer */}
        <div className="border-t p-4 space-y-2">
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={handleTutorialClick}
          >
            <HelpCircle className="mr-2 h-5 w-5" />
            Guida Interattiva
          </Button>
          
          <Button 
            variant="outline" 
            className="w-full justify-start" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
