import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LandingNav } from "@/components/layout/LandingNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTranslation } from "react-i18next";
import { changeLanguage } from "@/i18n";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [autoLoginChecked, setAutoLoginChecked] = useState(false);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const { login, isAuthenticated, user, autoLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const from = location.state?.from || "/dashboard";

  // Gestisci il parametro di query 'lang'
  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam) {
      changeLanguage(langParam);
    }
  }, [searchParams]);

  // Controllo se esiste già un token nel localStorage e se l'utente è autenticato
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Utilizziamo autoLogin già estratto dal hook a livello di componente
        const isAutoLoggedIn = await autoLogin();
        
        if (isAutoLoggedIn) {
          // Se l'utente è stato autenticato automaticamente, mostra un messaggio
          toast.success('Login automatico effettuato', {
            description: `Bentornato!`,
          });
          
          // Reindirizza alla dashboard o alla pagina precedente
          navigate(from, { replace: true });
        }
      } catch (error) {
        console.error('Errore durante il controllo dello stato di autenticazione:', error);
      } finally {
        // Indipendentemente dal risultato, segna il check come completato
        setAutoLoginChecked(true);
      }
    };
    
    checkAuthStatus();
  }, [navigate, from, autoLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Inserisci email e password");
      return;
    }
    
    try {
      setIsLoading(true);
      await login(email, password);
      
      // La lingua corrente è già salvata nelle impostazioni dall'app 
      // tramite il componente LanguageSwitcher o dal parametro di query
      
      navigate(from, { replace: true });
    } catch (error: any) {
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        setShowWaitMessage(true);
      } else {
        setShowWaitMessage(false);
      }
      console.error("Errore durante il login:", error); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Inserisci la tua email", {
        description: "Inserisci l'indirizzo email associato al tuo account nel campo Email.",
      });
      return;
    }

    setIsForgotPasswordLoading(true);
    toast.info("Invio richiesta di reset password...");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        // Specifica l'URL a cui l'utente sarà reindirizzato dopo aver cliccato
        // il link nell'email. Assicurati che corrisponda a un URL configurato in Supabase.
        redirectTo: `${window.location.origin}/update-password`, 
      });

      if (error) {
        console.error("Errore Supabase reset password:", error);
        // Controlla errori specifici se necessario (es. rate limit)
        throw new Error(error.message || "Errore durante l'invio dell'email di reset.");
      }

      toast.success("Email di reset inviata!", {
        description: "Controlla la tua casella di posta (e la cartella Spam) per le istruzioni su come resettare la password.",
        duration: 8000, // Messaggio più lungo
      });

    } catch (error: any) {
      toast.error("Errore invio email", {
        description: error.message || "Si è verificato un errore.",
      });
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Mostra un indicatore di caricamento finché non abbiamo verificato lo stato di autenticazione
  if (!autoLoginChecked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
         
          
          
          
          <div className="bg-card border rounded-lg p-6 shadow-sm">
          <div className="text-center my-6">
            <h1 className="text-2xl font-bold tracking-tight">Accedi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Inserisci le tue credenziali per accedere
            </p>
          </div>
                        
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@esempio.com"
                  required
                  autoComplete="email"
                  disabled={isLoading || isForgotPasswordLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button 
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    disabled={isForgotPasswordLoading}
                    className="p-0 h-auto text-xs text-primary hover:underline"
                  >
                    {isForgotPasswordLoading ? 'Invio...' : 'Password dimenticata?'}
                  </Button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading || isForgotPasswordLoading}
                    className="pr-10"
                  />
                  <Button 
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Nascondi password" : "Mostra password"}
                    disabled={isLoading || isForgotPasswordLoading}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || isForgotPasswordLoading}
              >
                {isLoading ? 'Accesso in corso...' : 'Accedi'}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <p>
                Non hai un account?{" "}
                <Link to="/register" className="text-primary hover:underline">
                  Registrati
                </Link>
              </p>
            </div>
            
            <div className="mt-4 text-center text-sm">
              <Link to="/" className="text-muted-foreground hover:text-primary">
                ← Torna alla home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 