import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import axios from 'axios';
import { setSubscriptionContextHandle } from '../services/api';

// Interfaccia per il contesto dell'abbonamento
interface SubscriptionContextProps {
  hasActiveSubscription: boolean;
  isInTrialPeriod: boolean;
  trialDaysRemaining: number;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<boolean>;
  handleSubscriptionError: (error: any) => void;
}

const SubscriptionContext = createContext<SubscriptionContextProps | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription deve essere usato all\'interno di SubscriptionProvider');
  }
  return context;
};

// Provider del contesto
export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(false);
  const [trialDaysRemaining, setTrialDaysRemaining] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const checkedInSession = useRef(false);

  // Funzione per ottenere la base URL dell'API
  const getAPIBaseUrl = () => {
    if (window.location.hostname !== 'localhost') {
      return 'https://gestionaleaffitti.onrender.com/api';
    }
    return 'http://localhost:3000/api';
  };

  // Funzione per gestire specificamente gli errori 403 relativi all'abbonamento
  const handleSubscriptionError = useCallback((error: any) => {
    if (axios.isAxiosError(error) && error.response?.status === 403) {
      const responseData = error.response.data;
      
      if (responseData?.trialExpired && responseData?.subscribed === false) {
        setHasActiveSubscription(false);
        setIsInTrialPeriod(false);
        setTrialDaysRemaining(0);
        checkedInSession.current = true;
        return true;
      }
    }
    return false;
  }, []);

  const checkSubscriptionStatus = useCallback(async (force = false): Promise<boolean> => {
    if (checkedInSession.current && !force) {
      return hasActiveSubscription || isInTrialPeriod;
    }

    if (!user) {
      setHasActiveSubscription(false);
      setIsInTrialPeriod(false);
      setTrialDaysRemaining(0);
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      
      if (user.email) {
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.error('Token di autenticazione mancante');
          setHasActiveSubscription(false);
          setIsInTrialPeriod(false);
          setTrialDaysRemaining(0);
          return false;
        }
        
        const apiBaseUrl = getAPIBaseUrl();
        
        const response = await axios.get(`${apiBaseUrl}/payments/check-subscription-status?userEmail=${encodeURIComponent(user.email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        const isActive = response.data?.active === true;
        const isTrial = response.data?.isTrial === true;
        const daysLeft = response.data?.daysLeft || 0;
        const trialEndDate = response.data?.trialEndDate;
        
        // Se l'utente ha un abbonamento attivo
        if (isActive && !isTrial) {
          setHasActiveSubscription(true);
          setIsInTrialPeriod(false);
          setTrialDaysRemaining(0);
        } 
        // Se l'utente è nel periodo di prova
        else if (isActive && isTrial) {
          setHasActiveSubscription(false);
          setIsInTrialPeriod(true);
          setTrialDaysRemaining(daysLeft);
        }
        // Se il periodo di prova è scaduto e non c'è abbonamento
        else {
          setHasActiveSubscription(false);
          setIsInTrialPeriod(false);
          setTrialDaysRemaining(0);
        }
        
        checkedInSession.current = true;
        return isActive || isTrial;
      }
      
      return false;
    } catch (error) {
      console.error('Errore durante la verifica dello stato dell\'abbonamento:', error);
      
      // Gestiamo specificamente gli errori 403 relativi all'abbonamento
      if (handleSubscriptionError(error)) {
        return false;
      }
      
      const serverIsDown = !navigator.onLine || axios.isAxiosError(error) && !error.response;
      
      if (serverIsDown) {
        console.warn('Server non raggiungibile, accesso temporaneo consentito');
        setHasActiveSubscription(true);
        return true;
      }
      
      if (force) {
        setHasActiveSubscription(true);
        return true;
      }
      
      setHasActiveSubscription(false);
      setIsInTrialPeriod(false);
      setTrialDaysRemaining(0);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user, hasActiveSubscription, isInTrialPeriod, handleSubscriptionError]);

  useEffect(() => {
    if (user && !checkedInSession.current) {
      checkSubscriptionStatus();
    }
  }, [user, checkSubscriptionStatus]);

  useEffect(() => {
    checkedInSession.current = false;
  }, [user?.id]);

  // Registra le funzioni di gestione errori con l'interceptor API
  useEffect(() => {
    // Imposta il riferimento al contesto dell'abbonamento per gli interceptor
    setSubscriptionContextHandle({
      handleSubscriptionError
    });

    return () => {
      // In caso di smontaggio, rimuovi il riferimento
      setSubscriptionContextHandle(null);
    };
  }, [handleSubscriptionError]);

  return (
    <SubscriptionContext.Provider value={{
      hasActiveSubscription,
      isInTrialPeriod,
      trialDaysRemaining,
      isLoading,
      checkSubscriptionStatus,
      handleSubscriptionError
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}; 