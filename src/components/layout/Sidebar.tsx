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
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";
import { useTutorial } from '@/context/TutorialContext';
import { DEFAULT_TUTORIAL_STEPS } from '@/context/TutorialContext';

export function Sidebar() {
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
  
  const routes = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/properties", label: "Proprietà", icon: Building2 },
    { path: "/tenants", label: "Inquilini", icon: Users },
    { path: "/transactions", label: "Transazioni", icon: Receipt },
    { path: "/contracts", label: "Contratti", icon: FileText },
    { path: "/activities", label: "Attività", icon: CalendarClock },
    { 
      path: "/tourism", 
      label: "Locazioni Turistiche", 
      icon: Palmtree,
      submenu: [
        { path: "/tourism/properties", label: "Proprietà" },
        { path: "/tourism/bookings", label: "Prenotazioni" }
      ]
    },
    { path: "/reports", label: "Report & Analytics", icon: LineChart },
  ];
  
  const handleTutorialClick = () => {
    console.log('Click su guida interattiva rilevato');
    startTutorial();
    console.log('Tutorial avviato');
  };
  
  return (
    <>
      {/* Mobile sidebar toggle */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>
    
      {/* Sidebar background overlay on mobile */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-20 flex h-full w-64 flex-col border-r bg-card transition-transform duration-300 md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Sidebar header */}
        <div className="border-b p-4">
          <h2 className="text-xl font-semibold">Gestionale Affitti</h2>
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
                                onClick={() => {
                                  if (window.innerWidth < 768) {
                                    setIsOpen(false);
                                  }
                                }}
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
                      onClick={() => {
                        if (window.innerWidth < 768) {
                          setIsOpen(false);
                        }
                      }}
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
