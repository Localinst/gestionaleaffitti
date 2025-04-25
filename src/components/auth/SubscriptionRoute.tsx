import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSubscription } from '@/context/SubscriptionContext';
import { ReactNode } from 'react';

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
  const { hasActiveSubscription, isLoading: isLoadingSubscription } = useSubscription();
  
  // Se stiamo caricando i dati dell'utente o dell'abbonamento, mostriamo un caricamento
  if (isLoadingAuth || isLoadingSubscription) {
    return <div className="flex items-center justify-center h-screen">
      <p>Caricamento...</p>
    </div>;
  }
  
  // Se l'utente non è autenticato, reindirizza al login
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  // Se l'utente è autenticato ma non ha un abbonamento attivo, reindirizza alla pagina di acquisto
  if (!hasActiveSubscription) {
    return <Navigate to="/subscribe" />;
  }
  
  // Altrimenti, mostra il contenuto protetto
  return <>{children}</>;
}; 