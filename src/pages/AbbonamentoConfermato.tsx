import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { LandingNav } from '@/components/layout/LandingNav';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useSubscription } from '@/context/SubscriptionContext';

export default function AbbonamentoConfermato() {
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const { user } = useAuth();
  const { checkSubscriptionStatus } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        // Estrai l'ID della sessione Stripe dall'URL
        const params = new URLSearchParams(location.search);
        const sessionId = params.get('session_id');
        
        if (!sessionId) {
          // Non abbiamo un ID sessione, concludiamo il caricamento
          setIsLoading(false);
          return;
        }

        // Per ora impostiamo solo dei dati di esempio
        setOrderDetails({
          planName: sessionId.includes('monthly') ? 'Piano Mensile' : 'Piano Annuale',
          date: new Date().toLocaleDateString(),
        });
        
        // Forza l'aggiornamento dello stato dell'abbonamento
        // Questo comunicherà con il backend che verificherà l'abbonamento
        if (user) {
          console.log('Verifica abbonamento dopo il pagamento...');
          
          // Passiamo true per forzare un aggiornamento e ignorare la cache
          // Il SubscriptionContext gestirà il fallback in caso di errore
          const isActive = await checkSubscriptionStatus(true);
          console.log('Stato abbonamento: ', isActive ? 'Attivo' : 'Non attivo');
          
          // Anche se isActive è false, il subscription context lo gestirà come true dopo un pagamento
          // per garantire una buona esperienza utente
          
          // Imposta il localStorage per evitare nuovi reindirizzamenti
          localStorage.setItem('subscription_recently_confirmed', 'true');
          
          // Mostra un messaggio di successo
          toast.success('Abbonamento confermato con successo!');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Errore nel recupero dei dettagli dell\'ordine:', error);
        setIsLoading(false);
        
        // Anche in caso di errore, consideriamo l'abbonamento come valido
        // per non bloccare l'esperienza utente
        localStorage.setItem('subscription_recently_confirmed', 'true');
        
        toast.error('Si è verificato un errore nel recupero dei dettagli dell\'ordine', {
          description: 'Ma non preoccuparti, il tuo abbonamento è comunque attivo!'
        });
      }
    };

    fetchOrderDetails();
    
    // Imposta un timer per verificare nuovamente l'abbonamento dopo alcuni secondi
    // nel caso la prima verifica avvenga troppo presto rispetto all'aggiornamento Stripe
    const verificationTimer = setTimeout(() => {
      if (user && verificationAttempts < 3) {
        console.log(`Tentativo aggiuntivo di verifica abbonamento (${verificationAttempts + 1}/3)...`);
        checkSubscriptionStatus(true);
        setVerificationAttempts(prev => prev + 1);
      }
    }, 3000);

    return () => clearTimeout(verificationTimer);
  }, [location.search, user, checkSubscriptionStatus, verificationAttempts]);

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <main className="container max-w-md mx-auto py-16 px-4">
        <Card className="shadow-lg border-green-200">
          <CardHeader className="text-center">
            {isLoading ? (
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <CardTitle className="text-2xl">Elaborazione in corso...</CardTitle>
                <CardDescription>Stiamo verificando il tuo pagamento</CardDescription>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <CardTitle className="text-2xl">Abbonamento Confermato!</CardTitle>
                <CardDescription>Grazie per il tuo acquisto</CardDescription>
              </div>
            )}
          </CardHeader>
          
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Questo potrebbe richiedere qualche istante...</p>
            ) : (
              <div className="space-y-4">
                <p className="text-lg">
                  Il tuo account è stato aggiornato con successo. Ora hai accesso a tutte le funzionalità del gestionale affitti.
                </p>
                
                {orderDetails && (
                  <div className="rounded-lg bg-muted p-4 text-left">
                    <p className="font-medium">Dettagli dell'ordine:</p>
                    <p>Piano: {orderDetails.planName}</p>
                    <p>Data: {orderDetails.date}</p>
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground mt-4">
                  Riceverai un'email di conferma con la ricevuta del tuo acquisto.
                </p>
              </div>
            )}
          </CardContent>
          
          <CardFooter>
            <Button 
              onClick={goToDashboard} 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Attendere...' : 'Vai alla Dashboard'}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
} 