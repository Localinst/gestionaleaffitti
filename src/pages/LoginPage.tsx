import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LandingNav } from "@/components/layout/LandingNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Recupera la pagina di origine, se presente
  const from = location.state?.from || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Inserisci email e password");
      return;
    }
    
    try {
      setIsLoading(true);
      setShowWaitMessage(true);
      
      // Simula accesso immediato (senza toast e senza delay)
      try {
        // Creazione di un token fasullo per la demo
        const demoToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1IiwiZW1haWwiOiJkZW1vQHRlbm9yaXMzNjAuY29tIiwibmFtZSI6IlV0ZW50ZSBEaW1vc3RyYXRpdm8iLCJyb2xlIjoidXNlciIsImlhdCI6MTYxOTAxMjM0NX0.TnYzX9Q-A8nf_bIA6cQ1MP4O2hW4vFMkW55pzKfaQQE";
        
        // Salva il token nel localStorage
        localStorage.setItem('authToken', demoToken);
        
        // Reindirizza alla dashboard
        navigate('/dashboard');
      } catch (error) {
        console.error("Errore durante la simulazione del login:", error);
        setShowWaitMessage(false);
        setIsLoading(false);
      }
      
    } catch (error) {
      console.error("Errore durante il login:", error);
      setShowWaitMessage(false);
      setIsLoading(false);
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
          
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            {showWaitMessage && (
              <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
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
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link
                    to="#"
                    className="text-xs text-primary hover:underline"
                  >
                    Password dimenticata?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                Accedi
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