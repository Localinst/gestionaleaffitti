import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
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

  // Funzione per ottenere la base URL dell'API
  const getAPIBaseUrl = () => {
    // In produzione usa l'URL corretto
    if (window.location.hostname !== 'localhost') {
      return 'https://gestionaleaffitti.onrender.com/api';
    }
    // In locale usa localhost:3000
    return 'http://localhost:3000/api';
  };

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
      
      if (user.email) {
        console.log('SubscriptionContext: Verifica abbonamento per utente', user.email);
        // Ottieni il token di autenticazione
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.error('Token di autenticazione mancante');
          setHasActiveSubscription(false);
          return false;
        }
        
        // Usa l'URL completo del backend
        const apiBaseUrl = getAPIBaseUrl();
        console.log(`SubscriptionContext: Usando base URL API: ${apiBaseUrl}`);
        
        // Effettua una chiamata API al backend per verificare lo stato dell'abbonamento con Stripe
        // Usa l'email dell'utente invece dell'ID
        const response = await axios.get(`${apiBaseUrl}/payments/check-subscription-status?userEmail=${encodeURIComponent(user.email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        // Verifica lo stato dell'abbonamento
        const isActive = response.data?.active === true;
        console.log('SubscriptionContext: Abbonamento attivo?', isActive);
        
        // Se stiamo forzando la verifica (dopo un pagamento) e l'abbonamento non è attivo
        // potrebbe esserci un ritardo nella sincronizzazione con Stripe, ottimisticamente imposta a true
        if (force && !isActive) {
          console.log('SubscriptionContext: Forzatura verifica dopo pagamento, impostazione temporanea a true');
          setHasActiveSubscription(true);
          
          // Riprova tra 5 secondi per verificare nuovamente lo stato reale
          setTimeout(() => {
            console.log('SubscriptionContext: Ri-verifica abbonamento dopo ritardo');
            checkSubscriptionStatus(true);
          }, 5000);
          
          return true;
        }
        
        setHasActiveSubscription(isActive);
        checkedInSession.current = true; // Segna che abbiamo verificato in questa sessione
        return isActive;
      }
      
      console.log('SubscriptionContext: Email utente non valida');
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
      
      // Se stiamo forzando la verifica dopo un pagamento e c'è un errore
      // consideriamo l'abbonamento come valido temporaneamente
      if (force) {
        console.log('SubscriptionContext: Errore durante verifica forzata, impostazione temporanea a true');
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