import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSubscription } from '../../context/SubscriptionContext';
import { useAuth } from '../../context/AuthContext';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getCurrentLanguage } from '@/i18n';

interface SubscriptionRouteProps {
  children: ReactNode;
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

/**
 * Componente che verifica se l'utente ha un abbonamento attivo.
 * Se l'utente non è autenticato, viene reindirizzato al login.
 * Se l'utente è autenticato ma non ha un abbonamento attivo, viene reindirizzato alla pagina per l'acquisto.
 */
export const SubscriptionRoute: React.FC<SubscriptionRouteProps> = ({ children }) => {
  const { hasActiveSubscription, isInTrialPeriod, isLoading, checkSubscriptionStatus } = useSubscription();
  const { user } = useAuth();
  const location = useLocation();
  const [recentlyConfirmed, setRecentlyConfirmed] = useState<boolean>(false);
  const checkPerformed = useRef(false);
  const { i18n } = useTranslation();
  
  // Controlla se l'utente ha recentemente confermato un abbonamento
  useEffect(() => {
    const recentConfirmation = localStorage.getItem('subscription_recently_confirmed') === 'true';
    if (recentConfirmation) {
      console.log('SubscriptionRoute: Rilevato abbonamento recentemente confermato');
      setRecentlyConfirmed(true);
      
      // Mantieni questa informazione per 10 minuti per dare tempo al sistema di aggiornare lo stato
      setTimeout(() => {
        console.log('SubscriptionRoute: Reset flag abbonamento recentemente confermato');
        localStorage.removeItem('subscription_recently_confirmed');
        setRecentlyConfirmed(false);
      }, 10 * 60 * 1000); // 10 minuti
    }
  }, []);
  
  // Verifica l'abbonamento solo una volta al montaggio
  useEffect(() => {
    if (user && !checkPerformed.current) {
      console.log('SubscriptionRoute: Verifica iniziale abbonamento');
      checkSubscriptionStatus();
      checkPerformed.current = true;
    }
  }, [user, checkSubscriptionStatus]);

  // Se l'utente non è autenticato, reindirizza al login
  if (!user) {
    toast.error("Accesso negato", {
      description: "Devi effettuare il login per accedere a questa pagina",
      duration: 3000
    });
    
    // Reindirizza al login mantenendo i parametri di query
    return <NavigateWithQuery to="/login" state={{ from: location.pathname }} replace />;
  }

  // Se stiamo caricando, mostra un messaggio di caricamento
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg">Verifica abbonamento in corso...</p>
      </div>
    );
  }

  // Se l'utente ha un abbonamento attivo o è nel periodo di prova, mostra il contenuto
  if (hasActiveSubscription || isInTrialPeriod || recentlyConfirmed) {
    return <>{children}</>;
  }

  // Se l'utente non ha un abbonamento attivo e non è nel periodo di prova, reindirizza alla pagina dei prezzi
  toast.info("Abbonamento richiesto", {
    description: "Per accedere a questa funzionalità è necessario un abbonamento attivo",
    duration: 5000
  });
  
  // Reindirizza alla pagina dei prezzi mantenendo i parametri di query
  return <NavigateWithQuery to="/pricing" state={{ from: location }} replace />;
}; 