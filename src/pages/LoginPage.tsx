import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LandingNav } from "@/components/layout/LandingNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Inserisci email e password");
      return;
    }
    
    try {
      setIsLoading(true);
      await login(email, password);
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

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <div className="flex min-h-[calc(100vh-64px)] items-center justify-center px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Accedi</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Inserisci le tue credenziali per accedere
            </p>
          </div>
          
          <Alert className="mb-4 border-blue-200 text-blue-800 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-900/20">
            <Info className="h-4 w-4 !text-blue-800 dark:!text-blue-300" /> 
            <AlertTitle>Conferma Email Richiesta</AlertTitle>
            <AlertDescription>
              Se ti sei appena registrato, ricorda di cliccare sul link di conferma che abbiamo inviato alla tua email (controlla anche la cartella Spam).
            </AlertDescription>
          </Alert>
          
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            {showWaitMessage && (
              <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700">
                <AlertDescription>
                  Il server è temporaneamente offline per manutenzione. Attendere 30 secondi per permettere il riavvio del server. Il login verrà elaborato automaticamente.
                </AlertDescription>
              </Alert>
            )}
            
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