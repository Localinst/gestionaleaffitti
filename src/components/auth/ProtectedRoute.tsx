import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '@/i18n';
import { LinkWithQuery } from '@/components/LinkWithQuery';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

/**
 * Componente Navigate personalizzato che preserva i parametri di query
 */
const NavigateWithQuery = ({ to, ...props }: { to: string, [key: string]: any }) => {
  const location = useLocation();
  const hasSearchParams = to.includes('?');
  const newTo = hasSearchParams ? to : `${to}${location.search}`;
  return <Navigate to={newTo} {...props} />;
};

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const { i18n } = useTranslation();
  const currentLang = getCurrentLanguage();

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
    
    // Reindirizza al login, mantenendo il parametro di query e salvando la pagina di origine
    return <NavigateWithQuery to="/login" state={{ from: location.pathname }} replace />;
  }

  // Controllo del ruolo se richiesto
  if (requiredRole && user?.role !== requiredRole) {
    // Notifica l'utente che non ha i permessi
    toast.error("Accesso non autorizzato", {
      description: `Non hai i permessi necessari (${requiredRole}) per accedere a questa pagina.`,
      duration: 3000
    });
    
    // Reindirizza alla dashboard mantenendo il parametro lingua
    return <NavigateWithQuery to="/dashboard" replace />;
  }

  return <>{children}</>;
}; 