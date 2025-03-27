import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase, verifyApiKey } from '@/lib/supabase';
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

// Funzione per formattare i dati dell'utente
const formatUser = (user: User | null): UserData | null => {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email ?? '',
    name: user.user_metadata?.full_name || user.email || 'Utente',
    role: user.app_metadata?.role || 'user',
  };
};

// Funzione utility per pulire i flag di errore 401 nel localStorage
const clearError401Flags = () => {
  const flagsToRemove: string[] = [];
  
  // Cerca tutti i flag di errore 401 nel localStorage
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('error401_logged_')) {
      flagsToRemove.push(key);
    }
  }
  
  // Rimuovi tutti i flag trovati
  flagsToRemove.forEach(key => localStorage.removeItem(key));
  
  // Rimuovi anche il flag generico di "no token"
  localStorage.removeItem('logged_no_token');
};

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

// Provider del contesto
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiKeyValid, setApiKeyValid] = useState(true);
  const navigate = useNavigate();

  // Verifica la chiave API all'avvio
  useEffect(() => {
    const checkApiKey = async () => {
      const result = await verifyApiKey();
      if (!result.success) {
        setApiKeyValid(false);
        toast.error('Errore di configurazione Supabase', {
          description: `Verifica la chiave API: ${result.error}`,
          duration: 6000,
        });
        console.error('Chiave API Supabase non valida:', result.error);
      } else {
        setApiKeyValid(true);
      }
    };
    
    checkApiKey();
  }, []);

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
        
        // Se c'è un token, considerare l'utente autenticato
        // Decodifica del token JWT per estrarre i dati dell'utente
        try {
          // Ottieni l'utente dalle informazioni del token
          // Questa parte è semplificata, in produzione dovresti verificare il token
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            const payload = JSON.parse(atob(tokenParts[1]));
            console.log('Token JWT decodificato:', payload);
            
            // Estrai i dati dell'utente dal payload
            const userData: UserData = {
              id: payload.id || payload.sub,
              email: payload.email || '',
              name: payload.name || 'Utente',
              role: payload.role || 'user',
            };
            
            console.log('Utente autenticato dal token JWT:', userData);
            setUser(userData);
            
            // Pulisci i flag di errore 401 quando ripristiniamo una sessione valida
            clearError401Flags();
          } else {
            console.error('Formato token non valido');
            localStorage.removeItem('authToken');
            setUser(null);
          }
        } catch (decodeError) {
          console.error('Errore nella decodifica del token JWT:', decodeError);
          localStorage.removeItem('authToken');
          setUser(null);
        }
      } catch (error) {
        console.error('Errore durante il recupero dell\'utente:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    // Recupera l'utente all'avvio
    fetchUser();
    
    // Non è più necessario un listener per i cambiamenti di autenticazione
    // poiché stiamo usando direttamente il token JWT dal localStorage
    
    return () => {
      // Nessuna pulizia necessaria
    };
  }, []);

  // Funzione di login
  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      console.log('Tentativo di login con email:', email);
      
      // Prima prova ad autenticarsi con il backend per ottenere il token JWT
      let userData = null;
      let jwtToken = null;
      
      try {
        const response = await apiLogin({ email, password });
        
        // Salva il token JWT nel localStorage
        if (response && response.token) {
          console.log('Token JWT ricevuto dal server');
          localStorage.setItem('authToken', response.token);
          jwtToken = response.token;
          
          // Se abbiamo ricevuto dati utente dal backend, possiamo usarli
          if (response.user) {
            userData = {
              id: response.user.id.toString(),
              email: response.user.email,
              name: response.user.name,
              role: response.user.role,
            };
            
            setUser(userData);
            console.log('Login effettuato con successo (backend) per:', userData.name);
            
            // Pulisci i flag di errore 401 al login
            clearError401Flags();
            
            toast.success('Login effettuato con successo', {
              description: `Benvenuto, ${userData.name}!`,
            });
            
            navigate('/dashboard');
            return;
          }
        } else {
          console.error('Nessun token ricevuto dal server');
        }
      } catch (backendError) {
        console.error('Errore durante il login con il backend:', backendError);
        // Non lanciare l'errore qui, prova con Supabase come fallback
      }
      
      // Poi autentica anche con Supabase come fallback
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) {
          console.error('Errore durante il login Supabase:', error);
          
          // Se abbiamo già i dati utente dal backend, non fallire
          if (userData) {
            return;
          }
          
          // Altrimenti, lancia l'errore
          throw error;
        }
        
        // Se arriviamo qui, significa che Supabase ha funzionato ma il backend no.
        // In questo caso, utilizziamo i dati di Supabase
        userData = formatUser(data.user);
        setUser(userData);
        
        // Se non abbiamo già un token dal backend, proviamo a generarne uno con i dati Supabase
        if (!jwtToken) {
          // Questa è una soluzione temporanea - in produzione, dovresti sincronizzare con il backend
          console.warn('ATTENZIONE: Utilizzando un token temporaneo dalla sessione Supabase');
          localStorage.setItem('authToken', data.session?.access_token || '');
        }
        
        console.log('Login effettuato con successo (Supabase) per:', userData?.name);
        
        toast.success('Login effettuato con successo', {
          description: `Benvenuto, ${userData?.name}!`,
        });
        
        navigate('/dashboard');
      } catch (supabaseError) {
        console.error('Errore durante il login con Supabase:', supabaseError);
        // Se abbiamo già un token dal backend, non fallire
        if (jwtToken && userData) {
          return;
        }
        
        // Altrimenti, lancia l'errore combinato
        throw new Error(supabaseError.message || 'Errore durante il login');
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
      
      // Prima registra l'utente con il backend
      const response = await apiRegister({ name, email, password });
      
      // Salva il token JWT nel localStorage
      if (response && response.token) {
        console.log('Token JWT ricevuto dal server');
        localStorage.setItem('authToken', response.token);
      } else {
        console.error('Nessun token ricevuto dal server');
        throw new Error('Errore nella registrazione: token mancante');
      }
      
      // Poi registra anche con Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (error) {
        console.error('Errore durante la registrazione Supabase:', error);
        // Se fallisce Supabase ma abbiamo già il token JWT, possiamo comunque procedere
        if (response.user) {
          const userData = {
            id: response.user.id.toString(),
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
          };
          
          setUser(userData);
          console.log('Registrazione completata con successo (solo backend) per:', userData.name);
          
          toast.success('Registrazione completata con successo', {
            description: `Benvenuto, ${userData.name}!`,
          });
          
          navigate('/dashboard');
          return;
        } else {
          throw error;
        }
      }
      
      const userData = formatUser(data.user);
      setUser(userData);
      
      console.log('Registrazione completata con successo per:', userData?.name);
      
      toast.success('Registrazione completata con successo', {
        description: `Benvenuto, ${userData?.name}!`,
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Errore durante la registrazione:', error);
      
      // Gestione specifica per errori di email già esistente
      if (error?.message?.includes('User already registered')) {
        toast.error('Email già registrata', {
          description: 'Utilizza un\'altra email o effettua il login',
        });
      }
      // Gestione specifica per errori CORS o di connessione
      else if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        toast.error('Impossibile connettersi al server', {
          description: 'Verifica che il server sia in esecuzione',
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
      
      // Elimina il token JWT da localStorage
      localStorage.removeItem('authToken');
      
      // Pulisci i flag di errore 401 al logout
      clearError401Flags();
      
      // Chiama l'API di logout del backend
      try {
        await apiLogout();
      } catch (error) {
        console.warn('Errore durante la chiamata di logout al backend:', error);
        // Continuare comunque, poiché abbiamo già rimosso il token
      }
      
      // Logout da Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Errore durante il logout Supabase:', error);
        // Non lanciare l'errore, il token è già stato rimosso
      }
      
      setUser(null);
      
      toast.success('Logout effettuato con successo');
      
      navigate('/login');
    } catch (error: any) {
      console.error('Errore durante il logout:', error);
      
      toast.error('Errore durante il logout', {
        description: error?.message || 'Si è verificato un errore',
      });
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