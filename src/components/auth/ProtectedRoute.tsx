import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Pulisci i flag di errore 401 nel localStorage quando cambia il percorso
  useEffect(() => {
    const clearError401Flags = () => {
      const flagsToRemove: string[] = [];
      
      // Cerca tutti i flag di errore 401 nel localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('error401_logged_')) {
          flagsToRemove.push(key);
        }
      }
      
      // Rimuovi tutti i flag trovati
      flagsToRemove.forEach(key => localStorage.removeItem(key));
    };
    
    clearError401Flags();
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-lg">Caricamento...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Notifica l'utente
    toast.error("Accesso negato", {
      description: "Devi effettuare il login per accedere a questa pagina",
      duration: 3000
    });
    
    // Reindirizza al login, salvando la pagina di origine per reindirizzare l'utente dopo il login
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}; 