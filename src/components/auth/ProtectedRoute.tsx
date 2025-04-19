import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

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

  // Controllo del ruolo se richiesto
  if (requiredRole && user?.role !== requiredRole) {
    // Notifica l'utente che non ha i permessi
    toast.error("Accesso non autorizzato", {
      description: `Non hai i permessi necessari (${requiredRole}) per accedere a questa pagina.`,
      duration: 3000
    });
    
    // Reindirizza alla dashboard o a una pagina di "non autorizzato"
    // Per ora reindirizziamo alla dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}; 