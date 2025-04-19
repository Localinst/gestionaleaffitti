import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function UpdatePasswordPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null); // null = non verificato, true = valido, false = non valido/assente
  const navigate = useNavigate();

  // Verifica il token all'avvio del componente
  useEffect(() => {
    // Supabase gestisce il token nel fragment URL automaticamente all'inizializzazione
    // o tramite onAuthStateChange. Qui verifichiamo solo se c'è una sessione attiva
    // derivante dal token.
    const checkSession = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
          console.error("Errore nel recupero sessione:", sessionError);
          setError("Errore durante la verifica dell'autenticazione.");
          setIsTokenValid(false);
          return;
      }
      
      // Se c'è una sessione attiva, il token era valido
      if (session) {
          console.log("Sessione valida trovata, token OK.");
          setIsTokenValid(true);
      } else {
          // Se non c'è sessione, il token potrebbe essere scaduto o non valido
          console.log("Nessuna sessione valida, token scaduto o non valido.");
          setError("Il link di reset password non è valido o è scaduto. Richiedine uno nuovo.");
          setIsTokenValid(false);
      }
    };
    
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Resetta errori precedenti

    if (!newPassword || !confirmPassword) {
      setError("Inserisci e conferma la nuova password.");
      return;
    }
    if (newPassword.length < 6) {
      setError("La nuova password deve essere lunga almeno 6 caratteri.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setIsLoading(true);

    try {
      // La libreria Supabase dovrebbe usare automaticamente la sessione/token 
      // stabilita dal link cliccato per autenticare questa chiamata.
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) {
        console.error("Errore Supabase update password:", updateError);
        // Gestisci errori comuni
        if (updateError.message.includes("same password")) {
            throw new Error("La nuova password non può essere uguale alla vecchia.");
        } else if (updateError.message.includes("session not found")) {
            throw new Error("Sessione scaduta o non valida. Riprova il processo di reset.");
        }
        throw new Error(updateError.message || "Errore durante l'aggiornamento della password.");
      }

      console.log('Password aggiornata con successo:', data);
      toast.success("Password aggiornata con successo!", {
        description: "Ora puoi effettuare il login con la tua nuova password.",
      });
      // Reindirizza alla pagina di login dopo un breve ritardo
      setTimeout(() => navigate('/login'), 2000);

    } catch (err: any) {
      setError(err.message || "Si è verificato un errore imprevisto.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render condizionale basato sulla validità del token
  if (isTokenValid === null) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Verifica del link in corso...</span>
          </div>
      );
  }
  
  if (isTokenValid === false) {
      return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
              <Card className="w-full max-w-md">
                  <CardHeader>
                      <CardTitle>Link Non Valido</CardTitle>
                      <CardDescription>{error || "Il link utilizzato non è valido o è scaduto."}</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={() => navigate('/login')} className="w-full">
                          Torna al Login
                      </Button>
                  </CardContent>
              </Card>
          </div>
      );
  }

  // Se il token è valido, mostra il form
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Imposta Nuova Password</CardTitle>
          <CardDescription>
            Inserisci la tua nuova password sicura qui sotto.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nuova Password */}
            <div className="space-y-2">
              <Label htmlFor="new-password">Nuova Password</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  disabled={isLoading}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            {/* Conferma Password */}
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Conferma Nuova Password</Label>
               <div className="relative">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                 <Button 
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                 >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                 </Button>
               </div>
            </div>
            
            {/* Messaggio di Errore */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Aggiornamento...
                </>
              ) : (
                'Imposta Nuova Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 