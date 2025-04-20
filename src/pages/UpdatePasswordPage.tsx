import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hash = location.hash;
    console.log("Location hash:", hash);
    
    const queryParamsIndex = hash.indexOf('?');
    if (queryParamsIndex !== -1) {
        const queryString = hash.substring(queryParamsIndex + 1);
        const urlParams = new URLSearchParams(queryString);
        const token = urlParams.get('access_token');
        
        if (token) {
            console.log("Access token trovato nell'hash:", token);
            setAccessToken(token);
            setError(null);
        } else {
            console.log("access_token non trovato nei parametri dell'hash.");
            setError("Token di recupero non trovato nell'URL.");
            setAccessToken(null);
        }
    } else {
         console.log("Nessun parametro query trovato nell'hash.");
         setError("Link di recupero password non valido.");
         setAccessToken(null);
    }

  }, [location.hash]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accessToken) {
       setError("Impossibile procedere: token di recupero mancante o non valido.");
       return;
    }

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
      const { data, error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (updateError) {
        console.error("Errore Supabase update password:", updateError);
        if (updateError.message.includes("same password")) {
            throw new Error("La nuova password non può essere uguale alla vecchia.");
        } else if (updateError.message.includes("session not found")) {
            throw new Error("Sessione scaduta o non valida. Potrebbe essere necessario verificare il token OTP manualmente.");
        }
        throw new Error(updateError.message || "Errore durante l'aggiornamento della password.");
      }

      console.log('Password aggiornata con successo:', data);
      toast.success("Password aggiornata con successo!", {
        description: "Ora puoi effettuare il login con la tua nuova password.",
      });
      setTimeout(() => navigate('/login'), 2000);

    } catch (err: any) {
      setError(err.message || "Si è verificato un errore imprevisto.");
    } finally {
      setIsLoading(false);
    }
  };

  if (accessToken === null && error) {
       return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
              <Card className="w-full max-w-md">
                  <CardHeader>
                      <CardTitle>Link Non Valido</CardTitle>
                      <CardDescription>{error}</CardDescription>
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
  
   if (accessToken === null && !error) {
        return (
          <div className="flex items-center justify-center min-h-screen bg-gray-100">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Lettura del link...</span>
          </div>
      );
   }

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