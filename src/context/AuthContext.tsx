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
          
          navigate('/dashboard');
        } else {
          // Se non ci sono dati utente nella risposta, decodifica dal token
          const userData = decodeJwtToken(response.token);
          if (userData) {
            setUser(userData);
            toast.success('Login effettuato con successo', {
              description: `Benvenuto, ${userData.name}!`,
            });
            navigate('/dashboard');
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
          
          navigate('/dashboard');
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