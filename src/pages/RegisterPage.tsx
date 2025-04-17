import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LandingNav } from "@/components/layout/LandingNav";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showWaitMessage, setShowWaitMessage] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error("Le password non corrispondono");
      return;
    }
    
    if (password.length < 8) {
      toast.error("La password deve essere di almeno 8 caratteri");
      return;
    }
    
    try {
      setIsLoading(true);
      setShowWaitMessage(true);
      
      // Chiamata diretta alla registrazione senza toast e senza delay
      await register(name, email, password);
      
      // Il reindirizzamento viene gestito da AuthContext
      
    } catch (error) {
      console.error("Errore durante la registrazione:", error);
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
            <h1 className="text-2xl font-bold tracking-tight">Registrati</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Crea un nuovo account per iniziare
            </p>
          </div>
          
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            {showWaitMessage && (
              <Alert className="mb-6 bg-amber-50 text-amber-800 border-amber-200">
                <AlertDescription>
                  Il server è temporaneamente offline per manutenzione. Attendere 30 secondi per permettere il riavvio del server. La registrazione verrà elaborata automaticamente.
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Mario Rossi"
                  required
                  disabled={isLoading}
                />
              </div>
              
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
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
                <p className="text-xs text-muted-foreground">
                  La password deve contenere almeno 8 caratteri
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Conferma Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                Registrati
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm">
              <p>
                Hai già un account?{" "}
                <Link to="/login" className="text-primary hover:underline">
                  Accedi
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