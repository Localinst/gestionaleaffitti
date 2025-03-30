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
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/context/AuthContext";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { logout, user } = useAuth();
  
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
  
  const routes = [
    { path: "/dashboard", label: "Dashboard", icon: BarChart3 },
    { path: "/properties", label: "Proprietà", icon: Building2 },
    { path: "/tenants", label: "Inquilini", icon: Users },
    { path: "/transactions", label: "Transazioni", icon: Receipt },
    { path: "/contracts", label: "Contratti", icon: FileText },
    { path: "/reports", label: "Report & Analytics", icon: LineChart },
  ];
  
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
              return (
                <li key={route.path}>
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
                  >
                    <Icon className="h-5 w-5" />
                    <span>{route.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>
        
        {/* Sidebar footer */}
        <div className="border-t p-4">
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
