import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserSubscriptions } from '@/services/lemon-squeezy-api';
import axios from 'axios';

// Interfaccia per il contesto dell'abbonamento
interface SubscriptionContextProps {
  hasActiveSubscription: boolean;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<boolean>;
}

// Creazione del contesto
const SubscriptionContext = createContext<SubscriptionContextProps>({
  hasActiveSubscription: false,
  isLoading: true,
  checkSubscriptionStatus: async () => false,
});

// Hook per utilizzare il contesto
export const useSubscription = () => useContext(SubscriptionContext);

// Provider del contesto
export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const checkSubscriptionStatus = async (): Promise<boolean> => {
    // Se non c'è un utente, non può avere un abbonamento
    if (!user) {
      setHasActiveSubscription(false);
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      
      if (user.id) {
        // Ottieni il token di autenticazione
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.error('Token di autenticazione mancante');
          setHasActiveSubscription(false);
          return false;
        }
        
        // Effettua una chiamata API diretta al backend con il token di autenticazione
        const response = await axios.get(`/api/lemon-squeezy/subscriptions?filter[user_id]=${user.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Verifica se ci sono sottoscrizioni attive
        const subscriptions = response.data?.data || [];
        
        // Una sottoscrizione è attiva se è presente e il suo status è 'active' o 'on_trial'
        const hasActiveSubscription = subscriptions.some(
          (subscription: any) => 
            subscription.attributes?.status === 'active' || 
            subscription.attributes?.status === 'on_trial'
        );
        
        setHasActiveSubscription(hasActiveSubscription);
        return hasActiveSubscription;
      }
      
      return false;
    } catch (error) {
      console.error('Errore durante la verifica dello stato dell\'abbonamento:', error);
      
      // In produzione, se c'è un errore di comunicazione, è meglio non bloccare l'utente
      // ma questo comportamento può essere modificato in base alle esigenze aziendali
      const serverIsDown = !navigator.onLine || axios.isAxiosError(error) && !error.response;
      
      if (serverIsDown) {
        // Se il server non è raggiungibile, potremmo permettere l'accesso temporaneo
        console.warn('Server non raggiungibile, accesso temporaneo consentito');
        setHasActiveSubscription(true);
        return true;
      }
      
      setHasActiveSubscription(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Controlla lo stato dell'abbonamento quando l'utente cambia
  useEffect(() => {
    checkSubscriptionStatus();
  }, [user]);

  return (
    <SubscriptionContext.Provider
      value={{
        hasActiveSubscription,
        isLoading,
        checkSubscriptionStatus,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}; 