import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  const checkedInSession = useRef(false);

  const checkSubscriptionStatus = useCallback(async (force = false): Promise<boolean> => {
    // Se abbiamo già verificato in questa sessione e non è forzato, usiamo lo stato attuale
    if (checkedInSession.current && !force) {
      console.log('SubscriptionContext: Usando stato abbonamento memorizzato:', hasActiveSubscription);
      return hasActiveSubscription;
    }

    // Se non c'è un utente, non può avere un abbonamento
    if (!user) {
      console.log('SubscriptionContext: Nessun utente autenticato, abbonamento impostato a false');
      setHasActiveSubscription(false);
      setIsLoading(false);
      return false;
    }

    try {
      setIsLoading(true);
      
      if (user.id) {
        console.log('SubscriptionContext: Verifica abbonamento per utente', user.id);
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
        console.log('SubscriptionContext: Sottoscrizioni trovate:', subscriptions.length);
        
        // Una sottoscrizione è attiva se è presente e il suo status è 'active' o 'on_trial'
        const hasActiveSubscription = subscriptions.some(
          (subscription: any) => {
            const status = subscription.attributes?.status;
            console.log('SubscriptionContext: Stato sottoscrizione:', status);
            return status === 'active' || status === 'on_trial';
          }
        );
        
        console.log('SubscriptionContext: Abbonamento attivo?', hasActiveSubscription);
        setHasActiveSubscription(hasActiveSubscription);
        checkedInSession.current = true; // Segna che abbiamo verificato in questa sessione
        return hasActiveSubscription;
      }
      
      console.log('SubscriptionContext: ID utente non valido');
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
  }, [user, hasActiveSubscription]); // Dipendenze

  // Controlla lo stato dell'abbonamento quando l'utente cambia (una sola volta)
  useEffect(() => {
    if (user && !checkedInSession.current) {
      console.log('SubscriptionContext: Utente cambiato, controllo abbonamento');
      checkSubscriptionStatus();
    }
  }, [user, checkSubscriptionStatus]);

  // Reset del flag quando l'utente cambia
  useEffect(() => {
    checkedInSession.current = false;
  }, [user?.id]);

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