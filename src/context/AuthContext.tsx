import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { login as apiLogin, register as apiRegister, logout as apiLogout } from '@/services/api';

// Interfaccia per i dati dell'utente
interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

// Interfaccia per il contesto di autenticazione
interface AuthContextProps {
  user: UserData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Creazione del contesto
const AuthContext = createContext<AuthContextProps>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

// Hook per utilizzare il contesto
export const useAuth = () => useContext(AuthContext);

// Funzione per decodificare il token JWT in modo sicuro
const decodeJwtToken = (token: string): UserData | null => {
  try {
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      console.error('Formato token non valido');
      return null;
    }
    
    const payload = JSON.parse(atob(tokenParts[1]));
    
    return {
      id: payload.id || payload.sub,
      email: payload.email || '',
      name: payload.name || 'Utente',
      role: payload.role || 'user',
    };
  } catch (error) {
    console.error('Errore nella decodifica del token JWT:', error);
    return null;
  }
};

// Provider del contesto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Recupera l'utente corrente all'avvio
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setIsLoading(true);
        
        // Controlla se c'è un token JWT nel localStorage
        const token = localStorage.getItem('authToken');
        
        if (!token) {
          console.log('Nessun token JWT trovato nel localStorage');
          setUser(null);
          setIsLoading(false);
          return;
        }
        
        // Decodifica il token JWT e recupera i dati dell'utente
        const userData = decodeJwtToken(token);
        
        if (userData) {
          console.log('Utente autenticato dal token JWT:', userData);
          setUser(userData);
        } else {
          // Token non valido
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } catch (error) {
        console.error('Errore durante il recupero dell\'utente:', error);
        localStorage.removeItem('authToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Recupera l'utente all'avvio
    fetchUser();
  }, []);

  // Funzione di login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('Tentativo di login con email:', email);
      
      // Autenticazione tramite il backend
      const response = await apiLogin({ email, password });
      
      // Salva il token JWT nel localStorage
      if (response && response.token) {
        console.log('Token JWT ricevuto dal server');
        localStorage.setItem('authToken', response.token);
        
        // Se abbiamo ricevuto dati utente dal backend, possiamo usarli
        if (response.user) {
          const userData = {
            id: response.user.id.toString(),
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
          };
          
          setUser(userData);
          console.log('Login effettuato con successo per:', userData.name);
          
          toast.success('Login effettuato con successo', {
            description: `Benvenuto, ${userData.name}!`,
          });
          
          // Verifica lo stato dell'abbonamento dell'utente prima di reindirizzare
          try {
            // Importa direttamente la funzione getUserSubscriptions
            const { getUserSubscriptions } = await import('@/services/lemon-squeezy-api');
            const subscriptionsResponse = await getUserSubscriptions(userData.id);
            const subscriptions = subscriptionsResponse?.data || [];
            
            // Controlla se c'è almeno una sottoscrizione attiva
            const hasActiveSubscription = subscriptions.some(
              (subscription: any) => 
                subscription.attributes?.status === 'active' || 
                subscription.attributes?.status === 'on_trial'
            );
            
            console.log('Stato abbonamento:', hasActiveSubscription ? 'Attivo' : 'Non attivo');
            
            // Reindirizza in base allo stato dell'abbonamento
            if (hasActiveSubscription) {
              navigate('/dashboard');
            } else {
              // Se non ha un abbonamento attivo, reindirizza alla pagina di abbonamento protetta
              navigate('/subscribe');
            }
          } catch (subscriptionError) {
            console.error('Errore nel controllo dello stato dell\'abbonamento:', subscriptionError);
            // In caso di errore nella verifica, reindirizza comunque alla dashboard
            navigate('/dashboard');
          }
        } else {
          // Se non ci sono dati utente nella risposta, decodifica dal token
          const userData = decodeJwtToken(response.token);
          if (userData) {
            setUser(userData);
            toast.success('Login effettuato con successo', {
              description: `Benvenuto, ${userData.name}!`,
            });
            
            // Anche qui, verifica lo stato dell'abbonamento
            try {
              const { getUserSubscriptions } = await import('@/services/lemon-squeezy-api');
              const subscriptionsResponse = await getUserSubscriptions(userData.id);
              const subscriptions = subscriptionsResponse?.data || [];
              
              const hasActiveSubscription = subscriptions.some(
                (subscription: any) => 
                  subscription.attributes?.status === 'active' || 
                  subscription.attributes?.status === 'on_trial'
              );
              
              console.log('Stato abbonamento:', hasActiveSubscription ? 'Attivo' : 'Non attivo');
              
              if (hasActiveSubscription) {
                navigate('/dashboard');
              } else {
                navigate('/subscribe');
              }
            } catch (subscriptionError) {
              console.error('Errore nel controllo dello stato dell\'abbonamento:', subscriptionError);
              navigate('/dashboard');
            }
          } else {
            throw new Error('Dati utente non validi');
          }
        }
      } else {
        console.error('Nessun token ricevuto dal server');
        throw new Error('Nessun token ricevuto dal server');
      }
    } catch (error: any) {
      console.error('Errore durante il login:', error);
      
      // Gestione specifica per errori di credenziali
      if (error?.message?.includes('Invalid login credentials') || 
          error?.message?.includes('Credenziali non valide')) {
        toast.error('Credenziali non valide', {
          description: 'Verifica email e password',
        });
      }
      // Gestione specifica per errori CORS o di connessione
      else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Impossibile connettersi al server', {
          description: 'Verifica che il server sia in esecuzione',
        });
      } else {
        toast.error('Errore durante il login', {
          description: error?.message || 'Si è verificato un errore',
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione di registrazione
  const register = async (name: string, email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('Tentativo di registrazione con email:', email);
      
      // Registra l'utente con il backend
      const response = await apiRegister({ name, email, password });
      
      // Salva il token JWT nel localStorage
      if (response && response.token) {
        localStorage.setItem('authToken', response.token);
        
        if (response.user) {
          const userData = {
            id: response.user.id.toString(),
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
          };
          
          setUser(userData);
          console.log('Registrazione completata con successo per:', userData.name);
          
          toast.success('Registrazione completata con successo', {
            description: `Benvenuto, ${userData.name}!`,
          });
          
          // Controlla se l'utente stava cercando di abbonarsi
          const selectedPlanData = localStorage.getItem('selectedPlan');
          if (selectedPlanData) {
            try {
              // Importa la funzione createCheckout direttamente qui
              const { createCheckout } = await import('@/services/lemon-squeezy-api');
              
              // Ottieni i dettagli del piano dal localStorage
              const planDetails = JSON.parse(selectedPlanData);
              
              // Log dettagliato per debug
              console.log('Dettagli piano selezionato:', planDetails);
              
              // Valida l'ID della variante
              if (!planDetails.variantId || 
                  (planDetails.variantId === 'monthly-variant-id' || 
                   planDetails.variantId === 'annual-variant-id') && 
                   !planDetails.variantId.includes('lemonsqueezy.com/buy/')) {
                console.error('ID variante non valido o placeholder:', planDetails.variantId);
                toast.error('Configurazione piano non valida', { 
                  description: 'Contatta l\'amministratore del sistema.' 
                });
                
                // In caso di errore, reindirizza alla pagina di pricing
                localStorage.removeItem('selectedPlan');
                navigate('/pricing');
                return;
              }
              
              if (planDetails.variantId) {
                toast.info('Inizializzazione del processo di pagamento...');
                
                try {
                  // Crea il checkout direttamente
                  const customData = {
                    userId: userData.id,
                    planName: planDetails.name,
                  };
                  
                  console.log('Invio richiesta checkout con parametri:', {
                    variantId: planDetails.variantId,
                    email: userData.email,
                    customData
                  });
                  
                  const checkoutData = await createCheckout(
                    planDetails.variantId,
                    userData.email,
                    customData
                  );
                  
                  // Rimuovi l'informazione sul piano dal localStorage
                  localStorage.removeItem('selectedPlan');
                  
                  // Redirect all'URL del checkout Lemon Squeezy
                  if (checkoutData.data.attributes.url) {
                    window.location.href = checkoutData.data.attributes.url;
                    return; // Termina l'esecuzione qui
                  } else {
                    throw new Error('URL di checkout mancante nella risposta');
                  }
                } catch (checkoutError: any) {
                  console.error('Dettaglio errore checkout:', checkoutError.response?.data || checkoutError);
                  toast.error('Errore durante l\'avvio del checkout', { 
                    description: 'Verrai reindirizzato alla pagina dei piani.' 
                  });
                  // In caso di errore, reindirizza alla pagina di pricing
                  localStorage.removeItem('selectedPlan');
                  navigate('/pricing');
                  return;
                }
              }
            } catch (error: any) {
              console.error('Errore durante la creazione del checkout dopo registrazione:', error);
              console.error('Dettaglio risposta:', error.response?.data);
              
              // In caso di errore, reindirizza alla pagina di pricing come fallback
              localStorage.removeItem('selectedPlan');
              navigate('/pricing');
              return;
            }
          } else {
            // Se l'utente non stava cercando di abbonarsi, reindirizza
            // alla pagina di pricing protetta invece che alla dashboard
            navigate('/subscribe');
          }
        } else {
          throw new Error('Dati utente mancanti nella risposta');
        }
      } else {
        throw new Error('Token mancante nella risposta');
      }
    } catch (error: any) {
      console.error('Errore durante la registrazione:', error);
      
      if (error?.message?.includes('already registered')) {
        toast.error('Email già registrata', {
          description: 'Prova ad effettuare il login',
        });
      } else {
        toast.error('Errore durante la registrazione', {
          description: error?.message || 'Si è verificato un errore',
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Funzione di logout
  const logout = async () => {
    try {
      setIsLoading(true);
      
      // Chiama l'API di logout (facoltativo, dipende dall'implementazione)
      try {
        await apiLogout();
      } catch (error) {
        console.error('Errore durante la chiamata API di logout:', error);
        // Continua comunque con il logout locale
      }
      
      // Pulisci il localStorage e lo stato
      localStorage.removeItem('authToken');
      setUser(null);
      
      toast.success('Logout effettuato con successo');
      navigate('/login');
    } catch (error) {
      console.error('Errore durante il logout:', error);
      toast.error('Errore durante il logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}; 