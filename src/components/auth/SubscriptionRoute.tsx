import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { ReactNode, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SubscriptionRouteProps {
  children: ReactNode;
}

/**
 * Componente che verifica se l'utente ha un abbonamento attivo.
 * Se l'utente non è autenticato, viene reindirizzato al login.
 * Se l'utente è autenticato ma non ha un abbonamento attivo, viene reindirizzato alla pagina per l'acquisto.
 */
export const SubscriptionRoute: React.FC<SubscriptionRouteProps> = ({ children }) => {
  const { user, isLoading: isLoadingAuth } = useAuth();
  const { hasActiveSubscription, isLoading: isLoadingSubscription, checkSubscriptionStatus } = useSubscription();
  const location = useLocation();
  const checkPerformed = useRef(false);
  
  // Verifica l'abbonamento solo una volta al montaggio
  useEffect(() => {
    if (user && !checkPerformed.current) {
      console.log('SubscriptionRoute: Verifica iniziale abbonamento');
      checkSubscriptionStatus();
      checkPerformed.current = true;
    }
  }, [user]);

  // Se stiamo caricando i dati dell'utente o dell'abbonamento, mostriamo un caricamento
  if (isLoadingAuth || isLoadingSubscription) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg">Verifica abbonamento in corso...</p>
      </div>
    );
  }
  
  // Se l'utente non è autenticato, reindirizza al login
  if (!user) {
    toast.error("Accesso negato", {
      description: "Devi effettuare il login per accedere a questa pagina",
      duration: 3000
    });
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  
  // Se l'utente è autenticato ma non ha un abbonamento attivo, reindirizza alla pagina di acquisto
  if (!hasActiveSubscription) {
    toast.info("Abbonamento richiesto", {
      description: "Per accedere a questa funzionalità è necessario un abbonamento attivo",
      duration: 5000
    });
    return <Navigate to="/subscribe" replace />;
  }
  
  // Altrimenti, mostra il contenuto protetto
  return <>{children}</>;
}; 