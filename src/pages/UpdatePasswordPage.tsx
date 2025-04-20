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

  // Verifica il token e lo stato di autenticazione all'avvio
  useEffect(() => {
    // Imposta lo stato iniziale a "loading"
    setIsTokenValid(null);
    setError(null);

    // Ascolta i cambiamenti nello stato di autenticazione
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('onAuthStateChange event:', event);
      console.log('onAuthStateChange session:', session);

      // Gli eventi rilevanti dopo il click sul link di recovery sono
      // solitamente INITIAL_SESSION (se la pagina viene caricata la prima volta)
      // o USER_UPDATED (se l'utente era già loggato e poi clicca).
      // In alcuni casi, potrebbe essere SIGNED_IN.

      // La presenza di una sessione valida indica che il token era buono.
      if (session) {
        // Verifica se l'utente è arrivato qui tramite un link di recovery
        // (l'evento potrebbe essere diverso a seconda dello stato precedente)
        // Controlliamo se l'evento è uno di quelli che indicano un login/update riuscito
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'PASSWORD_RECOVERY') {
            console.log("Sessione valida rilevata tramite onAuthStateChange, token OK.");
            setIsTokenValid(true);
            setError(null); // Pulisce eventuali errori precedenti di "link non valido"
        } else {
            // Se c'è una sessione ma l'evento non è quello atteso per il recovery,
            // potrebbe essere una sessione normale. Consideriamo il link non valido per sicurezza.
            console.warn("Sessione presente ma evento non corrisponde a recovery:", event);
            setError("Link non valido o sessione non pertinente.");
            setIsTokenValid(false);
        }
      } else {
        // Nessuna sessione = token non valido, scaduto o assente.
        console.log("Nessuna sessione valida rilevata tramite onAuthStateChange.");
        // Mostra l'errore solo se non è già stato impostato da una verifica precedente
        if (isTokenValid !== false) { // Evita di sovrascrivere un errore più specifico
             setError("Il link di reset password non è valido o è scaduto. Richiedine uno nuovo.");
        }
        setIsTokenValid(false);
      }
      
      // Potremmo voler smettere di ascoltare dopo il primo evento utile,
      // ma per ora lo lasciamo attivo.
    });

    // Cleanup: Rimuovi l'ascoltatore quando il componente viene smontato
    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
        console.log("Unsubscribed from onAuthStateChange");
      }
    };
  }, []); // Esegui solo al montaggio

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